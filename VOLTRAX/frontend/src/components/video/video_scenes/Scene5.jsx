import React, { useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';

const Scene5 = forwardRef(function Scene5(props, ref) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#1a3d2b]"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="text-[#22a55d] text-[2.5vw] font-medium mb-12 tracking-wide"
        style={{ fontFamily: "'Inter', sans-serif" }}
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1 }}
      >
        Terugverdientijd: 3–5 jaar. Daarna 15+ jaar pure winst.
      </motion.div>

      <motion.div
        className="flex items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 1, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="SolarFast Logo" className="h-[6vw] filter brightness-0 invert" />
      </motion.div>

      <motion.div
        className="text-[#F9F7F4] text-[1.8vw] mt-8 tracking-widest uppercase opacity-80"
        style={{ fontFamily: "'Inter', sans-serif" }}
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
      >
        Slim. Groen. Onafhankelijk.
      </motion.div>

    </motion.div>
  );
});

export default Scene5;
