import { Track } from 'livekit-client';
import { useEffect, useState } from 'react';

export const useTrackVolume = (track?: Track) => {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!track || !track.mediaStream) {
      return;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(track.mediaStream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 32;
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const a = dataArray[i];
        sum += a * a;
      }
      setVolume(Math.sqrt(sum / dataArray.length) / 255);
    };

    const interval = setInterval(updateVolume, 1000 / 30); // 30 FPS

    return () => {
      source.disconnect();
      clearInterval(interval);
    };
  }, [track, track?.mediaStream]);

  return volume; // 0-1 normalized value
};
