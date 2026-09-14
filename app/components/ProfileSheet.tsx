"use client";

import { useState } from "react";
import type { ProfileInput, PublicVisitor } from "@/interfaces/visitor.interface";
import { Avatar } from "./Avatar";
import { CloseIcon } from "./Icons";

type Field = {
  key: keyof ProfileInput;
  label: string;
  hint: string;
  max: number;
  area?: boolean;
  type?: string;
};

const FIELDS: Field[] = [
  { key: "displayName", label: "Name", hint: "Shown instead of your animal alias.", max: 40 },
  { key: "headline", label: "Headline", hint: "One line — what you do, or what you are building.", max: 80 },
  { key: "bio", label: "Bio", hint: "A short paragraph about you.", max: 600, area: true },
  {
    key: "lookingFor",
    label: "What are you looking to build or collaborate on?",
    hint: "The reason a stranger on this globe should message you.",
    max: 300,
    area: true,
  },
  { key: "tags", label: "Tags", hint: "Comma separated — skills or interests. These drive your Handshake score.", max: 160 },
  { key: "email", label: "Email", hint: "Optional. Public to everyone on the globe.", max: 120, type: "email" },
  { key: "website", label: "Website", hint: "Optional.", max: 160 },
  { key: "social", label: "Social handle", hint: "Optional, e.g. @you.", max: 120 },
];

const toForm = (you: PublicVisitor | null): ProfileInput => ({
  displayName: you?.displayName ?? "",
  headline: you?.headline ?? "",
  bio: you?.bio ?? "",
  lookingFor: you?.lookingFor ?? "",
  email: you?.email ?? "",
  website: you?.website ?? "",
  social: you?.social ?? "",
  tags: you?.tags.join(", ") ?? "",
});

export function ProfileSheet({
  you,
  onClose,
  onSaved,
}: {
  you: PublicVisitor | null;
  onClose: () => void;
  onSaved: (v: PublicVisitor) => void;
}) {
  const [form, setForm] = useState<ProfileInput>(() => toForm(you));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Seeded once per identity — Stage keys this component by visitor id, so a
  // background poll can never stomp what someone is halfway through typing.
  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Save failed (${res.status})`);
      onSaved(json.you as PublicVisitor);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel panel-raised pop-in pointer-events-auto flex max-h-[min(82vh,760px)] w-[min(94vw,420px)] flex-col overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-3">
        {you && <Avatar seed={you.id} size={44} ring="var(--live)" />}
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold">Your details</h2>
          <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">
            Stored against a <span className="mono">session</span> cookie — close the browser or
            clear cookies and this is gone for good, along with your place on the globe.
          </p>
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

      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto overscroll-contain border-t border-border p-4">
        {FIELDS.map((f) => {
          const value = (form[f.key] ?? "") as string;
          return (
            <label key={f.key} className="block">
              <span className="mono mb-1 flex items-baseline justify-between text-[10px] tracking-wider text-fg-dim uppercase">
                {f.label}
                <span className={value.length > f.max ? "text-danger" : ""}>
                  {value.length}/{f.max}
                </span>
              </span>
              {f.area ? (
                <textarea
                  rows={f.key === "bio" ? 4 : 3}
                  maxLength={f.max}
                  value={value}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="scroll-thin w-full resize-y rounded-lg border border-border bg-panel-2 px-2.5 py-2 text-[13px] text-fg outline-none transition focus:border-accent"
                />
              ) : (
                <input
                  type={f.type ?? "text"}
                  maxLength={f.max}
                  value={value}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full rounded-lg border border-border bg-panel-2 px-2.5 py-2 text-[13px] text-fg outline-none transition focus:border-accent"
                />
              )}
              <span className="mt-1 block text-[10px] text-fg-dim">{f.hint}</span>
            </label>
          );
        })}

        <p className="rounded-lg border border-warn/40 bg-warn/5 p-2.5 text-[11px] leading-snug text-fg-muted">
          Anything you type here is shown to every other person on the globe, including your
          email if you add one. Share only what you&apos;d put on a public profile.
        </p>
      </div>

      <div className="border-t border-border p-3">
        {error && <p className="mb-2 text-[12px] text-danger">{error}</p>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl py-2.5 text-[13px] font-medium text-white transition disabled:opacity-50"
          style={{ background: saved ? "var(--live)" : "var(--accent)" }}
        >
          {saving ? "Saving…" : saved ? "Saved — you're live" : "Save to my session"}
        </button>
      </div>
    </div>
  );
}
