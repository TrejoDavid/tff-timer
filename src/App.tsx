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
import round1 from "./Round1.mp3";
import round2 from "./Round2.mp3";
import finalRound from "./FinalRound.mp3";
import excellent from "./Excellent.mp3";
import impressive from "./Impressive.mp3";
import outstanding from "./Outstanding.mp3";

interface Round {
  sets: number;
  workoutTime: number;
  restTime: number;
}

const App: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPausedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tracks = [round1, round2];
  const roundOver = [finalRound, excellent, impressive, outstanding];

  const [rounds, setRounds] = useState<Round[]>([
    { sets: 1, workoutTime: 30, restTime: 15 },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [currentSet, setCurrentSet] = useState<number | null>(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const playSound = (soundList: string[]) => {
    return new Promise<void>((resolve) => {
      if (audioRef.current) {
        const randomTrack = soundList[Math.floor(Math.random() * soundList.length)];
        audioRef.current.src = randomTrack;
        audioRef.current.load();
        audioRef.current
          .play()
          .catch((error) => console.error("Playback failed:", error))
          .finally(() => {
            setTimeout(resolve, 1000);
          });
      } else {
        resolve();
      }
    });
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

        await playSound(tracks);
        setPhase("Workout");

        await countdown(round.workoutTime);
        await playSound(roundOver);

        if (setIndex < round.sets - 1) {
          setPhase("Rest");
          await countdown(round.restTime);
        }
      }
    }

    setIsRunning(false);
    setPhase(null);
    setTimeRemaining(null);
    setCurrentRound(null);
    setCurrentSet(null);
  };

  const countdown = (duration: number) => {
    return new Promise<void>((resolve) => {
      setTimeRemaining(duration);
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          setTimeRemaining((prev) => {
            if (prev !== null && prev > 1) {
              return prev - 1;
            } else {
              clearInterval(intervalRef.current!);
              resolve();
              return null;
            }
          });
        }
      }, 1000);
    });
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const endWorkout = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(null);
    setPhase(null);
    setCurrentRound(null);
    setCurrentSet(null);
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
                  } fullWidth />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField label="Workout (s)" type="number" value={round.workoutTime} onChange={(e) =>
                    handleRoundChange(index, "workoutTime", Number(e.target.value))
                  } fullWidth />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField label="Rest (s)" type="number" value={round.restTime} onChange={(e) =>
                    handleRoundChange(index, "restTime", Number(e.target.value))
                  } fullWidth />
              </Grid>
            </Grid>

            <Button startIcon={<ContentCopy />} onClick={() => duplicateRound(index)} sx={{ mt: 2 }}>
              Duplicate
            </Button>
          </CardContent>
        </Card>
      ))}

      {isRunning && (
        <Typography variant="h6" align="center" sx={{ mt: 2 }}>
          Current Round: {currentRound} | Set: {currentSet} | Phase: {phase}
        </Typography>
      )}

      {isRunning && timeRemaining !== null && (
        <Typography variant="h5" align="center" sx={{ mt: 2, fontWeight: "bold" }}>
          Time Remaining: {formatTime(timeRemaining)}
        </Typography>
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
    </Container>
  );
};

export default App;
