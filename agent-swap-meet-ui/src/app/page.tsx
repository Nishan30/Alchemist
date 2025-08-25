// src/app/page.tsx
import { AgentCard } from "@/components/AgentCard";
import { Agent, NftInfo } from "@/types";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { ipfsToGateway } from "@/lib/utils";

async function getAgents(): Promise<Agent[]> {
  try {
    const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT!;
    const client = await CosmWasmClient.connect(rpcEndpoint);
    const agentNftContract = process.env.NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDR!;
    
    const allTokensResponse = await client.queryContractSmart(agentNftContract, { all_tokens: {} });

    const agentPromises = allTokensResponse.tokens.map(async (token_id: string): Promise<Agent | null> => {
      try {
        // First, get the basic on-chain info, including the token_uri
        const nftInfoResponse = await client.queryContractSmart(agentNftContract, { all_nft_info: { token_id } });
        const { access, info } = nftInfoResponse;

        let finalInfo: NftInfo = info; // Default to on-chain info

        // --- THIS IS THE NEW LOGIC ---
        // If a token_uri exists, fetch the off-chain metadata from IPFS
        if (info.token_uri) {
            const metadataUrl = ipfsToGateway(info.token_uri);
            const metadataResponse = await fetch(metadataUrl);
            if (metadataResponse.ok) {
                const metadata = await metadataResponse.json();
                // We construct an NftInfo object from the fetched metadata
                finalInfo = {
                    extension: {
                        description: metadata.description || 'No description found.',
                        image_uri: metadata.image || '',
                        capabilities: (metadata.attributes || [])
                            .filter((attr: any) => attr.trait_type === "Capability") // Example: find capabilities in attributes
                            .map((attr: any) => attr.value),
                        attributes: metadata.attributes || [],
                    }
                };
            }
        }
        // --- END OF NEW LOGIC ---

        return { token_id, owner: access.owner, info: finalInfo };

      } catch (e) {
        console.error(`Failed to fetch details for token ${token_id}:`, e);
        return null; // Return null for any token that fails to load
      }
    });
    
    const results = await Promise.all(agentPromises);
    return results.filter((agent): agent is Agent => agent !== null); // Filter out any null results

  } catch (error) {
    console.error("Failed to fetch agents on the server:", error);
    return [];
  }
}

const AGENT_IDS = ["The-Dreamweaver-V2", "The-Analyst-V2"]; // Add any other agent IDs here

export default async function MarketplacePage() {
  const allNfts = await getAgents();

  // --- FILTER TO ONLY SHOW AGENTS ---
  const agents = allNfts.filter(nft => AGENT_IDS.includes(nft.token_id));

  return (
    <main className="p-8">
      <h2 className="text-3xl font-bold mb-8 text-center">Agent Marketplace</h2>
      <p className="text-center text-gray-400 -mt-4 mb-8">Discover and hire unique, on-chain AI artists.</p>
      
      {/* ... (rest of the JSX is the same) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {agents.map(agent => (
            <AgentCard key={agent.token_id} agent={agent} />
          ))}
      </div>
    </main>
  );
}