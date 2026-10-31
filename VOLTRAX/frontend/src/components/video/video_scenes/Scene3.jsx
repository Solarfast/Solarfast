import React, { useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';

const Scene3 = forwardRef(function Scene3(props, ref) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full flex flex-col items-center">
        <motion.div
          className="w-[40vw] h-[40vh] relative mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-[#F9F7F4] shadow-2xl rounded-2xl overflow-hidden border border-white/50 flex items-center justify-center">
            <img src={`${import.meta.env.BASE_URL}assets/products/hyxipower-15-9.webp`} className="h-[80%] object-contain" alt="HYXiPower Battery" />
          </div>

          <motion.div
            className="absolute -inset-4 bg-[#22a55d] opacity-20 blur-2xl rounded-3xl -z-10"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </motion.div>

        <motion.h2
          className="text-[4vw] text-[#1a3d2b] font-bold text-center"
          style={{ fontFamily: "'Playfair Display', serif" }}
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1 }}
        >
          Stop betalen voor uw <span className="text-[#22a55d]">eigen energie.</span>
        </motion.h2>

        <motion.p
          className="text-[1.5vw] text-[#1a3d2b]/70 mt-6 tracking-wide"
          style={{ fontFamily: "'Inter', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          HYXiPower Batterij + Zonnepanelen = Onafhankelijkheid
        </motion.p>
      </div>
    </motion.div>
  );
});

export default Scene3;
