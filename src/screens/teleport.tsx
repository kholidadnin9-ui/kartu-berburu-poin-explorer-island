import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Frame, Ic, Robot } from "../ui";
import { audio } from "../game/audio";
import { GH, ISLANDS } from "../game/data";
import { START_X, playMem, useGame } from "../game/store";
import { downloadCertificate } from "../game/certificate";
import mapImg from "../assets/island-map.jpg";

type Phase = "charge" | "depart" | "transit" | "arrive" | "settle";

export function waDigits(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^0/, "62").slice(0, 15);
}

export function scoreMessage(playerName: string, className: string, islandName: string, level: number, score: number, accuracy: number, dogs: number) {
  return (
    `*ISLAND EXPLORER - KARTU BERBURU POIN*\n` +
    `Halo Guru, hasil akhir pemain:\n` +
    `Nama: ${playerName}\n` +
    `Kelas: ${className}\n` +
    `Level ${level} selesai: ${islandName}\n` +
    `Skor akhir: ${score} poin\n` +
    `Ketepatan: ${accuracy}%\n` +
    `Robot anjing dikalahkan: ${dogs}/5\n` +
    `Sertifikat level dapat dicetak dari layar hasil.`
  );
}

const MOTES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  const radius = 72 + (i % 4) * 17;
  return {
    "--mote-x": `${Math.cos(angle) * radius}px`,
    "--mote-y": `${Math.sin(angle) * radius * 0.8}px`,
    "--mote-delay": `${(i % 8) * 55}ms`,
    background: ["#a5f9ff", "#f4dcff", "#ffe28b"][i % 3],
  } as CSSProperties;
});

