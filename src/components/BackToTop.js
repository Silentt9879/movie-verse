import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';

const BackToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    useEffect(() => {
        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    if (!isVisible) return null;

    return (
        <div 
            onClick={scrollToTop}
            className="fixed bottom-20 md:bottom-8 right-8 bg-red-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-red-700 hover:scale-110 transition-all z-50 animate-bounce"
        >
            <FaArrowUp size={20} />
        </div>
    );
};

export default BackToTop;