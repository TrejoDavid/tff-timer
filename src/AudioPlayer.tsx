import React, { FC, useRef, useState, useEffect } from "react";
import {
  Paper,
  IconButton,
  Slider,
  Typography,
  Stack,
} from "@mui/material";
import { PlayArrow, Pause, VolumeUp } from "@mui/icons-material";

interface AudioPlayerProps {
  src: string;
}

const AudioPlayer: FC<AudioPlayerProps> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State for playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // State for tracking current time and duration
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // State for volume
  const [volume, setVolume] = useState<number>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    // Cleanup
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  // Play/Pause toggle
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  // Handle timeline slider drag
  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  // Handle volume changes
  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setVolume(value);
    audio.volume = value;
  };

  // Helper function to format time in M:SS
  const formatTime = (timeInSeconds: number): string => {
    if (!timeInSeconds) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        maxWidth: 400,
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: "#f5f5f5",
      }}
    >
      {/* Hidden native audio element */}
      <audio ref={audioRef} src={src} />

      <Typography variant="h6" textAlign="center">
        Custom Audio Player
      </Typography>

      {/* Play/Pause & Time Slider */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <IconButton color="primary" onClick={handlePlayPause}>
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <Slider
          aria-label="time-indicator"
          value={currentTime}
          min={0}
          max={duration || 0} // prevent NaN
          onChange={handleSliderChange}
          sx={{ flexGrow: 1 }}
        />
      </Stack>

      {/* Time Info (Current vs Remaining) */}
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2">{formatTime(currentTime)}</Typography>
        <Typography variant="body2">
          -{formatTime(duration - currentTime)}
        </Typography>
      </Stack>

      {/* Volume Slider */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <VolumeUp />
        <Slider
          aria-label="volume-slider"
          value={volume}
          min={0}
          max={0.7}
          step={0.01}
          onChange={handleVolumeChange}
          sx={{ width: 150 }}
        />
      </Stack>
    </Paper>
  );
};

export default AudioPlayer;
