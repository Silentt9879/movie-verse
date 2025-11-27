import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaHeart, FaSearch } from 'react-icons/fa';

const MobileNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleSearchClick = () => {
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                const input = document.getElementById('searchInput');
                if (input) {
                    input.focus();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 100);
        } else {
            const input = document.getElementById('searchInput');
            if (input) {
                input.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#121212]/95 backdrop-blur-md border-t border-gray-800 z-50 flex justify-around items-center py-3 pb-safe">
            <Link to="/" className="flex flex-col items-center text-gray-400 hover:text-white active:text-red-600 transition-colors">
                <FaHome className="text-xl mb-1" />
                <span className="text-[10px] font-bold">Home</span>
            </Link>
            
            <div className="flex flex-col items-center text-gray-400 hover:text-white cursor-pointer" onClick={handleSearchClick}>
                <FaSearch className="text-xl mb-1" />
                <span className="text-[10px] font-bold">Search</span>
            </div>

            <Link to="/mylist" className="flex flex-col items-center text-gray-400 hover:text-white active:text-red-600 transition-colors">
                <FaHeart className="text-xl mb-1" />
                <span className="text-[10px] font-bold">My List</span>
            </Link>
        </div>
    );
};

export default MobileNav;