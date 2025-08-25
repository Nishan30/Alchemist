// src/app/agent/[id]/components/NFTSelectorModal.tsx
"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Agent } from '@/types';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { ipfsToGateway } from '@/lib/utils';
import { X } from 'lucide-react';

interface NFTSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectNft: (contractAddress: string, tokenId: string) => void;
}

export const NFTSelectorModal = ({ isOpen, onClose, onSelectNft }: NFTSelectorModalProps) => {
    const { address } = useWallet();
    const [myNfts, setMyNfts] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch the user's NFTs when the modal opens
    useEffect(() => {
        const fetchMyNfts = async () => {
            if (!isOpen || !address) return;
            setLoading(true);

            try {
                const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT!;
                const client = await CosmWasmClient.connect(rpcEndpoint);
                const agentNftContract = process.env.NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDR!;
                const loreNftContract = process.env.NEXT_PUBLIC_LORE_NFT_CONTRACT_ADDR!;
                
                const myAgentsPromise = client.queryContractSmart(agentNftContract, { tokens: { owner: address } });
                const myCreationsPromise = client.queryContractSmart(loreNftContract, { tokens: { owner: address } });
                
                const [myAgentIds, myCreationIds] = await Promise.all([myAgentsPromise, myCreationsPromise]);
                
                const allMyTokenIds = [
                    ...myAgentIds.tokens.map((id: string) => ({ id, contract: agentNftContract })),
                    ...myCreationIds.tokens.map((id: string) => ({ id, contract: loreNftContract, isCreation: true })), // Flag creations
                ];
                
                const nftPromises = allMyTokenIds.map(async ({ id, contract, isCreation }) => {
                    const nftInfo = await client.queryContractSmart(contract, { all_nft_info: { token_id: id } });
                    // Attach the contract address to each NFT object
                    return { ...nftInfo, token_id: id, contract_address: contract, isCreation };
                });

                const fetchedNfts: any[] = await Promise.all(nftPromises);
                setMyNfts(fetchedNfts.map(nft => ({ token_id: nft.token_id, owner: nft.access.owner, info: nft.info, contract_address: nft.contract_address, isCreation: nft.isCreation })));
            
            } catch (error) {
                console.error("Failed to fetch my NFTs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyNfts();
    }, [isOpen, address]);

    if (!isOpen) return null;

    const handleSelect = (nft: any) => {
        onSelectNft(nft.contract_address, nft.token_id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Select an NFT from Your Collection</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {loading && <div className="text-center">Loading your collection...</div>}
                    {!loading && myNfts.length === 0 && <div className="text-center text-gray-400">Your collection is empty.</div>}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {myNfts.map(nft => (
                            <div key={`${nft.contract_address}-${nft.token_id}`} onClick={() => handleSelect(nft)} className="bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-blue-500 transition-all">
                                <img src={ipfsToGateway(nft.info.extension?.image_uri)} alt={nft.token_id} className="w-full h-32 object-cover"/>
                                <p className="text-xs p-2 truncate font-bold">{nft.token_id}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};