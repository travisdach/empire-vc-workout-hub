import React, { useEffect, useRef, useState } from 'react';

interface TimerProps {
  durationSeconds: number;
}

export const Timer: React.FC<TimerProps> = ({ durationSeconds }) => {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);

  const beepRef = useRef<HTMLAudioElement | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio once
  useEffect(() => {
    beepRef.current = new Audio('/sounds/beep.wav');
    alarmRef.current = new Audio('/sounds/alarm.wav'); // <-- using the new alarm named alarm.wav

    // iOS hack: must allow playback only after first user gesture
    const unlockAudio = () => {
      beepRef.current?.play().catch(() => {});
      beepRef.current?.pause();
      beepRef.current!.currentTime = 0;

      alarmRef.current?.play().catch(() => {});
      alarmRef.current?.pause();
      alarmRef.current!.currentTime = 0;

      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
  }, []);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [running, remaining]);

  // Play beeps at 5–4–3–2–1
  useEffect(() => {
    if (!running) return;
    if (remaining <= 5 && remaining > 0) {
      beepRef.current?.play().catch(() => {});
    }
    if (remaining === 0) {
      alarmRef.current?.play().catch(() => {});
    }
  }, [remaining, running]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="text-lg font-mono">
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-3 py-1 rounded-full border border-amber-300 text-xs hover:bg-amber-300/10"
        >
          {running ? 'Pause' : 'Start'}
        </button>

        <button
          onClick={() => {
            setRunning(false);
            setRemaining(durationSeconds);
          }}
          className="px-3 py-1 rounded-full border border-slate-700 text-xs hover:border-amber-300/70"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