export function Teleport() {
  const { session, player, settings, guru, notify, setSession, reset } = useGame();
  const [fromId] = useState(session.island);
  const [calm] = useState(
    () => !settings.efek || window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [phase, setPhase] = useState<Phase>(calm ? "arrive" : "charge");
  const [reportOpen, setReportOpen] = useState(true);
  const [sent, setSent] = useState(false);
  const finished = useRef(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const gradientId = useId();
  const source = ISLANDS[fromId];
  const destination = ISLANDS[fromId + 1];
  const prog = player.islands[fromId];
  const completed = prog?.chest;
  const arrived = phase === "transit" || phase === "arrive" || phase === "settle";
  const destinationName = destination?.name ?? "Peta Petualangan";
  const islandLogs = player.logs.filter((l) => l.pulau === fromId);
  const accuracy = islandLogs.length ? Math.round((islandLogs.filter((l) => l.benar).length / islandLogs.length) * 100) : 100;
  const dogsDefeated = prog?.dogs.length ?? 0;
  const message = scoreMessage(player.nama, player.kelas, source.name, fromId + 1, player.poin, accuracy, dogsDefeated);
  const waNumber = waDigits(guru.wa);

  const kirimWa = () => {
    if (!waNumber) {
      notify("Nomor WhatsApp guru belum diatur di Menu Guru");
      return;
    }
    try {
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      setSent(true);
      notify("Hasil skor dibuka di WhatsApp guru");
    } catch {
      notify("Gagal membuka WhatsApp");
    }
  };

  const cetakSertifikat = () => {
    try {
      downloadCertificate({
        player,
        islandIndex: fromId,
        score: player.poin,
        accuracy,
        dogsDefeated,
        teacherPhone: waNumber,
      });
      notify("Sertifikat PDF A4 portrait diunduh");
    } catch {
      notify("Gagal membuat sertifikat PDF");
    }
  };

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    playMem.x = START_X;

    if (destination) {
      playMem.island = destination.id;
      setSession({
        island: destination.id,
        station: 0,
        hearts: 3,
        cards: null,
        q: null,
        result: null,
        lastSpecial: false,
      });
      reset("menu", "peta", "level", "main");
    } else {
      playMem.island = -1;
      reset("menu", "peta");
    }
  }, [destination, reset, setSession]);

  useEffect(() => {
    if (!completed) {
      reset("menu", "peta");
      return;
    }

    skipRef.current?.focus({ preventScroll: true });
    audio.sfx(calm ? "arrive" : "teleport");

    // Navigation uses timers, not animationend, so disabled effects cannot trap the player.
    const timers = calm
      ? [window.setTimeout(finish, 800)]
      : [
          window.setTimeout(() => setPhase("depart"), 850),
          window.setTimeout(() => setPhase("transit"), 1500),
          window.setTimeout(() => {
            setPhase("arrive");
            audio.sfx("arrive");
          }, 1900),
          window.setTimeout(() => setPhase("settle"), 2900),
          window.setTimeout(finish, 3600),
        ];

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
  }, [calm, completed, finish, reset]);

  const headline =
    phase === "charge"
      ? "Portal terbuka!"
      : phase === "depart" || phase === "transit"
        ? "Teleportasi!"
        : destination
          ? `Halo, ${destination.name}!`
          : "Ekspedisi selesai!";

  return (
    <Frame className={`teleport-screen teleport--${phase}${calm ? " teleport--calm" : ""}`}>
      <img src={source.img} alt="" className="teleport-scenery teleport-source" />
      <img src={destination?.img ?? mapImg} alt="" className="teleport-scenery teleport-destination" />
      <div className="teleport-shade" />
      <div
        className="teleport-ground"
        style={{
          height: GH,
          background: `linear-gradient(${(arrived && destination ? destination : source).top} 0 9px,
            ${(arrived && destination ? destination : source).ground[0]} 9px,
            ${(arrived && destination ? destination : source).ground[1]})`,
        }}
      />

      <div className="teleport-heading" role="status" aria-live="polite" aria-atomic="true">
        <div className="teleport-kicker">
          <Ic n="star" className="h-3 w-3" />
          Level {fromId + 1} selesai
          <Ic n="star" className="h-3 w-3" />
        </div>
        <h1 className="font-display ol-sm">{headline}</h1>
        <p>
          {arrived
            ? destination
              ? `Level ${destination.id + 1} - ${destination.topicLabel}. Petualangan baru menantimu!`
              : "Semua pulau telah dijelajahi. Hebat, Petualang!"
            : `Bersiap menuju ${destinationName}`}
        </p>
      </div>

      <div className="teleport-effects" aria-hidden="true">
        <div className="teleport-floor-ring" />
        <div className="teleport-beam" />
        <div className="teleport-portal">
          <svg viewBox="0 0 176 204" className="h-full w-full">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d9fdff" />
                <stop offset="0.38" stopColor="#54eaff" />
                <stop offset="0.7" stopColor="#bd8fff" />
                <stop offset="1" stopColor="#fff0b0" />
              </linearGradient>
            </defs>
            <ellipse cx="88" cy="102" rx="66" ry="85" fill="#0d254a" fillOpacity="0.68" />
            <ellipse cx="88" cy="102" rx="65" ry="85" fill="none" stroke="#103752" strokeWidth="15" />
            <ellipse cx="88" cy="102" rx="65" ry="85" fill="none" stroke={`url(#${gradientId})`} strokeWidth="8" />
            <ellipse cx="88" cy="102" rx="56" ry="75" fill="none" stroke="#c5faff" strokeOpacity="0.55" strokeWidth="2" />
            <ellipse
              className="teleport-portal-dashes"
              cx="88"
              cy="102"
              rx="74"
              ry="94"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeDasharray="15 18 4 18"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="teleport-motes">
          {MOTES.map((style, i) => <i key={i} className="teleport-mote" style={style} />)}
        </div>
      </div>

      <div className="teleport-dock" aria-hidden="true">
        <div className="teleport-robot">
          <Robot
            className="w-full"
            mood={phase === "settle" ? "happy" : arrived ? "cheer" : "wow"}
            action={phase === "settle" ? "idle" : arrived ? "victory" : "jump"}
          />
        </div>
      </div>

      <div className="teleport-route" aria-hidden="true">
        <span>{source.name}</span>
        <span className="teleport-route-line"><i /></span>
        <span>{destinationName}</span>
      </div>
      <div className="teleport-flash" aria-hidden="true" />

      {/* Laporan hasil level sebelum teleportasi */}
      {reportOpen && completed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hasil akhir level"
          className="absolute inset-x-3 bottom-8 z-20 rounded-2xl border-[4px] border-[#2b1b0e] bg-[#fff8e6] p-2.5 text-[#2b1b0e] shadow-[0_6px_0_rgba(43,27,14,0.5)]"
        >
          <div className="flex items-center gap-1.5">
            <Ic n="medal" className="h-4 w-4 shrink-0 text-[#ff8a3d]" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[14px] leading-none">Hasil Akhir Level {fromId + 1}</div>
              <div className="truncate text-[9px] font-bold text-[#8a6a4a]">{player.nama} · Kelas {player.kelas} · {source.name}</div>
            </div>
            <button type="button" data-quiet="" aria-label="Tutup laporan hasil" onClick={() => setReportOpen(false)} className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-[#2b1b0e] bg-white text-[#2b1b0e]">
              <Ic n="x" className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-lg border-[3px] border-[#c9a24b] bg-white py-[2px]">
              <div className="font-display text-[15px] leading-none text-[#1173b8]">{player.poin}</div>
              <div className="text-[7px] font-extrabold uppercase text-[#8a6a4a]">Skor akhir</div>
            </div>
            <div className="rounded-lg border-[3px] border-[#c9a24b] bg-white py-[2px]">
              <div className="font-display text-[15px] leading-none text-[#22a75b]">{accuracy}%</div>
              <div className="text-[7px] font-extrabold uppercase text-[#8a6a4a]">Ketepatan</div>
            </div>
            <div className="rounded-lg border-[3px] border-[#c9a24b] bg-white py-[2px]">
              <div className="font-display text-[15px] leading-none text-[#7c3aed]">{dogsDefeated}/5</div>
              <div className="text-[7px] font-extrabold uppercase text-[#8a6a4a]">Anjing kalah</div>
            </div>
          </div>
          <div className="mt-1.5 flex gap-1.5">
            <button
              type="button"
              data-quiet=""
              onClick={kirimWa}
              className={`btn3d flex flex-1 items-center justify-center gap-1 bg-[#25d366] px-1.5 py-[5px] text-[10px] font-extrabold text-white ${!waNumber ? "opacity-70" : ""}`}
            >
              <Ic n="volume" className="h-3 w-3 shrink-0" /> {sent ? "Terkirim ✓" : "Kirim ke WA Guru"}
            </button>
            <button
              type="button"
              data-quiet=""
              onClick={cetakSertifikat}
              className="btn3d flex flex-1 items-center justify-center gap-1 bg-[#7c3aed] px-1.5 py-[5px] text-[10px] font-extrabold text-white"
            >
              <Ic n="printer" className="h-3 w-3 shrink-0" /> Sertifikat PDF
            </button>
            <button
              type="button"
              data-quiet=""
              onClick={finish}
              className="btn3d flex flex-1 items-center justify-center gap-1 bg-[#37c871] px-1.5 py-[5px] text-[10px] font-extrabold text-white"
            >
              Teleport <Ic n="right" className="h-3 w-3 shrink-0" />
            </button>
          </div>
          {!waNumber && (
            <p className="mt-1 text-center text-[8px] font-bold text-[#a34236]">Nomor WhatsApp guru belum diatur — hasil tidak bisa dikirim otomatis.</p>
          )}
        </div>
      )}
      {!reportOpen && completed && (
        <button
          type="button"
          data-quiet=""
          onClick={() => setReportOpen(true)}
          className="btn3d absolute bottom-8 left-3 z-20 flex items-center gap-1 bg-[#ffd54f] px-2.5 py-[5px] text-[10px] font-extrabold text-[#2b1b0e]"
        >
          <Ic n="chart" className="h-3 w-3" /> Hasil &amp; Sertifikat
        </button>
      )}
      <button ref={skipRef} type="button" data-quiet="" className="teleport-skip" onClick={finish}>
        Lewati animasi <Ic n="right" className="h-3 w-3" />
      </button>
    </Frame>
  );
}