import RSVPForm from "./components/RSVPForm";
import Countdown from "./components/Countdown";
import { LeafArch, Sprig } from "./components/Leaves";
import { COUPLE, DRESS_CODE, EVENTS, WEDDING_DATE_LABEL, CITY, WEDDING_DATE_NUMERIC } from "@/lib/event";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <Sprig className="mx-auto mb-4 h-4 w-20 text-sage" />
      <h2 className="font-serif text-4xl text-ink sm:text-5xl">{children}</h2>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-20 text-center">
        <LeafArch className="h-20 w-40 text-sage sm:h-24 sm:w-48" />
        <h1 className="mt-6 font-serif text-6xl font-normal leading-[0.95] text-ink sm:text-8xl">
          {COUPLE.first}
          <span className="my-2 block text-3xl italic text-sage sm:text-4xl">and</span>
          {COUPLE.second}
        </h1>
        <p className="mt-8 max-w-md font-serif text-xl italic leading-relaxed text-ink/80 sm:text-2xl">
          Invite you to share in the joy of their wedding day celebration as they begin this beautiful
          chapter together.
        </p>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-ink/70 sm:text-sm">
          {WEDDING_DATE_LABEL} · {CITY}
        </p>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink/60">
          This special occasion is reserved for adults only, and the couple kindly request your understanding.
        </p>
        <a
          href="#rsvp"
          className="mt-10 inline-block rounded-full bg-sage px-9 py-3 text-sm uppercase tracking-[0.25em] text-white transition hover:-translate-y-0.5 hover:bg-sage-dark"
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
          <ol className="divide-y divide-sage-light border-y border-sage-light">
            {EVENTS.map((ev) => (
              <li key={ev.key} className="flex items-baseline gap-5 px-2 py-5">
                <span className="w-20 shrink-0 text-sm font-semibold tracking-wide text-sage">{ev.time}</span>
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
      <section className="px-4 pb-20 text-center">
        <SectionTitle>Dress Code</SectionTitle>
        <p className="font-serif text-2xl italic text-ink/80">{DRESS_CODE}</p>
      </section>

      {/* RSVP */}
      <section id="rsvp" className="scroll-mt-8 px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-xl">
          <SectionTitle>Kindly Reply</SectionTitle>
          <RSVPForm />
        </div>
      </section>

      <footer className="pb-12 text-center font-serif text-lg italic text-sage">
        {COUPLE.initials} · {WEDDING_DATE_NUMERIC}
      </footer>
    </main>
  );
}
