import { Job } from "@/types";
import { useWallet } from "@/contexts/WalletContext";
import { Rating } from "./Rating";
import { Beaker } from "lucide-react"; // <-- IMPORT ICON

interface JobHistoryTableProps {
    jobs: Job[];
    onRateJob: (jobId: number, rating: number) => Promise<void>;
}

export const JobHistoryTable = ({ jobs, onRateJob }: JobHistoryTableProps) => {
    const { address } = useWallet();

    // --- NEW EMPTY STATE ---
    if (jobs.length === 0) {
        return (
            <div className="text-center text-gray-500 py-12 px-6 bg-gray-800/50 rounded-lg">
                <Beaker className="mx-auto h-12 w-12 text-gray-600" />
                <h3 className="mt-2 text-sm font-semibold text-gray-300">No Job History</h3>
                <p className="mt-1 text-sm text-gray-500">This agent hasn't performed any jobs yet.</p>
                <p className="mt-1 text-sm text-gray-500">Go to the Workshop tab to be the first!</p>
            </div>
        );
    }

    const statusColor = (status: Job['status']) => {
        switch (status) {
            case 'Complete': return 'text-green-400';
            case 'Failed': return 'text-red-400';
            case 'Pending': return 'text-yellow-400';
        }
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                    <tr>
                        <th scope="col" className="px-6 py-3">Job ID</th>
                        <th scope="col" className="px-6 py-3">Client</th>
                        <th scope="col" className="px-6 py-3">Parent NFT</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Your Rating</th>
                    </tr>
                </thead>
                <tbody>
                    {jobs.map(job => (
                        <tr key={job.job_id} className="bg-gray-800 border-b border-gray-700 last:border-b-0">
                            <td className="px-6 py-4 font-medium">{job.job_id}</td>
                            <td className="px-6 py-4 font-mono truncate max-w-xs" title={job.client}>{job.client}</td>
                            <td className="px-6 py-4 font-mono truncate max-w-xs" title={job.parent_nft_token_id}>{job.parent_nft_token_id}</td>
                            <td className={`px-6 py-4 font-bold ${statusColor(job.status)}`}>{job.status}</td>
                            <td className="px-6 py-4">
                                {job.status === 'Complete' && job.client === address ? (
                                    <Rating 
                                        currentRating={job.rating}
                                        onRate={(rating) => onRateJob(job.job_id, rating)}
                                        disabled={!!job.rating}
                                    />
                                ) : (
                                    <span className="text-gray-500">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};