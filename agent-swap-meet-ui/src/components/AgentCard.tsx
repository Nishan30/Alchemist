// src/components/AgentCard.tsx
import { Agent } from "@/types";
import Link from "next/link";
import { ipfsToGateway } from "@/lib/utils"; // <-- Make sure this is imported

interface AgentCardProps {
    agent: Agent;
}

export const AgentCard = ({ agent }: AgentCardProps) => {
    // --- THIS IS THE DEFINITIVE FIX ---
    // We now use the helper function to convert the URI from the agent's metadata
    // into a usable HTTPS URL right before rendering.
    const imageUrl = ipfsToGateway(agent.info.extension?.image_uri);
    // ------------------------------------

    return (
        <Link href={`/agent/${agent.token_id}`}>
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                {/* We also handle the case where imageUrl might be empty */}
                <img 
                    src={imageUrl || 'https://placehold.co/600x400/1a202c/ffffff?text=No+Image'} 
                    alt={agent.token_id} 
                    className="w-full h-48 object-cover bg-gray-700" // Added a background color for loading
                />
                <div className="p-4">
                    <h3 className="text-lg font-bold">{agent.token_id}</h3>
                    <p className="text-sm text-gray-400 mt-1 truncate">{agent.info.extension?.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {agent.info.extension?.capabilities?.map(cap => (
                            <span key={cap} className="text-xs bg-gray-700 text-blue-300 px-2 py-1 rounded-full">
                                {cap}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    );
};