import React from 'react';
import { motion } from 'framer-motion';

const LoadingBar = ({ isLoading }) => {
  return (
    <motion.div
      className="fixed top-0 left-0 h-1 bg-red-600 z-[9999]"
      initial={{ width: 0 }}
      animate={{ width: isLoading ? '80%' : '100%' }}
      transition={{ duration: isLoading ? 0.5 : 0.2, ease: 'easeInOut' }}
      style={{
        // When loading is finished, quickly animate to 100% and then hide
        opacity: isLoading ? 1 : 0,
        // Ensure it jumps back to 0 when starting a new load
        transitionProperty: isLoading ? 'width, opacity' : 'width, opacity, visibility',
        transitionDuration: isLoading ? '0.5s, 0.5s' : '0.2s, 0.2s',
        transitionDelay: isLoading ? '0s, 0s' : '0.2s, 0s',
      }}
    />
  );
};

export default LoadingBar;