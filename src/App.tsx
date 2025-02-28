import React, { useRef, useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Add, Remove, PlayArrow, Pause, Stop, ContentCopy } from "@mui/icons-material";

import round1 from "./Sounds/RoundStart/Round1.mp3";
import round2 from "./Sounds/RoundStart/Round2.mp3";
import round3 from "./Sounds/RoundStart/Round3.mp3";
import round4 from "./Sounds/RoundStart/Round4.mp3";
import round5 from "./Sounds/RoundStart/Round5.mp3";
import round6 from "./Sounds/RoundStart/Round6.mp3";
import round7 from "./Sounds/RoundStart/Round7.mp3";
import round8 from "./Sounds/RoundStart/Round8.mp3";
import round9 from "./Sounds/RoundStart/Round9.mp3";

import bell from "./Sounds/RoundEnd/Bell.mp3"

import set1 from "./Sounds/Sets/Set1.mp3"
import set2 from "./Sounds/Sets/Set2.mp3"
import set3 from "./Sounds/Sets/Set3.mp3"
import set4 from "./Sounds/Sets/Set4.mp3"
import set5 from "./Sounds/Sets/Set5.mp3"
import set6 from "./Sounds/Sets/Set6.mp3"
import set7 from "./Sounds/Sets/Set7.mp3"


import finalRound from "./FinalRound.mp3";
import excellent from "./Excellent.mp3";
import impressive from "./Impressive.mp3";
import outstanding from "./Outstanding.mp3";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import AudioPlayer from "./AudioPlayer";
import Song from "./Una gatita que le gusta el mambo_ Bellakath - Gatita [Lyrics]. (Gatita bailando).mp3";

interface Round {
  sets: number;
  workoutTime: number;
  restTime: number;
}

