'use client';

import React from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';

interface MotionWrapperProps {
  children: React.ReactNode;
  motionKey: string; // Add a key for AnimatePresence
}

const MotionWrapper: React.FC<MotionWrapperProps> = ({ children, motionKey }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={motionKey} // Use the provided key
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default MotionWrapper;
