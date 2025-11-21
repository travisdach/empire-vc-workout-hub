import React, { useEffect, useState } from 'react';

interface TimerProps {
  durationSeconds: number;
}

export const Timer: React.FC<TimerProps> = ({ durationSeconds }) => {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [running, remaining]);

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
