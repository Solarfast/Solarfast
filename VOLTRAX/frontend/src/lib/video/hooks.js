import { useState, useEffect } from 'react';

export function useVideoPlayer({ durations }) {
  const [currentScene, setCurrentScene] = useState(0);
  
  useEffect(() => {
    window.startRecording?.();
    const sceneKeys = Object.keys(durations);
    let isCancelled = false;
    let timeoutId;
    let hasCompletedFirstPass = false;

    const advanceScene = (index) => {
      if (isCancelled) return;
      setCurrentScene(index);
      
      const duration = durations[sceneKeys[index]];
      timeoutId = setTimeout(() => {
        const nextIndex = index + 1;
        if (nextIndex >= sceneKeys.length) {
          if (!hasCompletedFirstPass) {
            window.stopRecording?.();
            hasCompletedFirstPass = true;
          }
          advanceScene(0);
        } else {
          advanceScene(nextIndex);
        }
      }, duration);
    };

    advanceScene(0);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, []); // Deliberately empty per instructions so we only start/stop recording once

  return { currentScene };
}