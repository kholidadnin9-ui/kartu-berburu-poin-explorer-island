import { useEffect, useState, type CSSProperties, type ComponentType, type ReactNode } from "react";
import { GameProvider, badgeCount, playInput, playMem, useGame, type Screen } from "./game/store";
import { audio } from "./game/audio";
import { ISLANDS } from "./game/data";
import { Avatar, Btn, Ic, SHIRTS } from "./ui";
import { Identitas, LevelSelect, Menu, Panduan, Peta, Profil, Splash } from "./screens/menu";
import { Misi, Play } from "./screens/play";
import { Bonus, Hasil, Kartu, Peti, Scan, Soal, Zonk } from "./screens/cards";
import { Teleport } from "./screens/teleport";
import { Badge, Progres, Setelan } from "./screens/meta";
import { Belajar, Cetak, Generator, Guru, Laporan, Pemain } from "./screens/guru";
import { Kalah, Senjata } from "./screens/senjata";

const W = 480;
const H = 320;

const SCREENS: Record<Screen, ComponentType> = {
  splash: Splash,
  identitas: Identitas,
  menu: Menu,
  profil: Profil,
  panduan: Panduan,
  peta: Peta,
  level: LevelSelect,
  main: Play,
  misi: Misi,
  scan: Scan,
  kartu: Kartu,
  soal: Soal,
  hasil: Hasil,
  bonus: Bonus,
  zonk: Zonk,
  peti: Peti,
  teleport: Teleport,
  badge: Badge,
  progres: Progres,
  setelan: Setelan,
  senjata: Senjata,
  kalah: Kalah,
  guru: Guru,
  pemain: Pemain,
  belajar: Belajar,
  laporan: Laporan,
  generator: Generator,
  cetak: Cetak,
};

