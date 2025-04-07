"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiPlay,
  FiPause,
  FiDownload,
  FiSkipBack,
  FiSkipForward,
  FiVolume2,
  FiInfo,
} from "react-icons/fi";
import Card from "./Card";
import { Button } from "./Button";

interface PodcastPlayerProps {
  audioUrl: string;
  title: string;
  sourceUrls?: string[];
}

export default function PodcastPlayer({
  audioUrl,
  title,
  sourceUrls = [],
}: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSourceTooltip, setShowSourceTooltip] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate smoother waveform data
  const generateWaveformData = (length = 120) => {
    const data = [];
    const smoother = 5; // Higher value = smoother waves

    // Generate baseline pattern
    for (let i = 0; i < length; i++) {
      // Create smoother pattern with less extreme peaks
      const position = i / length;
      // Uses sine waves with different frequencies to create a natural looking waveform
      const height =
        35 + // baseline height
        10 * Math.sin(position * Math.PI * 6) + // medium frequency wave
        5 * Math.sin(position * Math.PI * 15) + // high frequency details
        7 * Math.sin(position * Math.PI * 2); // low frequency envelope

      data.push(Math.max(20, Math.min(70, height))); // Limit height range
    }

    // Apply smoothing
    const smoothed = [];
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;

      for (
        let j = Math.max(0, i - smoother);
        j <= Math.min(data.length - 1, i + smoother);
        j++
      ) {
        sum += data[j];
        count++;
      }

      smoothed.push(sum / count);
    }

    return smoothed;
  };

  const [waveformData] = useState(() => generateWaveformData());
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (percentage: number) => {
    const newTime = percentage * (duration || 0);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Calculate which part of the waveform to highlight based on current playback position
  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  // Functions for skip forward/backward
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + 15,
        duration,
      );
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        audioRef.current.currentTime - 15,
        0,
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      <Card className='w-full max-w-3xl mx-auto overflow-hidden' hoverable>
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className='hidden'
        />

        <div className='flex flex-col md:flex-row gap-6 items-center mb-6'>
          <div className='podcast-artwork min-w-[120px] w-28 h-28 bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)] flex items-center justify-center'>
            <FiVolume2 className='text-white' size={40} />
          </div>
          <div className='flex-1'>
            <h3 className='text-xl font-semibold text-slate-800'>{title}</h3>
            <p className='text-sm text-gray-600 mt-1'>
              Generated Podcast • {formatTime(duration)}
              {sourceUrls.length > 1 && (
                <span
                  className='ml-2 text-[var(--primary-dark)] relative cursor-pointer group'
                  onMouseEnter={() => setShowSourceTooltip(true)}
                  onMouseLeave={() => setShowSourceTooltip(false)}>
                  Created from {sourceUrls.length} sources
                  <FiInfo className='inline-block ml-1 w-3 h-3' />
                  {showSourceTooltip && (
                    <div className='absolute z-10 left-0 mt-2 p-3 bg-white border border-gray-200 rounded-md shadow-lg w-72'>
                      <h4 className='font-medium text-sm mb-2 text-gray-700'>
                        Source URLs:
                      </h4>
                      <ul className='text-xs space-y-1 list-disc pl-4 text-gray-600'>
                        {sourceUrls.map((url, idx) => (
                          <li key={idx} className='truncate'>
                            <a
                              href={url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='hover:text-[var(--primary)] hover:underline'>
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </span>
              )}
            </p>

            <div className='flex items-center gap-2 mt-4'>
              <span className='text-xs text-gray-500 min-w-[40px]'>
                {formatTime(currentTime)}
              </span>
              <span className='text-xs text-gray-500 min-w-[40px] ml-auto'>
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Combined Waveform and Progress Bar */}
        <div
          className='waveform-container'
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            handleSeek(percentage);
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const moveX = e.clientX - rect.left;
            setHoverPosition(moveX / rect.width);
          }}
          onMouseLeave={() => setHoverPosition(null)}>
          {/* Background waveform */}
          <div className='waveform-bg'>
            {waveformData.map((height, i) => (
              <div
                key={`bg-${i}`}
                className='waveform-bar'
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          {/* Progress waveform overlay */}
          <div
            className='waveform-progress-overlay'
            style={{
              clipPath: `inset(0 ${100 - progressPercentage}% 0 0)`,
            }}>
            {waveformData.map((height, i) => (
              <div
                key={`fg-${i}`}
                className={`waveform-bar active ${
                  isPlaying && (i % 4 === 0 || i % 3 === 0) ? "playing" : ""
                }`}
                style={{
                  height: `${height}%`,
                  animationDelay: `${i * 0.03}s`,
                  animationDuration: `${1 + (i % 3) * 0.2}s`,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          {/* Hover position indicator */}
          {hoverPosition !== null && (
            <div
              className='absolute top-0 bottom-0 w-px bg-gray-400 z-10'
              style={{ left: `${hoverPosition * 100}%` }}
            />
          )}

          {/* Time tooltip on hover */}
          {hoverPosition !== null && (
            <div
              className='absolute top-0 px-2 py-1 bg-white shadow-md rounded text-xs -mt-8 transform -translate-x-1/2'
              style={{ left: `${hoverPosition * 100}%` }}>
              {formatTime(hoverPosition * duration)}
            </div>
          )}
        </div>

        <div className='podcast-controls flex justify-between items-center mt-6'>
          <Button
            variant='ghost'
            onClick={skipBackward}
            className='rounded-full p-3 text-slate-600'
            aria-label='Skip 15 seconds backward'>
            <FiSkipBack size={20} />
          </Button>

          <button
            onClick={togglePlay}
            className='play-button'
            aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? (
              <FiPause size={24} />
            ) : (
              <FiPlay size={24} className='ml-1' />
            )}
          </button>

          <Button
            variant='ghost'
            onClick={skipForward}
            className='rounded-full p-3 text-slate-600'
            aria-label='Skip 15 seconds forward'>
            <FiSkipForward size={20} />
          </Button>

          <a
            href={audioUrl}
            download
            className='ml-auto px-4 py-2 border-2 border-[var(--primary)] text-[var(--primary)] hover:border-[var(--primary-dark)] hover:shadow-md rounded-md font-medium flex items-center transition-all transform hover:scale-[1.02]'>
            <FiDownload className='mr-2' size={16} /> Download
          </a>
        </div>
      </Card>
    </motion.div>
  );
}
