
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
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username is required" });
    }

    try {
      // 1. Basic User Info
      const userResponse = await octokit.rest.users.getByUsername({
        username,
      });
      const userData = userResponse.data;

      // 2. Merged PRs count
      const prResponse = await octokit.rest.search.issuesAndPullRequests({
        q: `author:${username} type:pr is:merged`,
        per_page: 1,
      });
      const mergedPRs = prResponse.data.total_count;

      // 3. Total Stars received
      const repoResponse = await octokit.rest.search.repos({
        q: `user:${username}`,
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
    } catch (error) {
      console.error("[GitHub Verify] Error:", error);
      res.status(404).json({ valid: false, error: "GitHub user not found or API error" });
    }
  });

  // --- Offchain Indexer ---
  
  console.log("Initializing ArcProof Indexer (HTTP Polling Mode)...");
    
  let provider = new ethers.JsonRpcProvider(RPC_URL);
  let wallet = new ethers.Wallet(INDEXER_KEY, provider);
  
  console.log(`[Indexer] Wallet Address: ${wallet.address}`);
  
  let escrowContract = new ethers.Contract(JOB_ESCROW_ADDRESS, JOB_ESCROW_ABI, provider);
  let registryContract = new ethers.Contract(REPUTATION_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ABI, wallet);

  // Validate Indexer Authorization
  registryContract.indexer().then((authorizedIndexer: string) => {
    if (authorizedIndexer.toLowerCase() !== wallet.address.toLowerCase()) {
      console.warn(`[Indexer] WARNING: This wallet (${wallet.address}) is NOT the authorized indexer in the ReputationRegistry contract (${authorizedIndexer}). Stats updates will likely fail.`);
    } else {
      console.log("[Indexer] Authorization confirmed: Wallet is the authorized indexer.");
    }
  }).catch((err: any) => console.error("[Indexer] Failed to verify authorized indexer:", err.message));

  // GitHub Binding API (Attestation Signer)
  app.post("/api/github-bind", async (req, res) => {
      const { username, walletAddress } = req.body;
      if (!username || !walletAddress) {
        return res.status(400).json({ error: "Username and wallet address are required" });
      }

      try {
        // 1. Validate via Octokit
        const githubResponse = await octokit.rest.users.getByUsername({
          username,
        });
        const validatedUsername = githubResponse.data.login;

        // 2. Check for existing bindings (Contract as Source of Truth)
        const existingWallet = await registryContract.githubToAddress(validatedUsername);
        if (existingWallet !== ethers.ZeroAddress) {
           return res.status(400).json({ error: "GitHub account already linked to another wallet" });
        }
        
        const existingGithub = await registryContract.addressToGithub(walletAddress);
        if (existingGithub !== "") {
           return res.status(400).json({ error: "Wallet already linked to a GitHub account" });
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
        console.error("[GitHub Bind] Error:", error);
        const errMsg = error.reason || error.message || "Attestation failed";
        res.status(400).json({ error: errMsg });
      }
    });

    // GitHub Unbind API (Reset)
    app.post("/api/github-reset", async (req, res) => {
      const { walletAddress } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required" });
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
        console.error("[GitHub Reset] Error:", error);
        res.status(400).json({ error: error.message || "Failed to unbind GitHub" });
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

    async function processLogs(fromBlock: number, toBlock: number) {
      console.log(`[Indexer] Processing blocks ${fromBlock} to ${toBlock}...`);
      try {
        const logs = await provider.getLogs({
          address: JOB_ESCROW_ADDRESS,
          fromBlock,
          toBlock,
        });

        if (logs.length > 0) {
          console.log(`[Indexer] Found ${logs.length} logs in range.`);
        }

        for (const log of logs) {
          try {
            const parsedLog = escrowContract.interface.parseLog(log);
            if (!parsedLog) continue;

            console.log(`[Indexer] Event detected: ${parsedLog.name} at block ${log.blockNumber}`);

            if (parsedLog.name === "PaymentReleased") {
              const [jobId, developer, amount] = parsedLog.args;
              console.log(`[Indexer] PaymentReleased details: Job ${jobId}, Dev ${developer}, Amount ${amount}`);
              
              // Verify if already scored to avoid redundant txs (idempotency check)
              const alreadyScored = await registryContract.jobScored(jobId);
              if (alreadyScored) {
                 console.log(`[Indexer] Job ${jobId} already scored. Skipping.`);
                 continue;
              }

              console.log(`[Indexer] Sending updateStats for Job ${jobId} (Completed)...`);
              const tx = await registryContract.updateStats(jobId, developer, 1, 0, amount, amount, false, false);
              console.log(`[Indexer] Transaction sent: ${tx.hash}. Waiting for confirmation...`);
              await tx.wait();
              console.log(`[Indexer] Registry updated for ${developer}. Hash: ${tx.hash}`);
            } else if (parsedLog.name === "DisputeResolved") {
              const [jobId, favorDeveloper] = parsedLog.args;
              console.log(`[Indexer] DisputeResolved details: Job ${jobId}, favorDeveloper: ${favorDeveloper}`);
              
              const alreadyScored = await registryContract.jobScored(jobId);
              if (alreadyScored) {
                 console.log(`[Indexer] Job ${jobId} already scored. Skipping.`);
                 continue;
              }

              const jobData = await escrowContract.jobs(jobId);
              const developer = jobData.developer;
              const totalAmount = jobData.amount;

              if (developer === ethers.ZeroAddress) {
                console.warn(`[Indexer] DisputeResolved for Job ${jobId} but developer address is zero.`);
                continue;
              }

              console.log(`[Indexer] Sending updateStats for Job ${jobId} (Disputed outcome)...`);
              const tx = await registryContract.updateStats(
                jobId,
                developer, 
                favorDeveloper ? 1 : 0, 
                favorDeveloper ? 0 : 1, 
                favorDeveloper ? totalAmount : 0, 
                totalAmount, 
                favorDeveloper, 
                !favorDeveloper
              );
              await tx.wait();
              console.log(`[Indexer] Registry updated for dispute outcome on ${developer}. Hash: ${tx.hash}`);
            } else if (parsedLog.name === "WorkRejected") {
               const [jobId, timestamp, reason] = parsedLog.args;
               console.log(`[Indexer] WorkRejected detected for Job ${jobId}. Reason: ${reason}`);
               
               const jobData = await escrowContract.jobs(jobId);
               const developer = jobData.developer;
               if (developer !== ethers.ZeroAddress) {
                 console.log(`[Indexer] Sending recordRejection for Job ${jobId} (Dev: ${developer})...`);
                 try {
                   const tx = await registryContract.recordRejection(jobId, developer);
                   console.log(`[Indexer] Rejection recorded. Hash: ${tx.hash}`);
                 } catch (err: any) {
                   console.error(`[Indexer] Failed to record rejection: ${err.message}`);
                 }
               }
            } else if (parsedLog.name === "JobCreated") {
               console.log(`[Indexer] JobCreated detected: ${parsedLog.args.jobId}`);
            }
          } catch (logErr: any) {
            console.error(`[Indexer] Failed to process log at block ${log.blockNumber}:`, logErr.message);
          }
        }
      } catch (err: any) {
        console.error(`[Indexer] getLogs error:`, err.message);
        throw err;
      }
    }

    async function poll() {
      if (isPolling) return;
      isPolling = true;

      try {
        const currentBlock = await provider.getBlockNumber();
        
        if (lastProcessedBlock === undefined) {
          // Look back 5000 blocks to catch recent missed events (e.g. if server was down)
          lastProcessedBlock = Math.max(0, currentBlock - 5000);
          console.log(`[Indexer] Initialized. Starting sync from history: block ${lastProcessedBlock} (current ${currentBlock})`);
        }

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
    console.log("[Indexer] Initializing event sync...");
    setInterval(poll, 15000); // 15 second poll interval for stability

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