function PadHold({
  k,
  label,
  className = "",
  children,
}: {
  k: "l" | "r" | "j" | "d";
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const set = (v: boolean) => {
    playInput[k] = v;
  };
  return (
    <button
      type="button"
      data-quiet=""
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerLeave={() => set(false)}
      onPointerCancel={() => set(false)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: "none" }}
      className={`btn3d flex flex-col items-center justify-center gap-0.5 font-extrabold text-white active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

function Stage() {
  const { screen, flash, settings, setSettings, player, session, reset, go, notify } = useGame();
  const [vp, setVp] = useState(() => ({
    vw: typeof window !== "undefined" ? window.innerWidth : 960,
    vh: typeof window !== "undefined" ? window.innerHeight : 640,
  }));

  useEffect(() => {
    const fit = () => setVp({ vw: window.innerWidth, vh: window.innerHeight });
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  const portrait = vp.vh > vp.vw * 1.08;
  const showChrome = screen !== "splash" && screen !== "identitas";

  // Hitung skala & ruang ekstra (bleed) agar layar game penuh di semua gadget
  let scale = 1;
  let bleedX = 0;
  let bleedY = 0;
  let stageH = vp.vh;

  if (portrait) {
    const topBarH = showChrome ? 52 : 0;
    const bottomDeckH = !showChrome ? 0 : screen === "main" ? 158 : 66;
    stageH = Math.max(220, vp.vh - topBarH - bottomDeckH);
    scale = vp.vw / W;
    bleedX = 0;
    bleedY = Math.max(0, (stageH / scale - H) / 2);
  } else {
    scale = Math.min(vp.vw / W, vp.vh / H);
    bleedX = Math.max(0, (vp.vw / scale - W) / 2);
    bleedY = Math.max(0, (vp.vh / scale - H) / 2);
    stageH = vp.vh;
  }

  playMem.bleedX = bleedX;
  playMem.bleedY = bleedY;

  const Comp = SCREENS[screen];
  const isl = ISLANDS[session.island] ?? ISLANDS[0];

  const toggleFullscreen = () => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen().catch(() => notify("Layar penuh tidak tersedia"));
    } catch {
      notify("Layar penuh tidak tersedia");
    }
  };

  const frameVars = {
    "--bleed-x": `${bleedX}px`,
    "--bleed-y": `${bleedY}px`,
  } as CSSProperties;

  return (
    <div
      className={`fixed inset-0 flex flex-col justify-between overflow-hidden bg-[#062a45] ${
        settings.efek ? "" : "fx-off"
      } ${portrait ? "is-portrait" : "is-landscape"}`}
      onPointerDownCapture={(e) => {
        audio.unlock();
        const b = (e.target as HTMLElement).closest("button");
        if (b && !b.hasAttribute("data-quiet")) audio.sfx("click");
      }}
    >
      {/* Bilah status atas khusus saat gadget dipegang vertikal (HP / Tablet Portrait) */}
      {portrait && showChrome && (
        <header className="relative z-30 flex h-[52px] shrink-0 items-center justify-between border-b-[3px] border-[#2b1b0e] bg-gradient-to-r from-[#0a4d7a] via-[#1173b8] to-[#0a4d7a] px-2.5 text-white shadow-[0_3px_0_rgba(43,27,14,0.45)]">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Avatar className="h-8 w-8 shrink-0" shirt={SHIRTS[player.avatar % SHIRTS.length]} />
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-[13px] tracking-wide text-[#ffd54f]">{player.nama}</div>
              <div className="truncate text-[10px] font-extrabold text-[#dff4ff]">
                Kelas {player.kelas} · {isl.name}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="flex items-center gap-1 rounded-full border-2 border-[#2b1b0e] bg-[#fff8e6] px-2 py-0.5 text-[#2b1b0e]">
              <Ic n="star" className="h-3.5 w-3.5 text-[#ff9f1c]" />
              <span className="font-display text-[12px] tabular-nums">{player.poin}</span>
            </span>
            <span className="flex items-center gap-1 rounded-full border-2 border-[#2b1b0e] bg-[#f3ecff] px-2 py-0.5 text-[#2b1b0e]">
              <Ic n="crystal" className="h-3.5 w-3.5 text-[#7c3aed]" />
              <span className="font-display text-[12px] tabular-nums">{player.kristal}</span>
            </span>
            <span className="flex items-center gap-1 rounded-full border-2 border-[#2b1b0e] bg-white px-2 py-0.5 text-[#2b1b0e]">
              <Ic n="medal" className="h-3.5 w-3.5 text-[#ff8a3d]" />
              <span className="font-display text-[12px] tabular-nums">{badgeCount(player)}/5</span>
            </span>
            <button
              type="button"
              aria-label="Atur suara"
              onClick={() => setSettings({ musik: !settings.musik, suara: !settings.suara })}
              className="btn3d grid h-7 w-7 place-items-center bg-[#ffd54f] text-[#2b1b0e]"
            >
              <Ic n="volume" className={`h-3.5 w-3.5 ${settings.suara ? "" : "opacity-40"}`} />
            </button>
            <button
              type="button"
              aria-label="Layar penuh"
              onClick={toggleFullscreen}
              className="btn3d grid h-7 w-7 place-items-center bg-[#2fa7e8] text-white"
            >
              <Ic n="screen" className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* Area layar game utama — merentang penuh sesuai ukuran gadget */}
      <div
        className="relative w-full shrink-0 overflow-hidden"
        style={{ height: stageH, ...frameVars }}
      >
        <div
          className="absolute"
          style={{
            width: W,
            height: H,
            left: (vp.vw - W * scale) / 2,
            top: (stageH - H * scale) / 2,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <Comp key={screen} />
          {flash && (
            <div
              key={flash.id}
              className="anim-rise pointer-events-none absolute left-1/2 top-[52px] z-50 -ml-[110px] w-[220px] text-center"
            >
              <span className="inline-block rounded-full border-[3px] border-[#2b1b0e] bg-[#ffd54f] px-3 py-[2px] font-display text-[13px] text-[#2b1b0e] shadow-[0_3px_0_rgba(43,27,14,0.45)]">
                {flash.text}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dek Kontrol Arcade & Navigasi khusus mode vertikal (HP / Tablet Portrait) */}
      {portrait && showChrome &&
        (screen === "main" ? (
          <footer className="relative z-30 flex h-[158px] shrink-0 flex-col justify-between border-t-[4px] border-[#2b1b0e] bg-gradient-to-b from-[#10375c] to-[#071f36] px-3 py-2 text-white">
            {/* Baris atas: interaksi dan gudang senjata */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  playInput.act += 1;
                }}
                className="btn3d flex min-w-0 flex-1 items-center justify-center gap-1 bg-[#37c871] px-2 py-1.5 text-[10px] font-black uppercase text-white"
              >
                <Ic n="camera" className="h-4 w-4 shrink-0" /> Scan / Peti
              </button>
              <button
                type="button"
                onClick={() => go("misi")}
                className="btn3d flex items-center gap-1 bg-[#7c3aed] px-2 py-1.5 text-[10px] font-extrabold text-white"
              >
                <Ic n="book" className="h-4 w-4" /> Misi
              </button>
              <button
                type="button"
                onClick={() => go("senjata")}
                className="btn3d flex items-center gap-1 bg-[#ffd54f] px-2 py-1.5 text-[10px] font-extrabold text-[#2b1b0e]"
              >
                <Ic n="bolt" className="h-4 w-4" /> Senjata
              </button>
              <button
                type="button"
                data-quiet=""
                aria-label="Gamepad meluncur cepat"
                onClick={() => { playInput.dash += 1; }}
                className="btn3d flex items-center gap-1 bg-[#00a7c9] px-2 py-1.5 text-[10px] font-extrabold text-white"
              >
                <Ic n="fast" className="h-4 w-4" /> Dash
              </button>
            </div>

            {/* Baris utama: gerak, serangan, dan lompat */}
            <div className="grid grid-cols-7 gap-1 pb-1">
                <PadHold k="l" label="Gamepad jalan kiri" className="h-14 min-w-0 bg-[#2fa7e8]">
                  <Ic n="left" className="h-6 w-6" />
                  <span className="text-[9px]">KIRI</span>
                </PadHold>
                <PadHold k="d" label="Gamepad merunduk" className="h-14 min-w-0 bg-[#1173b8]">
                  <Ic n="down" className="h-5 w-5" />
                  <span className="text-[8px]">RUNDUK</span>
                </PadHold>
                <PadHold k="r" label="Gamepad jalan kanan" className="h-14 min-w-0 bg-[#2fa7e8]">
                  <Ic n="right" className="h-6 w-6" />
                  <span className="text-[9px]">KANAN</span>
                </PadHold>
                <button
                  type="button"
                  data-quiet=""
                  aria-label="Gamepad pukul"
                  onClick={() => { playInput.punch += 1; }}
                  className="btn3d flex h-14 min-w-0 flex-col items-center justify-center bg-[#ffd54f] text-[#2b1b0e]"
                >
                  <Ic n="fist" className="h-5 w-5" />
                  <span className="text-[8px] font-black">PUKUL</span>
                </button>
                <button
                  type="button"
                  data-quiet=""
                  aria-label="Gamepad tendang"
                  onClick={() => { playInput.kick += 1; }}
                  className="btn3d flex h-14 min-w-0 flex-col items-center justify-center bg-[#ff8a3d] text-white"
                >
                  <Ic n="kick" className="h-5 w-5" />
                  <span className="text-[8px] font-black">TENDANG</span>
                </button>
                <button
                  type="button"
                  data-quiet=""
                  aria-label={`Gamepad tembak ${player.equippedWeapon}`}
                  onClick={() => { playInput.shoot += 1; }}
                  className={`btn3d flex h-14 min-w-0 flex-col items-center justify-center text-white ${player.equippedWeapon === "plasma" ? "bg-[#7c3aed]" : "bg-[#00a7c9]"}`}
                >
                  <Ic n="bolt" className="h-5 w-5" />
                  <span className="text-[8px] font-black">TEMBAK</span>
                </button>
                <PadHold k="j" label="Gamepad lompat" className="h-14 min-w-0 bg-[#ff8a3d]">
                  <Ic n="up" className="h-6 w-6" />
                  <span className="text-[9px]">LOMPAT</span>
                </PadHold>
            </div>
          </footer>
        ) : (
          <footer className="relative z-30 flex h-[66px] shrink-0 items-center justify-around border-t-[4px] border-[#2b1b0e] bg-gradient-to-b from-[#10375c] to-[#071f36] px-2 py-2">
            <Btn tone="green" onClick={() => reset("menu")} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px]">
              <Ic n="home" className="h-4 w-4" /> Menu
            </Btn>
            <Btn tone="blue" onClick={() => reset("menu", "peta")} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px]">
              <Ic n="map" className="h-4 w-4" /> Peta Pulau
            </Btn>
            <Btn tone="orange" onClick={() => reset("menu", "profil")} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px]">
              <Ic n="users" className="h-4 w-4" /> Profil
            </Btn>
            <Btn tone="purple" onClick={() => reset("menu", "badge")} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px]">
              <Ic n="medal" className="h-4 w-4" /> Badge
            </Btn>
            <Btn tone="yellow" onClick={() => go("setelan")} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px]">
              <Ic n="gear" className="h-4 w-4" /> Setelan
            </Btn>
          </footer>
        ))}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Stage />
    </GameProvider>
  );
}
