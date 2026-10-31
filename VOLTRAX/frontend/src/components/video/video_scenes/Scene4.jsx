import React, { useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';

const Scene4 = forwardRef(function Scene4(props, ref) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex w-full px-[10vw] items-center">

        <div className="w-1/2 pr-12">
          <motion.div
            className="text-[#22a55d] tracking-widest text-[1.2vw] font-bold uppercase mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.8 }}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Stap 2: Markthandel
          </motion.div>

          <motion.h2
            className="text-[4.5vw] leading-none text-[#1a3d2b] font-bold"
            style={{ fontFamily: "'Playfair Display', serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1 }}
          >
            De batterij <br/>
            handelt voor u.
          </motion.h2>

          <motion.p
            className="text-[1.6vw] text-[#1a3d2b]/70 mt-6"
            style={{ fontFamily: "'Inter', sans-serif" }}
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1 }}
          >
            Verdien dagelijks op de energiemarkt, volledig automatisch.
          </motion.p>
        </div>

        <div className="w-1/2 flex justify-center">
          <motion.div
            className="bg-white shadow-2xl rounded-3xl p-12 relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 1.2, type: 'spring', bounce: 0.2 }}
          >
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 bg-[#EEF6F1] rounded-full blur-3xl -mr-10 -mt-10"
            />

            <div className="text-[1.2vw] text-[#1a3d2b]/60 mb-2 uppercase tracking-wide">
              Geschatte opbrengst
            </div>

            <motion.div
              className="text-[5vw] text-[#22a55d] font-bold leading-none mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={phase >= 4 ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
              transition={{ duration: 1, type: 'spring' }}
            >
              €840 – €3.796
            </motion.div>

            <div className="text-[1.5vw] text-[#1a3d2b]/80">
              per jaar
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
});

export default Scene4;
