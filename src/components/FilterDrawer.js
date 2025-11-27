import React, { useState } from 'react';
import { FaTimes, FaFilter, FaArrowRight } from 'react-icons/fa';

// Default options for demonstration
const SORT_OPTIONS = [
    { value: 'popularity.desc', label: 'Popularity Descending' },
    { value: 'vote_average.desc', label: 'Rating Descending' },
    { value: 'release_date.desc', label: 'Newest Releases' },
    { value: 'revenue.desc', label: 'Box Office Revenue' },
];

const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
];

const FilterDrawer = ({ isVisible, onClose, applyFilters, initialFilters, mediaType }) => {
    const [tempFilters, setTempFilters] = useState(initialFilters);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTempFilters(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRatingChange = (e) => {
        const value = parseFloat(e.target.value);
        setTempFilters(prev => ({
            ...prev,
            minRating: isNaN(value) ? '' : value,
        }));
    };
    
    const handleYearChange = (e) => {
        const { name, value } = e.target;
        const year = parseInt(value);

        setTempFilters(prev => ({
            ...prev,
            [name]: isNaN(year) ? '' : year,
        }));
    };


    const handleApply = () => {
        applyFilters(tempFilters);
        onClose();
    };

    const handleClear = () => {
        const defaultFilters = {
            sortBy: 'popularity.desc',
            minRating: '',
            yearMin: '',
            yearMax: '',
            language: '',
        };
        setTempFilters(defaultFilters);
        applyFilters(defaultFilters);
        onClose();
    };

    return (
        <div 
            className={`fixed inset-0 z-[60] transition-all duration-300 ${isVisible ? 'bg-black/70' : 'pointer-events-none'}`}
            onClick={onClose}
        >
            <div 
                className={`fixed top-0 right-0 h-full w-full max-w-sm bg-gray-900 shadow-2xl transition-transform duration-300 overflow-y-auto pt-20 px-6 ${
                    isVisible ? 'translate-x-0' : 'translate-x-full'
                }`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking drawer content
            >
                <div className="flex justify-between items-center pb-4 border-b border-gray-700 mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FaFilter className="text-red-500"/> Advanced Filters
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="space-y-6 text-gray-300">
                    {/* Sort By */}
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                        <label className="block text-sm font-bold mb-2">Sort Results By</label>
                        <select 
                            name="sortBy" 
                            value={tempFilters.sortBy} 
                            onChange={handleChange}
                            className="w-full bg-[#111] border border-gray-700 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Minimum Rating */}
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                        <label className="block text-sm font-bold mb-2">Minimum User Rating (0.0 - 10.0)</label>
                        <input 
                            type="number" 
                            name="minRating" 
                            value={tempFilters.minRating} 
                            onChange={handleRatingChange}
                            min="0.0" max="10.0" step="0.1"
                            placeholder="e.g., 7.5"
                            className="w-full bg-[#111] border border-gray-700 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500"
                        />
                    </div>

                    {/* Year Range */}
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                        <label className="block text-sm font-bold mb-2">Release Year Range</label>
                        <div className="flex gap-4 items-center">
                            <input 
                                type="number" 
                                name="yearMin" 
                                value={tempFilters.yearMin} 
                                onChange={handleYearChange}
                                placeholder="From (e.g., 2000)"
                                min="1800" max={new Date().getFullYear()}
                                className="w-1/2 bg-[#111] border border-gray-700 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500"
                            />
                            <span className="text-gray-500">to</span>
                            <input 
                                type="number" 
                                name="yearMax" 
                                value={tempFilters.yearMax} 
                                onChange={handleYearChange}
                                placeholder="To (e.g., 2025)"
                                min="1800" max={new Date().getFullYear()}
                                className="w-1/2 bg-[#111] border border-gray-700 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500"
                            />
                        </div>
                    </div>
                    
                    {/* Language Filter */}
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                        <label className="block text-sm font-bold mb-2">Original Language</label>
                        <select 
                            name="language" 
                            value={tempFilters.language} 
                            onChange={handleChange}
                            className="w-full bg-[#111] border border-gray-700 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="">Any Language</option>
                            {LANGUAGE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex justify-between gap-4 p-4 sticky bottom-0 bg-gray-900 border-t border-gray-700">
                    <button 
                        onClick={handleClear} 
                        className="w-1/3 bg-gray-600 text-white font-bold py-3 rounded-full hover:bg-gray-500 transition-colors"
                    >
                        Clear
                    </button>
                    <button 
                        onClick={handleApply} 
                        className="w-2/3 bg-red-600 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-red-700 transition-transform hover:scale-[1.01]"
                    >
                        Apply Filters <FaArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterDrawer;