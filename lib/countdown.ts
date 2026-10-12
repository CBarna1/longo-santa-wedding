/** Remaining time until a target instant, for the countdown display. */
export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  done: boolean;
}

/**
 * Pure so it can be unit-tested with fixed timestamps.
 * Partial minutes round up, so the display never reads "0 minutes" early.
 */
export function getTimeLeft(targetMs: number, nowMs: number): TimeLeft {
  const diff = targetMs - nowMs;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, done: true };

  const totalMinutes = Math.ceil(diff / 60_000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    done: false,
  };
}