const App: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPausedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tracks = [round1, round2, round3, round4, round5, round6, round7, round8, round9];
  const setSounds = [set2, set3, set4, set5, set6, set7];
  const roundOver = [bell];

  const [rounds, setRounds] = useState<Round[]>([
    { sets: 1, workoutTime: 3, restTime: 3 },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [currentSet, setCurrentSet] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null); // Track when the countdown starts
  const [initialTime, setInitialTime] = useState<number | null>(null);


  useEffect(() => {
    if (isRunning) {
      setInitialTime(timeRemaining); // Store timeRemaining only when phase starts
    }
  }, [isRunning, phase]); // Reset only when phase changes

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);


  const playSetSound = async (roundNumber: number) => {
    if (audioRef.current) {
      const trackToPlay = tracks[roundNumber - 1] || tracks[0]; // Default to Round 1 if out of range
      audioRef.current.src = trackToPlay;
      audioRef.current.load();
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Set sound playback failed:", error);
      }
    }
  };

  const playSound = async (soundList: string[], roundNumber?: number) => {
    if (audioRef.current) {
      // Select the correct round track
      const trackToPlay = roundNumber ? soundList[roundNumber - 1] : soundList[0];

      audioRef.current.src = trackToPlay;
      audioRef.current.load();
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Playback failed:", error);
      }
    }
  };


  const playRoundOrSetSound = async (roundNumber: number, setNumber: number) => {
    if (audioRef.current) {
      let trackToPlay;

      if (setNumber === 1) {
        // First set of the round, play round sound
        trackToPlay = tracks[roundNumber - 1] || tracks[0];
      } else {
        // Subsequent sets, play set sound
        trackToPlay = setSounds[setNumber - 2] || setSounds[setSounds.length - 1];
      }

      audioRef.current.src = trackToPlay;
      audioRef.current.load();
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Sound playback failed:", error);
      }
    }
  };


  const handleRoundChange = (index: number, field: keyof Round, value: number) => {
    const updatedRounds = rounds.map((round, i) =>
      i === index ? { ...round, [field]: value } : round
    );
    setRounds(updatedRounds);
  };

  const addRound = () => {
    setRounds([...rounds, { sets: 1, workoutTime: 30, restTime: 15 }]);
  };

  const removeRound = (index: number) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const duplicateRound = (index: number) => {
    setRounds([...rounds, { ...rounds[index] }]);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const calculateTotalTime = () => {
    const totalSeconds = rounds.reduce(
      (total, round) => total + round.sets * (round.workoutTime + round.restTime),
      0
    );
    return formatTime(totalSeconds);
  };

  const startWorkout = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsPaused(false);

    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
      const round = rounds[roundIndex];

      for (let setIndex = 0; setIndex < round.sets; setIndex++) {
        setCurrentRound(roundIndex + 1);
        setCurrentSet(setIndex + 1);
        setPhase("Workout");

        await playRoundOrSetSound(roundIndex + 1, setIndex + 1); // Play round or set sound
        startCountdown(round.workoutTime);
        await countdown(round.workoutTime);

        await playSound(roundOver); // Play round end sound

        // Apply rest time between sets
        if (setIndex < round.sets - 1) {
          setPhase("Rest");
          startCountdown(round.restTime);
          await countdown(round.restTime);
        }
      }

      // ✅ Apply final rest time **AFTER last set of a round**, before next round
      if (roundIndex < rounds.length - 1) {
        setPhase("Rest Before Next Round");
        startCountdown(round.restTime);
        await countdown(round.restTime);
      }
    }

    // Reset workout state
    setIsRunning(false);
    setPhase(null);
    setTimeRemaining(null);
    setCurrentRound(null);
    setCurrentSet(null);
  };

  const countdown = (duration: number) => {
    return new Promise<void>((resolve) => {
      let start = Date.now();
      let elapsedPausedTime = 0;
      let pausedAt: number | null = null;

      setTimeRemaining(duration);

      const tick = () => {
        if (!isPausedRef.current) {
          if (pausedAt) {
            // Adjust start time when resuming
            elapsedPausedTime += Date.now() - pausedAt;
            pausedAt = null; // Reset pause marker
          }

          const elapsed = Math.floor((Date.now() - start - elapsedPausedTime) / 1000);
          const remaining = Math.max(0, duration - elapsed);
          setTimeRemaining(remaining);

          if (remaining > 0) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        } else if (!pausedAt) {
          // Store pause timestamp to track elapsed paused time
          pausedAt = Date.now();
          requestAnimationFrame(tick); // Keep the loop running to check when it's unpaused
        }
      };

      tick();
    });
  };

  const togglePause = () => {
    setIsPaused((prev) => {
      const newPausedState = !prev;
      isPausedRef.current = newPausedState;
      return newPausedState;
    });

    if (!isPausedRef.current) {
      // If resuming, restart the countdown function from the current `timeRemaining`
      countdown(timeRemaining!);
    }
  };

  const endWorkout = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(null); // ✅ Reset time remaining
    setInitialTime(null);   // ✅ Reset initial time
    setPhase(null);
    setCurrentRound(null);
    setCurrentSet(null);
  };

  const startCountdown = (duration: number) => {
    setInitialTime(duration); // Store stable initial time
    setTimeRemaining(duration);
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" align="center" gutterBottom>
        Workout Timer
      </Typography>

      <Typography variant="h6" align="center" gutterBottom>
        Total Estimated Time: {calculateTotalTime()}
      </Typography>

      {rounds.map((round, index) => (
        <Card key={index} variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Round {index + 1}</Typography>
              <IconButton onClick={() => removeRound(index)} color="error">
                <Remove />
              </IconButton>
            </Box>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 4 }}>
                <TextField label="Sets" type="number" value={round.sets} onChange={(e) =>
                  handleRoundChange(index, "sets", Number(e.target.value))
                } fullWidth slotProps={{ input: { inputProps: { min: 0 } } }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField label="Workout (s)" type="number" value={round.workoutTime} onChange={(e) =>
                  handleRoundChange(index, "workoutTime", Number(e.target.value))
                } fullWidth slotProps={{ input: { inputProps: { min: 0 } } }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField label="Rest (s)" type="number" value={round.restTime} onChange={(e) =>
                  handleRoundChange(index, "restTime", Number(e.target.value))
                } fullWidth slotProps={{ input: { inputProps: { min: 0 } } }}
                />
              </Grid>
            </Grid>

            <Button startIcon={<ContentCopy />} onClick={() => duplicateRound(index)} sx={{ mt: 2 }}>
              Duplicate
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button
        startIcon={<Add />}
        onClick={addRound}
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
      >
        Add Round
      </Button>

      {isRunning && (
        <Typography variant="h6" align="center" sx={{ mt: 2 }}>
          Current Round: {currentRound} | Set: {currentSet} | Phase: {phase}
        </Typography>
      )}

      {isRunning && timeRemaining !== null && (
        <Box display="flex" flexDirection="column" alignItems="center" sx={{ mt: 2 }}>
          <CountdownCircleTimer
            key={phase} // Ensures timer resets only when phase changes
            isPlaying={isRunning && !isPaused}
            duration={initialTime ?? timeRemaining} // Uses stable duration
            initialRemainingTime={timeRemaining} // Prevents flickering
            colors={"#00C853"}
            updateInterval={0.1}
            size={220}
            strokeWidth={15}
            trailStrokeWidth={10}
            trailColor="#444"
            rotation="counterclockwise"
            isGrowing={true}
            isSmoothColorTransition={true}
            onComplete={() => {
              console.log("Timer completed! Moving to next phase.");

              if (phase === "Workout") {
                setPhase("Rest");
                startCountdown(rounds[currentRound! - 1].restTime);
                countdown(rounds[currentRound! - 1].restTime);
              } else if (phase === "Rest") {
                setCurrentSet((prev) => {
                  if (prev! < rounds[currentRound! - 1].sets) {
                    setPhase("Workout");
                    startCountdown(rounds[currentRound! - 1].workoutTime);
                    countdown(rounds[currentRound! - 1].workoutTime);
                    return prev! + 1;
                  } else {
                    return prev; // Stay at last set
                  }
                });
              }

              return { shouldRepeat: false };
            }}
          >
            {({ remainingTime }) => (
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {formatTime(remainingTime)}
              </Typography>
            )}
          </CountdownCircleTimer>
        </Box>
      )}

      <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
        <Button startIcon={<PlayArrow />} onClick={startWorkout} disabled={isRunning} variant="contained">
          Start Workout
        </Button>

        {isRunning && (
          <>
            <Button startIcon={isPaused ? <PlayArrow /> : <Pause />} onClick={togglePause} variant="contained">
              {isPaused ? "Resume" : "Pause"}
            </Button>

            <Button startIcon={<Stop />} onClick={endWorkout} variant="contained" color="error">
              End Workout
            </Button>
          </>
        )}
      </Box>

      <audio ref={audioRef} />
      <AudioPlayer src={Song} />
    </Container>
  );
};

export default App;
