interface MetricCardProps {
    label: string;
    value: string | number;
    unit?: string;
}

export const MetricCard = ({ label, value, unit }: MetricCardProps) => (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-3xl font-bold mt-1">
            {value}<span className="text-lg ml-1 text-gray-400">{unit}</span>
        </p>
    </div>
);