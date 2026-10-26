import { FAQ_DATA } from "@/app/lib/faq";

/**
 * Server-rendered page content, below the globe.
 *
 * This exists because the globe is a canvas: without it the page shipped 580
 * characters of indexable text, no h1, and FAQPage structured data describing
 * questions that were never in the DOM. Google requires marked-up FAQ content
 * to be present on the page, so the schema was claiming something the HTML did
 * not back up. These are the same questions the modal shows, rendered once,
 * server-side, visible to anyone who scrolls.
 */
export function SeoContent() {
  return (
    <div className="relative z-10 border-t border-white/10 bg-[var(--bg-deep)]">
      <div className="mx-auto w-full max-w-4xl px-6 py-14">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg)] md:text-3xl">
          Find people to build with, on a live 3D globe
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--fg-muted,#a9b0c7)]">
          Every dot on the globe above is someone who has this page open right
          now. Each one is placed by real-time IP geolocation, so the map is a
          picture of who is actually around rather than a list of accounts.
          Add a line about what you are building and the Handshake Score ranks
          everyone else by how workable a collaboration would be: overlapping
          working hours, a shared language, matching interests, and how far
          apart you are. The score shows its reasoning, so you can see why
          someone was suggested instead of trusting a number.
        </p>

        <h2 className="mt-12 text-xl font-semibold tracking-tight text-[var(--fg)]">
          Questions about CollabFab
        </h2>
        <dl className="mt-6 divide-y divide-white/10 border-t border-white/10">
          {FAQ_DATA.map((item) => (
            <div key={item.id} className="py-5">
              <dt className="text-sm font-semibold text-[var(--fg)]">
                {item.question}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--fg-muted,#a9b0c7)]">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 text-xs text-[var(--fg-muted,#a9b0c7)]">
          Geolocation by{" "}
          <a
            href="https://ipstack.com"
            target="_blank"
            rel="noreferrer noopener"
            className="underline underline-offset-2"
          >
            ipstack
          </a>
          , an APILayer product.
        </p>
      </div>
    </div>
  );
}
