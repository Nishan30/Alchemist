// src/app/agent/[id]/components/Rating.tsx
"use client";
import { useState } from 'react';

interface RatingProps {
    currentRating?: number | null;
    onRate: (rating: number) => Promise<void>;
    disabled: boolean;
}

export const Rating = ({ currentRating, onRate, disabled }: RatingProps) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleRate = async (rating: number) => {
        if (disabled) return;
        await onRate(rating);
    };

    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    disabled={disabled || !!currentRating}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`text-3xl transition-colors ${
                        (hoverRating || currentRating || 0) >= star ? 'text-yellow-400' : 'text-gray-600'
                    } disabled:cursor-not-allowed`}
                >
                    ★
                </button>
            ))}
        </div>
    );
};
