// src/app/agent/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Agent, Job } from '@/types';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { AgentDashboard } from './components/AgentDashboard'; // <-- IMPORT THE NEW DASHBOARD
import toast from 'react-hot-toast';
import { NFTSelectorModal } from './components/NFTSelectorModel';

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;
  const { signingClient, address } = useWallet();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workshop' | 'dashboard'>('workshop');
  
  // ... (All other state variables for the workshop remain the same)
  const [parentContract, setParentContract] = useState('');
  const [parentTokenId, setParentTokenId] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<Job['status'] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleNftSelect = (contractAddress: string, tokenId: string) => {
    setParentContract(contractAddress);
    setParentTokenId(tokenId);
  };

   useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId) return;
      setLoading(true);
      try {
        const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT!;
        const client = await CosmWasmClient.connect(rpcEndpoint);
        const agentNftContract = process.env.NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDR!;
        const nftInfo = await client.queryContractSmart(agentNftContract, { all_nft_info: { token_id: agentId } });
        setAgent({ contract_address: agentNftContract, token_id: agentId, owner: nftInfo.access.owner, info: nftInfo.info });
      } catch (error) {
        console.error("Failed to fetch agent details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAgent();
  }, [agentId]);

  useEffect(() => {
    if (txStatus !== 'success' || jobId === null) return;
    const interval = setInterval(async () => {
      const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT!;
      const client = await CosmWasmClient.connect(rpcEndpoint);
      const escrowContract = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDR!;
      try {
        const job: Job = await client.queryContractSmart(escrowContract, { get_job: { job_id: jobId } });
        setJobStatus(job.status);
        if (job.status === 'Complete' || job.status === 'Failed') {
          clearInterval(interval);
        }
      } catch (error) { console.error("Failed to poll job status:", error); }
    }, 5000);
    return () => clearInterval(interval);
  }, [txStatus, jobId]);

  const handleTransmute = async () => {
    if (!signingClient || !address || !agent) return toast.error("Wallet not connected or agent not loaded.");
    if (!parentContract || !parentTokenId) return toast.error("Please provide both parent NFT details.");
    
    setTxStatus('pending');
    setJobStatus(null);
    setJobId(null);

    const escrowContract = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDR!;
    const rentAgentMsg = { rent_agent: { agent_token_id: agent.token_id, parent_nft_address: parentContract, parent_nft_token_id: parentTokenId } };

    const promise = signingClient.execute(address, escrowContract, rentAgentMsg, "auto");

    toast.promise(promise, {
      loading: 'Sending transaction...',
      success: (result) => {
        const jobIdFromEvents = result.logs[0].events
          .find(e => e.type === 'wasm')
          ?.attributes.find(attr => attr.key === 'job_id')?.value;
        
        if (jobIdFromEvents) {
          setJobId(parseInt(jobIdFromEvents));
          setTxStatus('success');
          return `Transaction successful! Job ID: ${jobIdFromEvents}`;
        }
        throw new Error("Could not find job_id in transaction events.");
      },
      error: (err) => {
        setTxStatus('error');
        return `Transaction failed: ${(err as Error).message}`;
      }
    });
  };
  // -- End of copy-pasted code --

  if (loading) return <div className="p-8 text-center">Loading Agent...</div>;
  if (!agent) return <div className="p-8 text-center">Agent not found.</div>;

  return (
    <>
      <NFTSelectorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelectNft={handleNftSelect}
      />
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <img src={agent.info.extension.image_uri || 'https://placehold.co/600x400/1a202c/ffffff?text=Agent'} alt={agent.token_id} className="rounded-lg w-full md:w-1/3 object-cover" />
          <div className="flex-1">
            <h2 className="text-4xl font-bold">{agent.token_id}</h2>
            <p className="text-gray-400 mt-2">{agent.info.extension.description}</p>
            
            {/* --- NEW TAB INTERFACE --- */}
            <div className="mt-6 border-b border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('workshop')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'workshop' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        Workshop
                    </button>
                    <button onClick={() => setActiveTab('dashboard')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        Intelligence Dashboard
                    </button>
                </nav>
            </div>
          </div>
        </div>

        {/* --- CONDITIONAL RENDERING BASED ON ACTIVE TAB --- */}
        <div>
            {activeTab === 'workshop' && (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <h3 className="text-2xl font-bold mb-4">Alchemist's Workshop</h3>
                  <div className="space-y-4">
                    {/* --- THE UI CHANGES ARE HERE --- */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Parent NFT</label>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Contract Address" value={parentContract} readOnly className="flex-1 bg-gray-700 p-2 rounded border border-gray-600 focus:outline-none cursor-not-allowed"/>
                            <input type="text" placeholder="Token ID" value={parentTokenId} readOnly className="w-1/3 bg-gray-700 p-2 rounded border border-gray-600 focus:outline-none cursor-not-allowed"/>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded"
                    >
                        Select from My Collection
                    </button>
                    {/* ---------------------------------- */}
                    <button onClick={handleTransmute} disabled={txStatus === 'pending' || !parentTokenId} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {txStatus === 'pending' ? 'Transmuting...' : 'Begin Transmutation'}
                    </button>
                  </div>
                  {txStatus === 'error' && <p className="mt-4 text-red-500">Transaction failed. Please check the console.</p>}
                  {txStatus === 'success' && (
                      <div className="mt-4 text-green-500">
                          <p>Transaction sent! Job ID: {jobId}</p>
                          <p>Watching for job completion... Status: <span className="font-bold">{jobStatus || 'Submitted'}</span></p>
                          {jobStatus === 'Complete' && <p className="text-lg font-bold">✨ Transmutation Complete! ✨</p>}
                      </div>
                  )}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <AgentDashboard agentId={agent.token_id} />
            )}
        </div>
      </main>
      </>
  );
}