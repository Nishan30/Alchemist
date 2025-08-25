// worker/src/worker.ts
import { CosmWasmClient, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import * as dotenv from "dotenv";
import { Job } from "./types";
// We will create these helper files next
import { generateAndUploadArt } from "./ai_handler";
import { getParentNftTraits } from "./chain_reader";

dotenv.config();

// --- ADD THIS DIAGNOSTIC LINE ---
console.log(`[DEBUG] Replicate Token Loaded: ${process.env.REPLICATE_API_TOKEN ? 'Yes' : 'No'}`);

// --- CONFIGURATION ---
const RPC_ENDPOINT = process.env.RPC_ENDPOINT!;
const ESCROW_CONTRACT_ADDR = process.env.ESCROW_CONTRACT_ADDR!;
const WORKER_MNEMONIC = process.env.WORKER_MNEMONIC!;
const GAS_PRICE = GasPrice.fromString("0.1usei");
const SEI_PREFIX = "sei";
// ---------------------

async function processJob(job: Job, signingClient: SigningCosmWasmClient, workerAddress: string) {
    console.log(`[Worker] Processing job #${job.job_id}...`);
    try {
        // 1. Read Parent NFT Traits
        const traits = await getParentNftTraits(signingClient, job.parent_nft_address, job.parent_nft_token_id);
        if (!traits) {
            throw new Error("Could not fetch parent NFT traits.");
        }
        
        // 2. Generate Art & Upload to IPFS
        const newNftMetadataUri = await generateAndUploadArt(job, traits);
        if (!newNftMetadataUri) {
            throw new Error("Failed to generate and upload art.");
        }

        // 3. Send Result Back to Chain
        console.log(`[Worker] Posting result to escrow contract. IPFS URI: ${newNftMetadataUri}`);
        const postResultMsg = {
            post_result: {
                job_id: job.job_id,
                result_ipfs_uri: newNftMetadataUri,
            },
        };

        const result = await signingClient.execute(
            workerAddress,
            ESCROW_CONTRACT_ADDR,
            postResultMsg,
            "auto", // Fee
            "Alchemist job completion", // Memo
        );

        console.log(`[Worker] Job #${job.job_id} completed successfully! TxHash: ${result.transactionHash}`);

    } catch (error) {
        console.error(`[Worker] Failed to process job #${job.job_id}:`, error);
        // TODO: In a real app, you would update the job status to "Failed" on-chain.
    }
}

async function main() {
    // Setup read-only and signing clients
    const client = await CosmWasmClient.connect(RPC_ENDPOINT);
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(WORKER_MNEMONIC, { prefix: SEI_PREFIX });
    const [workerAccount] = await wallet.getAccounts();
    const signingClient = await SigningCosmWasmClient.connectWithSigner(RPC_ENDPOINT, wallet, { gasPrice: GAS_PRICE });

    console.log(`Worker Address: ${workerAccount?.address || "unknown"}`);
    console.log("Starting Alchemist worker loop...");

    let lastCheckedJobId = -1; // Start from the beginning

    // The main listening loop
    setInterval(async () => {
        try {
            const nextJobId = lastCheckedJobId + 1;
            // Try to query for the next job
            const job: Job = await client.queryContractSmart(ESCROW_CONTRACT_ADDR, { get_job: { job_id: nextJobId } });
            
            // If the query succeeds, a new job exists!
            console.log(`[Worker] New job found: #${job.job_id}`);
            await processJob(job, signingClient, workerAccount?.address || "");
            
            // Move to the next job
            lastCheckedJobId = nextJobId;

        } catch (error) {
            // This error is expected when no new jobs are available.
            // console.log("[Worker] No new jobs found. Waiting...");
        }
    }, 10000); // Check every 10 seconds
}

main();