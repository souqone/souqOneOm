'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  rating: number;
  max?: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
}

export default function StarRating({
  rating,
  max = 5,
  onRatingChange,
  readOnly = false,
  size = 24,
}: Props) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (index: number) => {
    if (!readOnly) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (!readOnly) setHoverRating(0);
  };

  const handleClick = (index: number) => {
    if (!readOnly && onRatingChange) onRatingChange(index);
  };

  return (
    <div className="flex items-center gap-1" dir="ltr">
      {Array.from({ length: max }).map((_, i) => {
        const index = i + 1;
        const isActive = index <= (hoverRating || rating);
        
        return (
          <button
            key={index}
            type="button"
            className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
            disabled={readOnly}
          >
            <Star
              size={size}
              className={`transition-all ${
                isActive
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-[var(--color-outline)]'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
