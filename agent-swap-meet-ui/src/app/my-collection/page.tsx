// src/app/my-collection/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Agent } from '@/types'; // We can reuse the Agent type for any NFT
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { AgentCard } from '@/components/AgentCard'; // Reusable component!

export default function MyCollectionPage() {
  const { address } = useWallet();
  const [myNfts, setMyNfts] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyNfts = async () => {
      if (!address) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT!;
        const client = await CosmWasmClient.connect(rpcEndpoint);
        const agentNftContract = process.env.NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDR!;
        const loreNftContract = process.env.NEXT_PUBLIC_LORE_NFT_CONTRACT_ADDR!;
        
        // --- Fetch NFTs the user owns from BOTH collections ---
        const myAgentsPromise = client.queryContractSmart(agentNftContract, { tokens: { owner: address } });
        const myCreationsPromise = client.queryContractSmart(loreNftContract, { tokens: { owner: address } });
        
        const [myAgentIds, myCreationIds] = await Promise.all([myAgentsPromise, myCreationsPromise]);
        
        const allMyTokenIds = [
            ...myAgentIds.tokens.map((id: string) => ({ id, contract: agentNftContract })),
            ...myCreationIds.tokens.map((id: string) => ({ id, contract: loreNftContract })),
        ];
        
        const nftPromises = allMyTokenIds.map(({ id, contract }) => 
          client.queryContractSmart(contract, { all_nft_info: { token_id: id } })
            .then(nftInfo => ({ token_id: id, owner: nftInfo.access.owner, info: nftInfo.info }))
        );

        const fetchedNfts: Agent[] = await Promise.all(nftPromises);
        setMyNfts(fetchedNfts);

      } catch (error) {
        console.error("Failed to fetch my NFTs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyNfts();
  }, [address]);

  return (
    <main className="p-8">
      <h2 className="text-3xl font-bold mb-8 text-center">My Collection</h2>
      {!address && (
        <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-lg">
          Please connect your wallet to view your personal collection of assets and creations.
        </div>
      )}
      {loading && address && <div className="text-center">Loading your collection...</div>}
      {!loading && myNfts.length === 0 && address && (
        <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-lg">
          You don't own any Agents, Parent NFTs, or Creations yet.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {myNfts.map(nft => (
          // We can reuse the AgentCard component to display any NFT
          <AgentCard key={`${nft.token_id}-${nft.owner}`} agent={nft} />
        ))}
      </div>
    </main>
  );
}