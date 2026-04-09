'use client';

interface CharacterCounterProps {
  current: number;
  max: number;
}

export default function CharacterCounter({ current, max }: CharacterCounterProps) {
  const isWarning = current > max * 0.8;
  const isDanger = current > max * 0.96;

  return (
    <span
      className={`text-xs transition-colors ${
        isDanger ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-gray-400'
      }`}
    >
      {current}/{max}
    </span>
  );
}
