import { useEffect, useRef, useState, type ReactNode } from "react";

export type SP = { go: (id: number) => void };

/* ------------------------------------------------------------------ */
/* Skala: menampilkan layar logis 480×320 pada lebar kontainer apa pun */
/* ------------------------------------------------------------------ */
export function Scaled({
  w = 480,
  h = 320,
  children,
}: {
  w?: number;
  h?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0.5);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setS(el.clientWidth / w);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: w, height: h, transform: `scale(${s})` }}
      >
        {children}
      </div>
    </div>
  );
}

export function Frame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`game-frame relative h-[320px] w-[480px] bg-[#bfe9ff] ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tombol 3D                                                           */
/* ------------------------------------------------------------------ */
const TONES: Record<string, string> = {
  green: "bg-[#37c871] text-white",
  yellow: "bg-[#ffd54f] text-[#2b1b0e]",
  blue: "bg-[#2fa7e8] text-white",
  purple: "bg-[#7c3aed] text-white",
  pink: "bg-[#ff4f91] text-white",
  red: "bg-[#e53935] text-white",
  orange: "bg-[#ff8a3d] text-white",
  white: "bg-white text-[#2b1b0e]",
  wood: "bg-[#a9673a] text-[#fff3c4]",
};

export function Btn({
  tone = "green",
  className = "",
  children,
  onClick,
  ariaLabel,
}: {
  tone?: keyof typeof TONES | string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`btn3d font-extrabold ${TONES[tone] ?? TONES.green} ${className}`}
    >
      {children}
    </button>
  );
}

export function BackBtn({ onClick }: { onClick?: () => void }) {
  return (
    <Btn tone="yellow" onClick={onClick} ariaLabel="Kembali" className="grid h-7 w-7 place-items-center text-[15px] leading-none">
      <Ic n="left" className="h-4 w-4" />
    </Btn>
  );
}

export function Plaque({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`w-fit rounded-[10px] border-[3px] border-[#7a4a1e] bg-gradient-to-b from-[#ffeab4] to-[#f5c152] px-4 py-[2px] shadow-[0_3px_0_rgba(43,27,14,0.45)] ${className}`}
    >
      <span className="font-display text-[15px] leading-tight tracking-wide text-[#5b3212]">
        {children}
      </span>
    </div>
  );
}

export function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div
      className="absolute top-0 z-30 flex items-start gap-2 px-2 pt-2"
      style={{
        left: "calc(-1 * var(--bleed-x, 0px))",
        right: "calc(-1 * var(--bleed-x, 0px))",
      }}
    >
      <div className="pt-[2px]">{onBack ? <BackBtn onClick={onBack} /> : <span className="block h-7 w-7" />}</div>
      <div className="flex-1 pt-[2px]">
        <div className="mx-auto w-fit max-w-[300px] text-center">
          <Plaque>{title}</Plaque>
        </div>
      </div>
      <div className="min-w-7 pt-[2px] text-right">{right}</div>
    </div>
  );
}

