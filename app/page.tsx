import Image from "next/image";
import RSVPForm from "./components/RSVPForm";
import Countdown from "./components/Countdown";
import { LeafArch, Sprig } from "./components/Leaves";
import {
  CITY,
  COUPLE,
  COUPLE_FULL,
  DRESS_CODE,
  DRESS_CODE_COLORS,
  DRESS_CODE_SWATCHES,
  EVENTS,
  WEDDING_DATE_LABEL,
  WEDDING_DATE_NUMERIC,
} from "@/lib/event";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <Sprig className="mx-auto mb-4 h-4 w-20 text-mauve-light" />
      <h2 className="text-glow font-serif text-4xl font-medium text-paper sm:text-5xl">{children}</h2>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative isolate min-h-screen">
      {/* Full-page photo background: fixed behind everything, slowly drifting. Lightly pre-blurred file,
          served at full size because it is scaled to cover the screen height on phones. */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-ink">
        <Image
          src="/couple-bg.jpg"
          alt=""
          fill
          priority
          unoptimized
          className="animate-drift object-cover object-[50%_15%] motion-reduce:animate-none"
        />
        <div className="absolute inset-0 bg-ink/40" />
      </div>

      {/* Hero */}
      <section className="text-glow flex min-h-[85vh] flex-col items-center justify-center px-6 py-20 text-center">
        <LeafArch className="h-20 w-40 text-mauve-light sm:h-24 sm:w-48" />
        <h1 className="mt-6 font-serif text-4xl font-medium leading-[0.95] text-paper min-[360px]:text-5xl sm:text-7xl lg:text-8xl">
          <span className="block whitespace-nowrap">
            {COUPLE.first} {COUPLE.firstSurname}
          </span>
          <span className="my-3 block text-3xl italic text-mauve-light sm:text-4xl">&amp;</span>
          <span className="block whitespace-nowrap">
            {COUPLE.second} {COUPLE.secondSurname}
          </span>
        </h1>
        <p className="mt-8 max-w-md font-serif text-xl font-medium italic leading-relaxed text-paper sm:text-2xl">
          Invite you to share in the joy of their wedding day celebration as they begin this beautiful
          chapter together.
        </p>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-paper sm:text-sm">
          {WEDDING_DATE_LABEL} · {CITY}
        </p>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper sm:text-base">
          This special occasion is reserved for adults only, and the couple kindly request your understanding.
        </p>
        <a
          href="#rsvp"
          className="mt-10 inline-block rounded-full bg-paper px-9 py-3 text-sm font-semibold uppercase shadow-lg [text-shadow:none] tracking-[0.25em] text-plum transition hover:-translate-y-0.5 hover:bg-mauve-light"
        >
          RSVP
        </a>
      </section>

      {/* Countdown */}
      <section className="px-4 pb-20">
        <Countdown />
      </section>

      {/* The Day */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-xl">
          <SectionTitle>The Day</SectionTitle>
          <ol className="divide-y divide-mauve-light rounded-3xl bg-paper/95 px-4 shadow-lg">
            {EVENTS.map((ev) => (
              <li key={ev.key} className="flex items-baseline gap-5 px-2 py-5">
                <span className="w-20 shrink-0 text-sm font-semibold tracking-wide text-plum">{ev.time}</span>
                <span>
                  <span className="block font-serif text-2xl text-ink">{ev.name}</span>
                  <span className="block text-ink/60">{ev.venue}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Dress code */}
      <section id="dress-code" className="scroll-mt-8 px-4 pb-20 text-center">
        <SectionTitle>Dress Code</SectionTitle>
        <div className="mx-auto max-w-3xl rounded-3xl bg-paper/95 px-6 py-10 shadow-lg">
          <p className="font-serif text-2xl italic text-ink/80 sm:text-3xl">{DRESS_CODE}</p>
          <p className="mt-3 text-sm tracking-wide text-ink/70">{DRESS_CODE_COLORS}</p>
          <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {DRESS_CODE_SWATCHES.map((s) => (
              <li key={s.name} className="flex flex-col items-center">
                <span
                  className="h-20 w-20 rounded-full shadow-sm ring-1 ring-ink/10 sm:h-24 sm:w-24"
                  style={{ background: `radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.12), transparent 60%), ${s.hex}` }}
                  aria-hidden="true"
                />
                <span className="mt-3 text-sm text-ink/80">{s.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* RSVP */}
      <section id="rsvp" className="scroll-mt-8 px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-xl">
          <SectionTitle>Kindly Reply</SectionTitle>
          <RSVPForm />
        </div>
      </section>

      <footer className="text-glow px-4 pb-12 text-center font-serif text-lg font-medium italic text-paper">
        {COUPLE_FULL} · {WEDDING_DATE_NUMERIC}
      </footer>
    </main>
  );
}
