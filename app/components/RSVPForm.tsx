"use client";

import { useEffect, useState, type FormEvent } from "react";
import { isRsvpOpen } from "@/lib/countdown";
import { EVENTS, WEDDING_START_ISO, type EventKey } from "@/lib/event";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-mauve-light bg-white px-4 py-3 text-ink placeholder:text-ink/40 " +
  "transition focus:border-plum focus:outline-none focus:ring-2 focus:ring-plum/20";
const labelClass = "mb-2 block text-sm tracking-wide text-ink/80";

export default function RSVPForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [events, setEvents] = useState<Record<EventKey, boolean>>({ blessing: true, reception: true });
  const [guestCount, setGuestCount] = useState(1);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: stays empty for real guests
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  // The page is static, so check the clock in the browser after mounting.
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    setClosed(!isRsvpOpen(Date.parse(WEDDING_START_ISO), Date.now()));
  }, []);

  function fail(msg: string) {
    setError(msg);
    setStatus("error");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (attending === null) return fail("Please let us know if you can attend.");
    if (attending && !events.blessing && !events.reception) {
      return fail("Please choose at least one event to attend.");
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          attending,
          guest_count: attending ? guestCount : 1,
          blessing: attending && events.blessing,
          reception: attending && events.reception,
          dietary_restrictions: attending ? dietary : "",
          message,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status >= 500) {
        // Server/database errors aren't meaningful to guests; keep details in the console.
        console.error("RSVP failed:", data.error);
        throw new Error("We couldn't save your RSVP right now. Please try again in a moment.");
      }
      if (!res.ok || !data.success) {
        // 4xx validation messages are written for guests, so show them as-is.
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("success");
    } catch (err) {
      fail(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-mauve-light bg-white px-6 py-14 text-center shadow-sm" role="status">
        <p className="font-serif text-4xl text-plum">Thank you! 💌</p>
        <p className="mx-auto mt-4 max-w-sm text-ink/70">
          {attending
            ? "We can't wait to celebrate with you. A confirmation is on its way to your inbox."
            : "We'll miss you dearly. Thank you for letting us know."}
        </p>
      </div>
    );
  }

  if (closed) {
    return (
      <div className="rounded-3xl border border-mauve-light bg-white px-6 py-14 text-center shadow-sm" role="status">
        <p className="font-serif text-3xl text-plum">RSVPs are now closed</p>
        <p className="mx-auto mt-4 max-w-sm text-ink/70">Thank you to everyone who celebrated with us.</p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-mauve-light bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10"
    >
      <div>
        <label htmlFor="name" className={labelClass}>Full Name</label>
        <input id="name" type="text" required maxLength={120} autoComplete="name" value={name}
          onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your full name" />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" type="email" required maxLength={254} autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
      </div>

      <fieldset>
        <legend className={labelClass}>Will you attend?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: true, label: "Joyfully accepts" },
            { value: false, label: "Regretfully declines" },
          ].map((opt) => {
            const selected = attending === opt.value;
            return (
              <label
                key={opt.label}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  selected ? "border-plum bg-plum/10 text-ink" : "border-mauve-light text-ink/70 hover:border-plum/60 hover:bg-paper"
                }`}
              >
                <input type="radio" name="attending" required checked={selected}
                  onChange={() => setAttending(opt.value)} className="h-4 w-4 accent-plum" />
                <span className="font-serif text-xl">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {attending && (
        <div className="space-y-6">
          <fieldset>
            <legend className={labelClass}>Which events will you attend?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {EVENTS.map((ev) => (
                <label
                  key={ev.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                    events[ev.key] ? "border-plum bg-plum/10" : "border-mauve-light hover:border-plum/60 hover:bg-paper"
                  }`}
                >
                  <input type="checkbox" checked={events[ev.key]}
                    onChange={(e) => setEvents((prev) => ({ ...prev, [ev.key]: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-plum" />
                  <span>
                    <span className="block font-serif text-xl text-ink">{ev.name}</span>
                    <span className="block text-sm text-ink/60">{ev.time} · {ev.venue}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="guests" className={labelClass}>Number of guests (including you)</label>
            <select id="guests" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} className={inputClass}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dietary" className={labelClass}>
              Dietary restrictions <span className="text-ink/50">(optional)</span>
            </label>
            <input id="dietary" type="text" maxLength={2000} value={dietary}
              onChange={(e) => setDietary(e.target.value)} className={inputClass} placeholder="Vegetarian, nut allergy…" />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="message" className={labelClass}>
          Message to the couple <span className="text-ink/50">(optional)</span>
        </label>
        <textarea id="message" rows={4} maxLength={2000} value={message}
          onChange={(e) => setMessage(e.target.value)} className={`${inputClass} resize-y`} placeholder="Share your well wishes…" />
      </div>

      {/* Honeypot: hidden from people and screen readers; bots tend to fill it. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" value={website}
          onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {status === "error" && error && (
        <p className="rounded-xl bg-plum/10 px-4 py-3 text-sm text-plum-dark" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-plum px-6 py-4 text-sm uppercase tracking-[0.25em] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-plum-dark hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
        {submitting ? "Sending…" : "Send RSVP"}
      </button>
    </form>
  );
}
