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

  if (!left) return <div className="h-24" aria-hidden />;

  if (left.done) {
    return <p className="h-24 pt-6 text-center font-serif text-4xl italic text-sage">Just married!</p>;
  }

  const units = [
    { value: left.days, label: left.days === 1 ? "Day" : "Days" },
    { value: left.hours, label: left.hours === 1 ? "Hour" : "Hours" },
    { value: left.minutes, label: left.minutes === 1 ? "Minute" : "Minutes" },
  ];

  return (
    <div className="mx-auto flex h-24 max-w-sm justify-center gap-3 sm:gap-6" role="timer" aria-label="Time until the wedding">
      {units.map((u) => (
        <div key={u.label} className="w-24 rounded-2xl border border-sage-light bg-white/70 py-3 text-center">
          <div className="font-serif text-4xl leading-none text-ink">{u.value}</div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.25em] text-sage">{u.label}</div>
        </div>
      ))}
    </div>
  );
}
