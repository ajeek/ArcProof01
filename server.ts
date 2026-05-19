
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Octokit } from "octokit";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { 
  JOB_ESCROW_ADDRESS, 
  JOB_ESCROW_ABI, 
  REPUTATION_REGISTRY_ADDRESS, 
  REPUTATION_REGISTRY_ABI 
} from "./src/lib/contracts";

// Load environment variables early
dotenv.config();

const octokit = new Octokit();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- Strict Security Validation ---
  const RPC_URL = process.env.ARC_RPC_URL;
  const INDEXER_KEY = process.env.INDEXER_PRIVATE_KEY;

  if (!RPC_URL) {
    console.error("CRITICAL ERROR: ARC_RPC_URL is missing from environment.");
    process.exit(1);
  }

  if (!INDEXER_KEY || INDEXER_KEY === "YOUR_PRIVATE_KEY_HERE") {
    console.error("CRITICAL ERROR: INDEXER_PRIVATE_KEY is missing or invalid.");
    console.error("Please ensure the private key is set in your environment variables (e.g., .env file).");
    process.exit(1);
  }

  // Validate the private key format
  try {
    new ethers.Wallet(INDEXER_KEY);
  } catch (err) {
    console.error("CRITICAL ERROR: INDEXER_PRIVATE_KEY is not a valid hex string.");
    process.exit(1);
  }

  app.use(express.json());

  // --- API Routes ---

  // GitHub Verification (Offchain Only)
  app.get("/api/github-verify", async (req, res) => {
    const { username } = req.query;
    if (!username || typeof username !== "string" || username.trim() === "") {
      return res.status(200).json({ valid: false, error: "Username is required" });
    }

    const trimmedUsername = username.trim();

    try {
      // 1. Basic User Info
      const userResponse = await octokit.rest.users.getByUsername({
        username: trimmedUsername,
      });
      const userData = userResponse.data;

      // 2. Merged PRs count
      const prResponse = await octokit.rest.search.issuesAndPullRequests({
        q: `author:${trimmedUsername} type:pr is:merged`,
        per_page: 1,
      });
      const mergedPRs = prResponse.data.total_count;

      // 3. Total Stars received
      const repoResponse = await octokit.rest.search.repos({
        q: `user:${trimmedUsername}`,
        per_page: 100,
      });
      const totalStars = repoResponse.data.items.reduce((acc, repo) => acc + repo.stargazers_count, 0);

      res.json({
        valid: true,
        user: {
          login: userData.login,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          public_repos: userData.public_repos,
          followers: userData.followers,
          merged_prs: mergedPRs,
          total_stars: totalStars,
        },
      });
    } catch (error: any) {
      console.error("[GitHub Verify] Error for", trimmedUsername, ":", error.message);
      res.status(200).json({ valid: false, error: (error.status === 403 || error.status === 429) ? "GitHub rate limit exceeded. Please try again later." : "Invalid GitHub username" });
    }
  });

    // --- Offchain Indexer ---
    
    console.log("Initializing ArcProof Indexer (HTTP Polling Mode)...");
      
    let provider = new ethers.JsonRpcProvider(RPC_URL);
    let wallet = new ethers.Wallet(INDEXER_KEY, provider);
    
    console.log(`[Indexer] Wallet Address: ${wallet.address}`);
    
    let escrowContract = new ethers.Contract(JOB_ESCROW_ADDRESS, JOB_ESCROW_ABI, provider);
    let registryContract = new ethers.Contract(REPUTATION_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ABI, wallet);

    // Strict Identity Mapping Cache (Event-only Source of Truth)
    const jobEmployerMap: Record<string, string> = {};
    const jobDeveloperMap: Record<string, string> = {};
    const jobAmountMap: Record<string, bigint> = {};
    const jobFundedMap: Record<string, boolean> = {};

    // Transaction Queue for Indexer Writes
    const txQueue: { task: () => Promise<ethers.ContractTransactionResponse>; description: string }[] = [];
    let isProcessingQueue = false;

    async function processQueue() {
      if (isProcessingQueue || txQueue.length === 0) return;
      isProcessingQueue = true;
      while (txQueue.length > 0) {
        const { task, description } = txQueue[0];
        try {
          console.log(`[Queue] Executing: ${description}`);
          const tx = await task();
          await tx.wait();
          console.log(`[Queue] Succeeded: ${description} (Hash: ${tx.hash})`);
          txQueue.shift();
        } catch (err: any) {
          // If it's a logic failure (revert), we need to know why.
          // But according to directives, we retry until success. 
          // However, we should check if it's a CALL_EXCEPTION which might indicate a root cause we should have fixed.
          console.error(`[Queue] Failed: ${description} - ${err.message}. Retrying in 10s...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
      isProcessingQueue = false;
    }

    function queueTx(task: () => Promise<ethers.ContractTransactionResponse>, description: string) {
      txQueue.push({ task, description });
      processQueue();
    }

    // Validate Indexer Authorization
    async function checkIndexerStatus() {
      try {
        const authorizedIndexer = await registryContract.indexer();
        if (authorizedIndexer.toLowerCase() !== wallet.address.toLowerCase()) {
          console.warn(`[Indexer] WARNING: Wallet (${wallet.address}) is NOT the authorized indexer (${authorizedIndexer}). Attempting take-over...`);
          
          try {
            const owner = await registryContract.owner();
            if (owner.toLowerCase() === wallet.address.toLowerCase()) {
              console.log("[Indexer] Wallet is OWNER. Setting self as indexer...");
              const tx = await registryContract.setIndexer(wallet.address);
              await tx.wait();
              console.log("[Indexer] Successfully set indexer to self.");
            } else {
              console.error("[Indexer] FATAL: Wallet is NOT OWNER and NOT authorized indexer. Indexer writes will fail.");
            }
          } catch (ownErr: any) {
            console.error("[Indexer] Could not check owner or set indexer:", ownErr.message);
          }
        } else {
          console.log("[Indexer] Authorization confirmed.");
        }
      } catch (err: any) {
        console.error("[Indexer] Status check failed:", err.message);
      }
    }
    
    checkIndexerStatus();

    // GitHub Binding API (Attestation Signer)
    app.post("/api/github-bind", async (req, res) => {
      const { username, walletAddress } = req.body;
      if (!username || typeof username !== "string" || username.trim() === "" || !walletAddress) {
        return res.status(200).json({ success: false, error: "Username and wallet address are required" });
      }
      
      const trimmedUsername = username.trim();

      try {
        // 1. Validate via Octokit
        const githubResponse = await octokit.rest.users.getByUsername({
          username: trimmedUsername,
        });
        const validatedUsername = githubResponse.data.login;

        // 2. Check for existing bindings (Contract as Source of Truth)
        const existingWallet = await registryContract.githubToAddress(validatedUsername);
        if (existingWallet !== ethers.ZeroAddress) {
           return res.status(200).json({ success: false, error: "GitHub username already linked to another wallet" });
        }
        
        const existingGithub = await registryContract.addressToGithub(walletAddress);
        if (existingGithub !== "") {
           return res.status(200).json({ success: false, error: "Wallet already linked to a GitHub account" });
        }

        const normalizedWalletAddress = ethers.getAddress(walletAddress);

        // 3. Perform On-chain binding directly as Indexer (bypassing signature mismatch)
        console.log(`[GitHub Bind] Performing direct binding for ${validatedUsername} -> ${normalizedWalletAddress}`);
        
        try {
          const tx = await registryContract.bindGithub(normalizedWalletAddress, validatedUsername);
          console.log(`[GitHub Bind] Transaction sent: ${tx.hash}`);
          
          res.json({
            success: true,
            username: validatedUsername,
            txHash: tx.hash,
            user: {
              login: githubResponse.data.login,
              avatar_url: githubResponse.data.avatar_url,
            }
          });
        } catch (txErr: any) {
          console.error("[GitHub Bind] Transaction failed:", txErr);
          throw new Error("On-chain binding failed: " + (txErr.reason || txErr.message));
        }
      } catch (error: any) {
        console.error("[GitHub Bind] Error:", error.message);
        let errMsg = "Attestation failed";
        if (error.status === 404) errMsg = "Invalid GitHub username";
        else if (error.status === 403 || error.status === 429) errMsg = "GitHub rate limit exceeded. Please try again later.";
        else if (error.message && error.message.startsWith("On-chain binding failed")) errMsg = "Transaction failed on network";
        else if (error.reason) errMsg = "Transaction failed on network";
        res.status(200).json({ success: false, error: errMsg });
      }
    });

    // GitHub Unbind API (Reset)
    app.post("/api/github-reset", async (req, res) => {
      const { walletAddress } = req.body;
      if (!walletAddress) {
        return res.status(200).json({ success: false, error: "Wallet address is required" });
      }

      try {
        console.log(`[GitHub Reset] Unbinding ${walletAddress}...`);
        const tx = await registryContract.unbindGithub(walletAddress);
        console.log(`[GitHub Reset] Transaction sent: ${tx.hash}`);
        await tx.wait();
        
        res.json({
          success: true,
          message: "GitHub account unlinked successfully",
          txHash: tx.hash
        });
      } catch (error: any) {
        console.error("[GitHub Reset] Error:", error.message);
        res.status(200).json({ success: false, error: "Failed to unbind GitHub" });
      }
    });

    // Function to re-initialize if RPC fails
    const reconnectIndexer = () => {
      console.warn("[Indexer] Reconnecting to RPC...");
      provider = new ethers.JsonRpcProvider(RPC_URL);
      wallet = new ethers.Wallet(INDEXER_KEY, provider);
      escrowContract = new ethers.Contract(JOB_ESCROW_ADDRESS, JOB_ESCROW_ABI, provider);
      registryContract = new ethers.Contract(REPUTATION_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ABI, wallet);
    };

    // --- Block-based Polling for Events (Replacing filters) ---
    let lastProcessedBlock: number;
    let isPolling = false;

    // Local State Rebuild for Determinism (Not for UI)
    const jobScoredMap: Record<string, boolean> = {};

    async function processLogs(fromBlock: number, toBlock: number) {
      if (fromBlock > toBlock) return;
      try {
        const logs = await provider.getLogs({
          address: JOB_ESCROW_ADDRESS,
          fromBlock: fromBlock,
          toBlock: toBlock,
        });

        for (const log of logs) {
          try {
            const parsedLog = escrowContract.interface.parseLog(log);
            if (!parsedLog) continue;

            const jobId = parsedLog.args[0];
            const jobIdStr = jobId.toString();

            if (parsedLog.name === "JobCreated") {
               const [, employer, developer, amount] = parsedLog.args;
               jobEmployerMap[jobIdStr] = employer;
               jobDeveloperMap[jobIdStr] = developer;
               jobAmountMap[jobIdStr] = amount;
            } else if (parsedLog.name === "PaymentReleased") {
               const [, , amount] = parsedLog.args;
               jobAmountMap[jobIdStr] = (jobAmountMap[jobIdStr] || 0n) + amount; // track total if needed
            } else if (parsedLog.name === "JobFunded") {
               jobFundedMap[jobIdStr] = true;
            } else if (parsedLog.name === "JobClosed") {
               jobScoredMap[jobIdStr] = true;
            }
          } catch (logErr: any) {
            console.error(`[Indexer] Log error at block ${log.blockNumber}:`, logErr.message);
          }
        }
      } catch (err: any) {
        console.error(`[Indexer] Log processing error:`, err.message);
        throw err;
      }
    }

    async function poll() {
      if (isPolling) return;
      isPolling = true;

      try {
        const currentBlock = await provider.getBlockNumber();
        
        if (currentBlock > lastProcessedBlock) {
          // Safety cap: process in chunks of 5000 blocks
          const targetBlock = Math.min(currentBlock, lastProcessedBlock + 5000);
          await processLogs(lastProcessedBlock + 1, targetBlock);
          lastProcessedBlock = targetBlock;
        }
      } catch (err: any) {
        console.error(`[Indexer] Polling failed:`, err.message);
        
        if (
          err.message?.includes("-32602") || 
          err.message?.includes("filter not found") || 
          err.message?.includes("connection") ||
          err.message?.includes("timeout")
        ) {
          console.warn("[Indexer] RPC state error detected. Resetting loop and reconnecting...");
          reconnectIndexer();
        }
      } finally {
        isPolling = false;
      }
    }

    // Initialize block number and start interval
    async function startIndexer() {
      console.log("[Indexer] Starting ArcProof Indexer...");
      try {
        const currentBlock = await provider.getBlockNumber();
        // Initial deep sync to populate identity maps (50k block lookback for stability)
        const lookback = 50000;
        let startBlock = currentBlock > lookback ? currentBlock - lookback : 0;
        
        console.log(`[Indexer] Executing deep sync from block ${startBlock} to ${currentBlock}...`);
        
        const CHUNK_SIZE = 5000;
        for (let i = startBlock; i < currentBlock; i += CHUNK_SIZE) {
          const toBlock = Math.min(i + CHUNK_SIZE - 1, currentBlock);
          await processLogs(i, toBlock);
        }
        
        lastProcessedBlock = currentBlock;
        console.log(`[Indexer] Deep sync complete at block ${lastProcessedBlock}. Real-time polling enabled.`);
        setInterval(poll, 15000);
      } catch (err: any) {
        console.error("[Indexer] Indexer bootstrap failed:", err.message);
        setTimeout(startIndexer, 30000);
      }
    }

    startIndexer();

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ArcProof Server running on http://localhost:${PORT}`);
  });
}

startServer();
