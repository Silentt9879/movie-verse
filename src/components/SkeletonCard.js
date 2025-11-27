import React from 'react';

const SkeletonCard = () => (
    <div className="bg-[#181818] rounded-md overflow-hidden animate-pulse">
        <div className="bg-gray-800 aspect-[2/3] w-full" />
        <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="flex justify-between">
                <div className="h-3 bg-gray-800 rounded w-1/4" />
                <div className="h-3 bg-gray-800 rounded w-1/6" />
            </div>
        </div>
    </div>
);

export default SkeletonCard;