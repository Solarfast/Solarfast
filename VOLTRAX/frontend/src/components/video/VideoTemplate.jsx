import React from 'react';
import { motion } from 'framer-motion';
import { useVideoPlayer } from '../../lib/video/hooks';
import Nav from '../Nav.jsx';
import Scene1 from './video_scenes/Scene1';
import Scene2 from './video_scenes/Scene2';
import Scene3 from './video_scenes/Scene3';
import Scene4 from './video_scenes/Scene4';
import Scene5 from './video_scenes/Scene5';

const SCENE_DURATIONS = { 
  open: 4000, 
  build1: 5000, 
  build2: 6000, 
  build3: 6000, 
  close: 4000 
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <main className="sf-video-page">
      <Nav />
      <div className="sf-video-stage relative w-full min-h-[100dvh] overflow-hidden bg-[#F9F7F4]">
      {/* Persistent Background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-40 bg-[#EEF6F1]"
          animate={{
            x: ['-20%', '30%', '-10%'],
            y: ['-10%', '20%', '-20%'],
            scale: [1, 1.2, 0.9]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div 
          className="absolute w-[60vw] h-[60vw] right-0 bottom-0 rounded-full blur-[100px] opacity-30 bg-[#22a55d]"
          animate={{
            x: ['10%', '-20%', '5%'],
            y: ['10%', '-30%', '0%']
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Scenes — each fades in via its own initial/animate props */}
      {currentScene === 0 && <Scene1 />}
      {currentScene === 1 && <Scene2 />}
      {currentScene === 2 && <Scene3 />}
      {currentScene === 3 && <Scene4 />}
      {currentScene === 4 && <Scene5 />}
      </div>
    </main>
  );
}