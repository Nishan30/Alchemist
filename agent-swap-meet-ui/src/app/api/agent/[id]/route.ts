// src/app/api/agent/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Job } from '@/types'; // We'll need to update our types

// --- Analyst Functions (adapted from your Week 2 worker) ---

async function getJobsForAgent(client: CosmWasmClient, escrowAddr: string, agentId: string): Promise<Job[]> {
    try {
        // NOTE: This is an inefficient query for a real app. A real indexer is better.
        // For the demo, we query all jobs up to a reasonable limit.
        const jobs: Job[] = [];
        for (let i = 0; i < 50; i++) { // Query last 50 potential jobs
            try {
                const job: Job = await client.queryContractSmart(escrowAddr, { get_job: { job_id: i } });
                if (job.agent_token_id === agentId) {
                    jobs.push(job);
                }
            } catch (e) { /* Job doesn't exist, ignore */ }
        }
        return jobs.reverse(); // Show most recent first
    } catch (error) {
        console.error(`[Analyst API] Error fetching jobs for agent ${agentId}:`, error);
        return [];
    }
}

async function getCreationsForAgent(client: CosmWasmClient, escrowAddr: string, loreNftAddr: string, agentId: string) {
    const agentJobs = await getJobsForAgent(client, escrowAddr, agentId);
    const creationPromises = agentJobs
        .filter(job => job.status === "Complete" && job.result_uri)
        .map(async (job) => {
            const tokenId = `lore-${job.job_id}`;
            try {
                const nftInfo = await client.queryContractSmart(loreNftAddr, { nft_info: { token_id: tokenId } });
                return {
                    tokenId,
                    uri: job.result_uri,
                    metadata: nftInfo.extension,
                };
            } catch { return null; }
        });
    const creations = (await Promise.all(creationPromises)).filter(c => c !== null);
    return creations;
}

// --- The API Handler ---

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const agentId = params.id;
  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
  }

  try {
    const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT!;
    const client = await CosmWasmClient.connect(rpcEndpoint);
    const escrowAddr = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDR!;
    const loreNftAddr = process.env.NEXT_PUBLIC_LORE_NFT_CONTRACT_ADDR!;

    // Fetch all data in parallel
    const [jobs, creations] = await Promise.all([
        getJobsForAgent(client, escrowAddr, agentId),
        getCreationsForAgent(client, escrowAddr, loreNftAddr, agentId)
    ]);

    // Calculate metrics
    const totalJobs = jobs.length;
    const successfulJobs = jobs.filter(j => j.status === 'Complete').length;
    const successRate = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0;
    
    // In a real app, you would fetch ratings here. We'll mock it for now.
    const averageRating = 4.5; 

    return NextResponse.json({
        metrics: {
            totalJobs,
            successRate: successRate.toFixed(1),
            averageRating,
        },
        jobs,
        creations,
    });

  } catch (error) {
    console.error(`Failed to fetch analytics for agent ${agentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch agent analytics' }, { status: 500 });
  }
}