# ArcProof ⚡️

On-chain hiring and reputation system powered by USDC escrow-based performance metrics on the **Arc Testnet**.

ArcProof bridges the gap between hiring and payment security, ensuring that developers are paid for their work and employers get the results they expect, all while building a verifiable on-chain reputation.

## 🌟 Key Features

- **USDC Escrow Protection**: All jobs are funded upfront in USDC. Funds are only released upon work approval or through a dispute resolution process.
- **Sequential Funding Flow**: A deterministic, multi-step process for job creation (Analysis -> Approval -> Funding) that ensures maximum security.
- **On-chain Reputation (Reputation Registry)**: Track developer and employer statistics, including completion rates, dispute history, and total volume.
- **DevScore NFT**: Successfully completing jobs earns developers reputation points reflected in an evolving DevScore NFT.
- **Dispute Resolution**: Built-in mechanism to handle disagreements fairly through an optimized on-chain protocol.
- **Modern Web3 Interface**: Built with React, Tailwind CSS, and Framer Motion for a fluid, high-fidelity experience.

## 🏗 Architecture

### Backend Service (`server.ts`)
- **GitHub Verification**: Authenticates and analyzes GitHub profiles (PRs, stars, repo count) using the Octokit SDK.
- **On-chain Indexer**: A secure polling service that monitors `JobEscrow` events and automatically synchronizes success metrics to the `ReputationRegistry`.
- **Identity Binding**: Securely links GitHub identities to wallet addresses on-chain via a trusted indexer proxy.

### Smart Contracts (`/contracts`)
- **`JobEscrow.sol`**: The core engine managing job lifecycle, USDC deposits, approvals, and releases.
- **`ReputationRegistry.sol`**: Stores user metrics and historical performance data, acting as the foundation for the DevScore.
- **`DevScoreNFT.sol`**: An ERC721 token that acts as a portable resume for developers, reflecting points earned through the registry.

### Frontend (`/src`)
- **`App.tsx`**: Main application logic including dual personas (Employer/Developer) and the complex escrow funding state machine.
- **`SequentialFundingFlow`**: A robust React component that handles the multi-transaction flow required for ERC20 approvals and escrow deposits.
- **`wagmi.ts`**: Web3 configuration for the Arc Testnet using `wagmi` and `viem`.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Web3 wallet (e.g., MetaMask)
- Arc Testnet USDC and Native Tokens

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (refer to `.env.example`):
   - `ARC_RPC_URL`: The RPC endpoint for the Arc Testnet.
   - `INDEXER_PRIVATE_KEY`: The private key authorized to update the `ReputationRegistry`.

3. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## 🛠 Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi, Viem, Ethers
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **Server**: Express (for production serving)

## 📎 Smart Contract Addresses

Verify the integration in `src/lib/contracts.ts`.

- **USDC**: `USDC_ADDRESS`
- **JobEscrow**: `JOB_ESCROW_ADDRESS`
- **ReputationRegistry**: `REPUTATION_REGISTRY_ADDRESS`

---

Built with precision on the Arc Ecosystem.
