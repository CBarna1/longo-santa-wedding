"use client";

import { useEffect, useState } from "react";
import { getTimeLeft, type TimeLeft } from "@/lib/countdown";
import { WEDDING_START_ISO } from "@/lib/event";

const TARGET = Date.parse(WEDDING_START_ISO);

export default function Countdown() {
  // null until mounted, so server and client HTML match (no hydration mismatch).
  const [left, setLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const tick = () => setLeft(getTimeLeft(TARGET, Date.now()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Reserve the label + boxes height so nothing jumps when the countdown mounts.
  if (!left) return <div className="h-[8.25rem]" aria-hidden />;

  if (left.done) {
    return <p className="flex h-[8.25rem] items-center justify-center font-serif text-4xl italic text-paper">Just married!</p>;
  }

  const units = [
    { value: left.days, label: left.days === 1 ? "Day" : "Days" },
    { value: left.hours, label: left.hours === 1 ? "Hour" : "Hours" },
    { value: left.minutes, label: left.minutes === 1 ? "Minute" : "Minutes" },
  ];

  return (
    <div className="h-[8.25rem]">
      <p className="mb-5 text-center text-xs uppercase tracking-[0.3em] text-mauve-light">Counting down</p>
      <div className="mx-auto flex max-w-sm justify-center gap-2 sm:gap-6" role="timer" aria-label="Time until the wedding">
        {units.map((u) => (
          // w-20 on small phones: three w-24 boxes don't fit a 320px screen.
          <div key={u.label} className="w-20 rounded-2xl bg-paper/95 py-3 shadow-lg text-center sm:w-24">
            <div className="font-serif text-4xl leading-none text-ink">{u.value}</div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-plum sm:text-[11px] sm:tracking-[0.25em]">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
