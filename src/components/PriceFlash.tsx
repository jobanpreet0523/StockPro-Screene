import React, { useEffect, useRef, useState } from 'react';

interface PriceFlashProps {
  value: number;
  prevValue?: number;
  formatter?: (n: number) => string;
  className?: string;
}

export default function PriceFlash({ value, prevValue, formatter, className = '' }: PriceFlashProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    const prev = prevValue ?? prevRef.current;
    if (prev !== value) {
      setFlash(value > prev ? 'up' : 'down');
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    }
    prevRef.current = value;
  }, [value, prevValue]);

  const display = formatter ? formatter(value) : value.toString();

  const flashClass = flash === 'up'
    ? 'bg-emerald-500/20 text-emerald-400'
    : flash === 'down'
      ? 'bg-red-500/20 text-red-400'
      : '';

  return (
    <span className={`px-0.5 rounded transition-colors duration-200 ${flashClass} ${className}`}>
      {display}
    </span>
  );
}
