"use client";
import { useState } from 'react';

// Define the Creation type based on your API response
interface Creation {
    tokenId: string;
    uri: string;
    metadata: { image: string, name: string };
}

export const CreationGallery = ({ creations }: { creations: Creation[] }) => {
    if (creations.length === 0) {
        return <div className="text-center text-gray-500 py-4">No creations yet.</div>;
    }

    const [imageError, setImageError] = useState<Record<string, boolean>>({});

    const handleImageError = (tokenId: string) => {
        setImageError(prev => ({ ...prev, [tokenId]: true }));
    };

    // Helper to convert IPFS URI to a public gateway URL
    const ipfsToGateway = (uri: string) => {
        if (!uri) return 'https://placehold.co/400x400/1a202c/ffffff?text=No+Image';
        const hash = uri.replace('ipfs://', '');
        return `https://ipfs.io/ipfs/${hash}`;
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {creations.map(creation => (
                <div key={creation.tokenId} className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                    <img
                        src={imageError[creation.tokenId] ? 'https://placehold.co/400x400/ff0000/ffffff?text=Error' : ipfsToGateway(creation.metadata.image)}
                        alt={creation.metadata.name}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(creation.tokenId)}
                    />
                </div>
            ))}
        </div>
    );
};