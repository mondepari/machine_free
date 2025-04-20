'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import { Flexbox } from 'react-layout-kit';
import { Spin } from 'antd';

interface WaveformDisplayProps {
  isPlaying: boolean;
  onFinish?: () => void; 
  onLoadedMetadata?: (duration: number) => void;
  onPause?: () => void;
  onPlay?: () => void;
  // Controlled by parent
  onReady?: () => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  url: string | null;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  url,
  isPlaying,
  onReady,
  onPlay,
  onPause,
  onFinish,
  onSeek,
  onTimeUpdate,
  onLoadedMetadata,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { wavesurfer, isReady, currentTime } = useWavesurfer({
    barGap: 1,
    barRadius: 2, 
    barWidth: 2,
    
container: containerRef,
    
height: 100,
    
progressColor: 'rgb(100, 100, 100)',
    
url: url || undefined,
    // Adjust height as needed
waveColor: 'rgb(200, 200, 200)',
    // More options: https://wavesurfer.xyz/docs/options
  });

  // Play/pause wavesurfer based on parent state
  useEffect(() => {
    // Only act if wavesurfer exists
    if (!wavesurfer) return;

    // If we should be playing AND wavesurfer is ready
    if (isPlaying && isReady) {
      wavesurfer.play().catch(e => console.error("Wavesurfer play error:", e)); // Add catch for safety
    } 
    // If we should NOT be playing (and wavesurfer exists)
    else if (!isPlaying && // Only pause if it's actually playing to avoid unnecessary calls/errors
      // Check if wavesurfer thinks it's playing before pausing
      wavesurfer.isPlaying()) { 
         wavesurfer.pause();
      }
    // Depend on isReady as well, so it retries playing when ready, if isPlaying is still true
  }, [isPlaying, wavesurfer, isReady]);

  // Update URL when it changes
  useEffect(() => {
    if (url && wavesurfer) {
      setIsLoading(true);
      wavesurfer.load(url).catch(e => {
          console.error("Wavesurfer load error:", e);
          setIsLoading(false);
      });
    }
  }, [url, wavesurfer]);

  // Subscribe to wavesurfer events
  useEffect(() => {
    if (!wavesurfer) return;

    const subscriptions = [
      wavesurfer.on('ready', (duration) => {
        console.log('Waveform ready, duration:', duration);
        setIsLoading(false);
        onReady?.();
        onLoadedMetadata?.(duration);
      }),
      wavesurfer.on('play', () => {
        console.log('Waveform play');
        onPlay?.();
      }),
      wavesurfer.on('pause', () => {
        console.log('Waveform pause');
        onPause?.();
      }),
      wavesurfer.on('finish', () => {
        console.log('Waveform finish');
        onFinish?.();
      }),
      wavesurfer.on('seeking', (time) => {
        console.log('Waveform seeking:', time);
        onSeek?.(time);
        onTimeUpdate?.(time);
      }),
      wavesurfer.on('audioprocess', (time) => {
        onTimeUpdate?.(time);
      }),
      wavesurfer.on('loading', (percent: number) => {
         // Can be used for loading progress indicator if needed
         if (percent >= 100) {
             setIsLoading(false); // Ensure loading stops
         }
       }),
       wavesurfer.on('error', (err: Error) => {
         console.error('Wavesurfer error:', err);
         setIsLoading(false);
       }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wavesurfer, onReady, onPlay, onPause, onFinish, onSeek, onTimeUpdate, onLoadedMetadata]);

  return (
    <Flexbox align="center" justify="center" style={{ height: '100%', position: 'relative', width: '100%' }}>
      {isLoading && (
        <Spin size="large" style={{ position: 'absolute', zIndex: 10 }} />
      )}
      <div ref={containerRef} style={{ opacity: isLoading ? 0.5 : 1, width: '100%' }} />
      {/* Optional: Display current time 
      <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '2px 5px', fontSize: 10 }}>
         {currentTime.toFixed(1)}s
      </div>
      */} 
    </Flexbox>
  );
};

export default WaveformDisplay; 