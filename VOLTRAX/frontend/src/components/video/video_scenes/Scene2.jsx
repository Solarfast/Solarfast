import React, { useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';

const Scene2 = forwardRef(function Scene2(props, ref) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex w-full px-[10vw] items-center justify-between">
        <div className="w-1/2">
          <motion.h2
            className="text-[4vw] leading-tight text-[#1a3d2b] font-bold"
            style={{ fontFamily: "'Playfair Display', serif" }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            De netkosten stijgen.
          </motion.h2>
          <motion.p
            className="text-[1.8vw] text-[#1a3d2b]/70 mt-6 max-w-md"
            style={{ fontFamily: "'Inter', sans-serif" }}
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1 }}
          >
            Waarom betalen voor energie die u zelf opwekt?
          </motion.p>
        </div>

        <div className="w-1/2 flex justify-end">
          <motion.div
            className="relative w-[30vw] h-[30vw]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 rounded-full border border-[#22a55d]/30" />
            <motion.div
              className="absolute inset-4 rounded-full border border-[#22a55d]/50"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                className="text-[6vw] font-light text-[#22a55d]"
                style={{ fontFamily: "'Inter', sans-serif" }}
                initial={{ opacity: 0 }}
                animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
              >
                +42%
              </motion.div>
              <div className="text-[1.2vw] text-[#1a3d2b]/60 uppercase tracking-widest mt-2">
                Sinds 2021
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

export default Scene2;
