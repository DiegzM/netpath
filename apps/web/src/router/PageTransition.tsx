import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

const transition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const };

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={transition}
    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
  >
    {children}
  </motion.div>
);
