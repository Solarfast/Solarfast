import React, { useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';

const Scene1 = forwardRef(function Scene1(props, ref) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div 
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-multiply"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/products/hyxipower-15-9.webp)` }}
        animate={{ scale: [1.1, 1] }}
        transition={{ duration: 4, ease: 'easeOut' }}
      />
      
      <div className="relative z-20 text-center flex flex-col items-center">
        <motion.div 
          className="text-[#1a3d2b] tracking-widest text-[1.5vw] font-medium uppercase mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          SolarFast Presenteert
        </motion.div>
        
        <h1 
          className="text-[#1a3d2b] text-[7vw] leading-none font-bold"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          <motion.span 
            className="block"
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            Energie.
          </motion.span>
          <motion.span 
            className="block text-[#22a55d]"
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            Onder controle.
          </motion.span>
        </h1>
      </div>
    </motion.div>
  );
});

Scene1.displayName = 'Scene1';
export default Scene1;