'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import WaveSurfer from 'wavesurfer.js';
import { Flexbox } from 'react-layout-kit';
import { Spin } from 'antd';

interface WaveformDisplayProps {
  url: string | null;
  isPlaying: boolean; // Controlled by parent
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onFinish?: () => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
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
    container: containerRef,
    height: 100, // Adjust height as needed
    waveColor: 'rgb(200, 200, 200)',
    progressColor: 'rgb(100, 100, 100)',
    url: url || undefined,
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
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
    else if (!isPlaying) {
      // Only pause if it's actually playing to avoid unnecessary calls/errors
      // Check if wavesurfer thinks it's playing before pausing
      if (wavesurfer.isPlaying()) { 
         wavesurfer.pause();
      }
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
    <Flexbox align="center" justify="center" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <Spin size="large" style={{ position: 'absolute', zIndex: 10 }} />
      )}
      <div ref={containerRef} style={{ width: '100%', opacity: isLoading ? 0.5 : 1 }} />
      {/* Optional: Display current time 
      <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '2px 5px', fontSize: 10 }}>
         {currentTime.toFixed(1)}s
      </div>
      */} 
    </Flexbox>
  );
};

export default WaveformDisplay; 