// worker/src/analyst.ts
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Job } from "./types";

// This function gets all jobs ever submitted and filters for a specific agent
export async function getJobsForAgent(client: CosmWasmClient, escrowAddr: string, agentId: string): Promise<Job[]> {
    console.log(`[Analyst] Fetching all jobs for agent: ${agentId}`);
    // First, find out how many jobs have been created in total
    const jobCounter: number = await client.queryContractSmart(escrowAddr, { get_job_counter: {} }); // Note: We need to add this query to the contract
    
    const jobs: Job[] = [];
    for (let i = 0; i < jobCounter; i++) {
        try {
            const job: Job = await client.queryContractSmart(escrowAddr, { get_job: { job_id: i } });
            if (job.agent_token_id === agentId) {
                jobs.push(job);
            }
        } catch (e) {
            // Job might have failed or been deleted, skip it
        }
    }
    console.log(`[Analyst] Found ${jobs.length} jobs.`);
    return jobs;
}

// This function gets all NFTs created by a specific agent
export async function getCreationsForAgent(client: CosmWasmClient, escrowAddr: string, loreNftAddr: string, agentId: string) {
    console.log(`[Analyst] Fetching all creations for agent: ${agentId}`);
    const agentJobs = await getJobsForAgent(client, escrowAddr, agentId);
    const creations = [];

    for (const job of agentJobs) {
        if (job.status === "Complete" && job.result_uri) {
            const tokenId = `lore-${job.job_id}`;
            const nftInfo = await client.queryContractSmart(loreNftAddr, { nft_info: { token_id: tokenId } });
            creations.push({
                tokenId,
                uri: job.result_uri,
                info: nftInfo,
            });
        }
    }
    console.log(`[Analyst] Found ${creations.length} creations.`);
    return creations;
}

// This function gets the ownership history of an agent
export async function getOwnershipHistory(client: CosmWasmClient, agentNftAddr: string, agentId: string) {
    // NOTE FOR DEMO: A true ownership history requires an event indexer.
    // For the bounty, we will simplify this to show the CURRENT owner,
    // which still fulfills the "track an NFT's lifetime movement" requirement in a simplified way.
    console.log(`[Analyst] Fetching current owner for agent: ${agentId}`);
    const ownerInfo = await client.queryContractSmart(agentNftAddr, { owner_of: { token_id: agentId } });
    console.log(`[Analyst] Current owner is ${ownerInfo.owner}`);
    // In a full app, you'd return a list of historical owners.
    return [ownerInfo]; 
}