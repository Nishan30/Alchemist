// worker/src/test_analyst.ts

import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import * as dotenv from "dotenv";
import { getJobsForAgent, getCreationsForAgent, getOwnershipHistory } from "./analyst";

dotenv.config();

const RPC_ENDPOINT = process.env.RPC_ENDPOINT!;
const ESCROW_CONTRACT_ADDR = process.env.ESCROW_CONTRACT_ADDR!;
const AGENT_NFT_CONTRACT_ADDR = process.env.AGENT_NFT_CONTRACT_ADDR!;
const LORE_NFT_CONTRACT_ADDR = process.env.LORE_NFT_CONTRACT_ADDR!;
const AGENT_TO_ANALYZE = "alchemist-001"; // The agent we want to inspect

async function main() {
    console.log("--- Initializing Analyst Tool ---");
    const client = await CosmWasmClient.connect(RPC_ENDPOINT);
    console.log("Connected to SEI.\n");

    console.log(`--- Analyzing Agent: ${AGENT_TO_ANALYZE} ---`);

    // Test 1: Get all jobs for this agent
    const jobs = await getJobsForAgent(client, ESCROW_CONTRACT_ADDR, AGENT_TO_ANALYZE);
    console.log("\n--- Job History ---");
    console.log(JSON.stringify(jobs, null, 2));

    // Test 2: Get all creations by this agent
    const creations = await getCreationsForAgent(client, ESCROW_CONTRACT_ADDR, LORE_NFT_CONTRACT_ADDR, AGENT_TO_ANALYZE);
    console.log("\n--- Creation Gallery ---");
    console.log(JSON.stringify(creations, null, 2));

    // Test 3: Get ownership history of this agent
    const history = await getOwnershipHistory(client, AGENT_NFT_CONTRACT_ADDR, AGENT_TO_ANALYZE);
    console.log("\n--- Ownership History ---");
    console.log(JSON.stringify(history, null, 2));

    console.log("\n--- Analysis Complete ---");
}

main();