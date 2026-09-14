"use client";

import { useState } from "react";
import { FAQ_DATA } from "@/app/lib/faq";
import { ApiBanner } from "./ApiBanner";
import { CloseIcon } from "./Icons";

/**
 * The page itself doesn't scroll — the globe owns the viewport — so the FAQ
 * lives in a modal rather than a section. The JSON-LD that search engines read
 * is rendered server-side in page.tsx, independent of whether this is open.
 */
export function FaqModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ "faq-1": true });

  const toggle = (id: string) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="faq-heading"
        className="panel panel-raised pop-in relative flex max-h-[min(86vh,760px)] w-[min(94vw,640px)] flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono text-[10px] font-medium tracking-wider text-accent uppercase">
                FAQ
              </span>
              <span className="text-fg-dim">·</span>
              <span className="mono text-[11px] text-fg-dim">
                Frequently asked questions
              </span>
            </div>
            <h2
              id="faq-heading"
              className="mt-1 text-xl font-bold tracking-tight text-fg"
            >
              CollabFab
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-fg-dim transition hover:bg-panel-2 hover:text-fg"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Accordion */}
        <div className="scroll-thin flex-1 divide-y divide-[var(--border)] overflow-y-auto overscroll-contain px-5">
          {FAQ_DATA.map((item, i) => {
            const isOpen = Boolean(open[item.id]);
            return (
              <div key={item.id} className="py-4">
                <button
                  type="button"
                  id={`faq-btn-${item.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  onClick={() => toggle(item.id)}
                  className="flex w-full items-start justify-between gap-4 rounded-sm text-left transition hover:text-accent"
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="mono mt-0.5 shrink-0 text-[11px] font-semibold text-fg-dim select-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] font-semibold text-fg">
                      {item.question}
                    </span>
                  </span>
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-transform duration-200 ${
                      isOpen
                        ? "rotate-180 border-accent/40 text-accent"
                        : "border-border text-fg-dim"
                    }`}
                    style={{ background: "var(--panel-2)" }}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <p
                    id={`faq-answer-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-btn-${item.id}`}
                    className="mt-3 pr-4 pl-8 text-[13px] leading-relaxed text-fg-muted"
                  >
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-border p-4">
          <ApiBanner />
        </div>
      </div>
    </div>
  );
}
