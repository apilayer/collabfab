"use client";

import { useMemo } from "react";
import { accentFor, avatarSvg } from "@/app/lib/avatar";

export function Avatar({
  seed,
  size = 40,
  ring,
  className = "",
}: {
  seed: string;
  size?: number;
  ring?: string;
  className?: string;
}) {
  const svg = useMemo(() => avatarSvg(seed, size), [seed, size]);
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: ring ? `0 0 0 2px ${ring}` : undefined,
        background: "#1a1c2b",
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export { accentFor };
