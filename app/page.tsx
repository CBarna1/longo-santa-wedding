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
      <Sprig className="mx-auto mb-4 h-4 w-20 text-silver" />
      <h2 className="font-serif text-4xl text-ink sm:text-5xl">{children}</h2>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative isolate flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src="/couple.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover object-[50%_15%] blur-[3px]"
          />
          <div className="absolute inset-0 bg-ink/60" />
        </div>
        <LeafArch className="h-20 w-40 text-mauve sm:h-24 sm:w-48" />
        <h1 className="mt-6 font-serif text-4xl font-normal leading-[0.95] text-paper min-[360px]:text-5xl sm:text-7xl lg:text-8xl">
          <span className="block whitespace-nowrap">
            {COUPLE.first} {COUPLE.firstSurname}
          </span>
          <span className="my-3 block text-3xl italic text-mauve sm:text-4xl">&amp;</span>
          <span className="block whitespace-nowrap">
            {COUPLE.second} {COUPLE.secondSurname}
          </span>
        </h1>
        <p className="mt-8 max-w-md font-serif text-xl italic leading-relaxed text-paper/90 sm:text-2xl">
          Invite you to share in the joy of their wedding day celebration as they begin this beautiful
          chapter together.
        </p>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-paper/85 sm:text-sm">
          {WEDDING_DATE_LABEL} · {CITY}
        </p>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper/80">
          This special occasion is reserved for adults only, and the couple kindly request your understanding.
        </p>
        <a
          href="#rsvp"
          className="mt-10 inline-block rounded-full bg-paper px-9 py-3 text-sm uppercase tracking-[0.25em] text-plum transition hover:-translate-y-0.5 hover:bg-mauve-light"
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
          <ol className="divide-y divide-mauve-light border-y border-mauve-light">
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
      </section>

      {/* RSVP */}
      <section id="rsvp" className="scroll-mt-8 px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-xl">
          <SectionTitle>Kindly Reply</SectionTitle>
          <RSVPForm />
        </div>
      </section>

      <footer className="px-4 pb-12 text-center font-serif text-lg italic text-plum">
        {COUPLE_FULL} · {WEDDING_DATE_NUMERIC}
      </footer>
    </main>
  );
}
