// src/app/agent/[id]/components/AgentDashboard.tsx
"use client";
import { useEffect, useState } from 'react';
import { MetricCard } from './MetricCard';
import { CreationGallery } from './CreationGallery';
import { JobHistoryTable } from './JobHistoryTable';
import toast from 'react-hot-toast';
import { useWallet } from '@/contexts/WalletContext';

interface DashboardData {
    metrics: { totalJobs: number; successRate: string; averageRating: number };
    jobs: any[];
    creations: any[];
}
const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-700 rounded-lg"></div>
            <div className="h-24 bg-gray-700 rounded-lg"></div>
            <div className="h-24 bg-gray-700 rounded-lg"></div>
        </div>
        <div>
            <div className="h-8 w-1/3 bg-gray-700 rounded-lg mb-4"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-gray-700 rounded-lg"></div>)}
            </div>
        </div>
        <div>
            <div className="h-8 w-1/3 bg-gray-700 rounded-lg mb-4"></div>
            <div className="h-40 bg-gray-700 rounded-lg"></div>
        </div>
    </div>
);

export const AgentDashboard = ({ agentId }: { agentId: string }) => {
    const { signingClient, address } = useWallet();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        if (!agentId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/agent/${agentId}`);
            if (!response.ok) throw new Error("Failed to fetch dashboard data");
            const fetchedData = await response.json();
            setData(fetchedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [agentId]);

    const handleRateJob = async (jobId: number, rating: number): Promise<void> => {
        if (!signingClient || !address) {
            toast.error("Please connect wallet");
            return;
        }
        
        const escrowContract = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDR!;
        const rateMsg = { rate_job: { job_id: jobId, rating } };

        const promise = signingClient.execute(address, escrowContract, rateMsg, "auto");
        toast.promise(promise, {
            loading: 'Submitting rating...',
            success: () => {
                fetchDashboardData(); // Refetch data to show the new rating
                return "Rating submitted successfully!";
            },
            error: (err) => `Failed to submit rating: ${(err as Error).message}`,
        });
        await promise;
    };

    if (loading) return <DashboardSkeleton />;
    if (!data) return <div className="text-center p-8 text-red-500">Could not load intelligence data.</div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="Total Jobs" value={data.metrics.totalJobs} />
                <MetricCard label="Success Rate" value={data.metrics.successRate} unit="%" />
                <MetricCard label="Avg. Rating" value={data.metrics.averageRating} unit="/ 5" />
            </div>

            <div>
                <h3 className="text-2xl font-bold mb-4">Creation Gallery</h3>
                <CreationGallery creations={data.creations} />
            </div>

            <div>
                <h3 className="text-2xl font-bold mb-4">Job History</h3>
                <JobHistoryTable jobs={data.jobs} onRateJob={handleRateJob} />
            </div>
        </div>
    );
};