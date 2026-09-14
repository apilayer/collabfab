type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const GlobeIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </svg>
);

export const UserIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const SunIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const MoonIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
  </svg>
);

export const RefreshIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M20 11a8 8 0 1 0-.6 4" />
    <path d="M20 4v7h-7" />
  </svg>
);

export const ShareIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="18" cy="5" r="2.6" />
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="18" cy="19" r="2.6" />
    <path d="M8.4 10.8 15.6 6.4M8.4 13.2l7.2 4.4" />
  </svg>
);

export const SparkIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);

export const UsersIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19a6 6 0 0 1 12 0" />
    <path d="M16 5.6a3.2 3.2 0 0 1 0 6M17.5 13.6A6 6 0 0 1 21 19" />
  </svg>
);

export const HelpIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.8c0 1.7-2.4 2.2-2.4 3.6" />
    <path d="M12 17.2h.01" />
  </svg>
);

export const CloseIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ExpandIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

export const WaveIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M11 20a6 6 0 0 0 6-6V8.5a1.3 1.3 0 0 0-2.6 0V13" />
    <path d="M14.4 12.5V6a1.3 1.3 0 0 0-2.6 0v6.5" />
    <path d="M11.8 12.5V6.8a1.3 1.3 0 0 0-2.6 0v6.4" />
    <path d="M9.2 13.2V9.4a1.3 1.3 0 0 0-2.6 0V15a6 6 0 0 0 1.8 4.3" />
  </svg>
);

export const ClockIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </svg>
);

export const ShieldIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.4-7.5 9.5-4.4-1.1-7.5-4.9-7.5-9.5V6L12 3z" />
  </svg>
);

export const EyeIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const LinkIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.5-2.5a4 4 0 1 0-5.7-5.7l-1.4 1.4" />
    <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.5 2.5a4 4 0 1 0 5.7 5.7l1.4-1.4" />
  </svg>
);

export const MailIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2.4" />
    <path d="m3.6 6.5 8.4 6 8.4-6" />
  </svg>
);
