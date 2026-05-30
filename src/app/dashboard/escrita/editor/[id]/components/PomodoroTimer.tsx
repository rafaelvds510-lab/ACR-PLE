'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '../editor.module.css';

interface PomodoroTimerProps {
  visible: boolean;
}

const WORK_MINS = 25;
const BREAK_MINS = 5;
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PomodoroTimer({ visible }: PomodoroTimerProps) {
  const [isWork, setIsWork] = useState(true);
  const [seconds, setSeconds] = useState(WORK_MINS * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = isWork ? WORK_MINS * 60 : BREAK_MINS * 60;
  const progress = seconds / totalSeconds;
  const strokeDash = CIRCUMFERENCE * progress;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setIsWork(w => !w);
            return (isWork ? BREAK_MINS : WORK_MINS) * 60;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, isWork]);

  if (!visible) return null;

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  return (
    <div className={styles.pomodoro} title={isWork ? 'Foco' : 'Pausa'}>
      <svg width={52} height={52} viewBox="0 0 52 52">
        <circle cx={26} cy={26} r={RADIUS} fill="none" stroke="#e5e5e5" strokeWidth={3} />
        <circle
          cx={26} cy={26} r={RADIUS}
          fill="none"
          stroke={isWork ? '#4285F4' : '#43AA8B'}
          strokeWidth={3}
          strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
        <text x={26} y={30} textAnchor="middle" fontSize={10} fontFamily="Inter, sans-serif" fontWeight={600} fill="#2c2c2c">
          {mins}:{secs}
        </text>
      </svg>
      <button
        onClick={() => setRunning(r => !r)}
        className={styles.pomodoroBtn}
        title={running ? 'Pausar' : 'Iniciar'}
      >
        {running ? '⏸' : '▶'}
      </button>
      <button
        onClick={() => { setRunning(false); setSeconds(WORK_MINS * 60); setIsWork(true); }}
        className={styles.pomodoroBtn}
        title="Reiniciar"
      >
        ↺
      </button>
    </div>
  );
}