export function Chip({
  icon,
  value,
  label,
  className = "",
  iconClass = "",
}: {
  icon?: ReactNode;
  value: ReactNode;
  label?: ReactNode;
  className?: string;
  iconClass?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border-[3px] border-[#2b1b0e] bg-white px-2 py-[3px] shadow-[0_3px_0_rgba(43,27,14,0.4)] ${className}`}
    >
      {icon ? <span className={`grid place-items-center ${iconClass}`}>{icon}</span> : null}
      <span className="flex flex-col leading-none">
        <span className="font-display text-[13px] tabular-nums text-[#2b1b0e]">{value}</span>
        {label ? <span className="text-[8px] font-bold uppercase tracking-wider text-[#8a6a4a]">{label}</span> : null}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ikon                                                                 */
/* ------------------------------------------------------------------ */
const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PATHS: Record<string, ReactNode> = {
  star: <path d="M12 2.4l2.95 6.1 6.55.92-4.75 4.6 1.13 6.6L12 17.5l-5.88 3.12 1.13-6.6L2.5 9.42l6.55-.92z" />,
  crystal: <path d="M8.1 3.4h7.8L20.6 10 12 21.4 3.4 10z" />,
  heart: <path d="M12 21.2S3.2 15.1 3.2 9.2A5 5 0 0 1 12 6.1a5 5 0 0 1 8.8 3.1c0 5.9-8.8 12-8.8 12z" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 6.4l1.7 3.5 3.8.5-2.8 2.7.7 3.8L12 15.2l-3.4 1.7.7-3.8-2.8-2.7 3.8-.5z" fill="#fff3c4" />
    </>
  ),
  gear: (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect key={a} x="10.2" y="1.2" width="3.6" height="5" rx="1.1" transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="3.6" />
    </>
  ),
  pillar: <path d="M5 3h14v3.4H5zM7.6 6.4h8.8v11.2H7.6zM4 17.6h16V21H4z" />,
  play: <path d="M7.5 4.6L19.5 12 7.5 19.4z" />,
  left: <path d="M14.5 4.8L7.3 12l7.2 7.2" {...S} />,
  right: <path d="M9.5 4.8L16.7 12l-7.2 7.2" {...S} />,
  up: <path d="M4.8 14.5L12 7.3l7.2 7.2" {...S} />,
  down: <path d="M4.8 9.5L12 16.7l7.2-7.2" {...S} />,
  check: <path d="M4.5 12.6l5 5 10-11.2" {...S} />,
  x: <path d="M6.2 6.2l11.6 11.6M17.8 6.2L6.2 17.8" {...S} />,
  plus: <path d="M12 4.6v14.8M4.6 12h14.8" {...S} />,
  minus: <path d="M4.6 12h14.8" {...S} />,
  camera: (
    <>
      <path d="M3 8.6A2.6 2.6 0 0 1 5.6 6h1.6l1.3-2.2h6.9L16.7 6h1.7A2.6 2.6 0 0 1 21 8.6v8.8A2.6 2.6 0 0 1 18.4 20H5.6A2.6 2.6 0 0 1 3 17.4z" />
      <circle cx="12" cy="13" r="3.7" fill="#ffffff" />
    </>
  ),
  lock: (
    <>
      <path d="M7.2 10.4V8.2a4.8 4.8 0 0 1 9.6 0v2.2h1.5A1.6 1.6 0 0 1 20 12v6.6a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 18.6V12a1.6 1.6 0 0 1 1.6-1.6z" />
      <rect x="10.4" y="13.4" width="3.2" height="4.6" rx="1.3" fill="#ffffff" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="9.6" width="18" height="4.2" rx="1.4" />
      <rect x="4.6" y="13.8" width="14.8" height="6.8" rx="1.4" />
      <rect x="10.4" y="9.6" width="3.2" height="11" fill="#fff3c4" />
      <path d="M12 9.6c-3.6 0-5.6-1-5.6-2.9S8.7 3.8 12 9.6zm0 0c3.6 0 5.6-1 5.6-2.9S15.3 3.8 12 9.6z" />
    </>
  ),
  fast: <path d="M3.2 5.2l7.6 6.8-7.6 6.8zM12.6 5.2l7.6 6.8-7.6 6.8z" />,
  shuffle: (
    <>
      <path d="M3 6.4h3.6l3.4 5.2M3 17.6h3.6l3.4-5.2M14 6.4h3.4L21 9.6M14 17.6h3.4L21 14.4" {...S} strokeWidth={2.6} />
      <path d="M18.2 3.6l3 2.8-3 2.8zM18.2 14.8l3 2.8-3 2.8z" />
    </>
  ),
  trash: (
    <>
      <path d="M5.4 7.2h13.2l-1.2 12.1A2 2 0 0 1 15.4 21H8.6a2 2 0 0 1-2-1.7z" />
      <path d="M9 7.2V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6v1.6" {...S} strokeWidth={2.4} />
      <rect x="3.4" y="4.4" width="17.2" height="3.4" rx="1.6" />
    </>
  ),
  chart: (
    <>
      <rect x="4" y="12.4" width="4" height="7.6" rx="1.2" />
      <rect x="10" y="7.4" width="4" height="12.6" rx="1.2" />
      <rect x="16" y="3.4" width="4" height="16.6" rx="1.2" />
    </>
  ),
  users: (
    <>
      <circle cx="8.6" cy="8" r="3.7" />
      <circle cx="16.8" cy="9.2" r="3" />
      <path d="M2.4 20.4c0-3.4 2.8-5.7 6.2-5.7s6.2 2.3 6.2 5.7z" />
      <path d="M15.4 14.9c3.1.2 5.6 2.4 6.2 5.5h-4.6z" />
    </>
  ),
  doc: (
    <>
      <path d="M6 3h7.6L19 8.6V21H6z" />
      <path d="M13.4 3.2v5.6h5.4z" fill="#ffffff" opacity="0.75" />
      <path d="M8.6 13h7M8.6 16.4h7" {...S} strokeWidth={2} />
    </>
  ),
  download: (
    <>
      <path d="M11 3.2h2v9.2l3.4-3.4 1.6 1.6L12 16.8 6 10.6l1.6-1.6L11 12.4z" />
      <path d="M4 17.6h16v3.4H4z" />
    </>
  ),
  printer: (
    <>
      <path d="M7 3.2h10v5.2H7z" />
      <path d="M4 8.4h16a2 2 0 0 1 2 2v5.8h-4.2V21H6.2v-4.8H2v-5.8a2 2 0 0 1 2-2z" />
      <rect x="7" y="14.2" width="10" height="6.4" fill="#ffffff" />
    </>
  ),
  qr: (
    <>
      <path d="M3 3h7.2v7.2H3zM13.8 3H21v7.2h-7.2zM3 13.8h7.2V21H3z" />
      <path d="M14 14.2h3.2v3.2H14zM18.4 18.4H21V21h-2.6zM14.4 19.2h2.4M19.2 14.2h2" {...S} strokeWidth={2} />
    </>
  ),
  pencil: <path d="M4 16.6L15.6 5l3.6 3.6L7.6 20.2l-4.5.9z" />,
  book: (
    <>
      <path d="M4 4.6h6.4A2.6 2.6 0 0 1 13 7.2V20a2.6 2.6 0 0 0-2.6-2.6H4z" />
      <path d="M20 4.6h-6.4A2.6 2.6 0 0 0 11 7.2V20a2.6 2.6 0 0 1 2.6-2.6H20z" />
    </>
  ),
  home: <path d="M12 3.2l9.2 8.2h-2.6v9.4H5.4v-9.4H2.8z" />,
  volume: (
    <>
      <path d="M4 9.4h3.6L12 5v14L7.6 14.6H4z" />
      <path d="M15 9.2a4.6 4.6 0 0 1 0 5.6" {...S} strokeWidth={2.4} />
      <path d="M17.8 6.6a8.2 8.2 0 0 1 0 10.8" {...S} strokeWidth={2.4} />
    </>
  ),
  sparkle: <path d="M12 2.4l2.1 6.6 6.6 2.1-6.6 2.1L12 20l-2.1-6.8L3.3 11.1l6.6-2.1z" />,
  palm: (
    <>
      <path d="M11.4 21.4c0-5.4 1-8.8 3.2-12" {...S} strokeWidth={2.4} />
      <path d="M14.6 9.4c-3.2-2.6-7-2.2-8.8.6 2.9-.7 5.6-.3 7.4 1.2zM14.6 9.4c1.5-3.6 5-4.9 8-3.8-2.5 1-4.3 2.6-5.2 4.8zM14.6 9.4c-1.7-3.2-1.1-6.9 1.5-9-.6 2.9-.4 5.6.8 7.6z" />
    </>
  ),
  tree: (
    <>
      <path d="M12 2.6l4.8 6.8h-2.8l3.8 5.4h-4.2l3.4 4.8H7l3.4-4.8H6.2l3.8-5.4H7.2z" />
      <rect x="10.7" y="18.6" width="2.6" height="3.4" rx="1" />
    </>
  ),
  drop: <path d="M12 2.4S5.4 10 5.4 14.6a6.6 6.6 0 0 0 13.2 0C18.6 10 12 2.4 12 2.4z" />,
  chest: (
    <>
      <path d="M3.4 11a8.6 5.6 0 0 1 17.2 0v8.4a1.8 1.8 0 0 1-1.8 1.8H5.2a1.8 1.8 0 0 1-1.8-1.8z" />
      <rect x="3.4" y="12.6" width="17.2" height="3" fill="#fff3c4" />
      <rect x="10.1" y="12" width="3.8" height="5.6" rx="1.3" fill="#2b1b0e" />
    </>
  ),
  medal: (
    <>
      <path d="M8.4 3l3 6.6M15.6 3l-3 6.6" {...S} strokeWidth={2.6} />
      <circle cx="12" cy="15.4" r="6" />
      <path d="M12 12.4l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z" fill="#fff3c4" />
    </>
  ),
  key: (
    <>
      <circle cx="7.6" cy="12" r="5.4" />
      <circle cx="7.6" cy="12" r="1.9" fill="#ffffff" />
      <rect x="12" y="10.4" width="10.4" height="3.2" rx="1.2" />
      <rect x="16.4" y="12.6" width="2.6" height="4.6" rx="0.8" />
      <rect x="20" y="12.6" width="2.4" height="3.4" rx="0.8" />
    </>
  ),
  screen: (
    <>
      <path d="M3.4 9V4.4H8M16 4.4h4.6V9M20.6 15v4.6H16M8 19.6H3.4V15" {...S} strokeWidth={2.8} />
    </>
  ),
  refresh: (
    <>
      <path d="M19.4 12a7.4 7.4 0 1 1-2.4-5.5" {...S} strokeWidth={2.8} />
      <path d="M19.8 3.6v5.2h-5.2z" />
    </>
  ),
  map: (
    <>
      <path d="M2.8 6.4l6-2.6 6.4 2.6 6-2.6v13.4l-6 2.6-6.4-2.6-6 2.6z" />
      <path d="M8.8 3.8v15.6M15.2 6.4v15.6" {...S} strokeWidth={2} />
    </>
  ),
  bolt: <path d="M13.5 2.2L5.2 13.4h5.6l-1.3 8.4 9.3-11.4h-5.8z" />,
  kick: <path d="M4 3h5l1 7 3 2 5 1 3 4v3H7l-3-3z" />,
  fist: (
    <>
      <rect x="5" y="7" width="14" height="9" rx="3" />
      <rect x="7" y="15" width="10" height="5" rx="2" />
      <path d="M8 7v4M12 7v4M16 7v4" {...S} strokeWidth={2} />
    </>
  ),
};

export function Ic({ n, className = "h-5 w-5" }: { n: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      {PATHS[n] ?? PATHS.star}
    </svg>
  );
}

export { Robot, type Mood, type RobotAction, type RobotProps } from "./game/robot";

/* ------------------------------------------------------------------ */
/* Avatar pemain                                                       */
/* ------------------------------------------------------------------ */
export const SHIRTS = ["#2fa7e8", "#ff4f91", "#37c871", "#ff8a3d", "#7c3aed"];

export function Pearl({ size = 14 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full border-2 border-[#2b1b0e]"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 34% 30%, #ffffff 0 18%, #ffe3f4 45%, #e9a3d3 100%)",
      }}
    />
  );
}

export function Avatar({ className = "", shirt = "#2fa7e8" }: { className?: string; shirt?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="#8ed8ff" stroke="#2b1b0e" strokeWidth="5" />
      <path d="M18 96c4-16 16-24 32-24s28 8 32 24z" fill={shirt} stroke="#2b1b0e" strokeWidth="5" />
      <circle cx="50" cy="46" r="26" fill="#f6c9a0" stroke="#2b1b0e" strokeWidth="5" />
      <path d="M24 44c0-16 11-27 26-27s26 11 26 27c0-8-6-13-14-14-7-1-9 3-16 3s-11-3-16 1c-4 3-6 7-6 10z" fill="#6b4226" stroke="#2b1b0e" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="41" cy="47" r="4" fill="#2b1b0e" />
      <circle cx="59" cy="47" r="4" fill="#2b1b0e" />
      <path d="M43 57c4 4 10 4 14 0" fill="none" stroke="#2b1b0e" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Logo tipografi                                                      */
/* ------------------------------------------------------------------ */
export function Logo({ size = 54, className = "" }: { size?: number; className?: string }) {
  const line = (t: string) => (
    <span className="logo-line" style={{ fontSize: size, lineHeight: 1.02 }}>
      <span aria-hidden="true" className="logo-stroke" style={{ WebkitTextStrokeWidth: Math.max(8, size * 0.2) }}>
        {t}
      </span>
      <span className="logo-fill">{t}</span>
    </span>
  );
  return (
    <div className={`font-display tracking-[0.01em] ${className}`}>
      {line("ISLAND")}
      {line("EXPLORER")}
    </div>
  );
}
