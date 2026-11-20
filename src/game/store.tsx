import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { audio } from "./audio";
import type { Cards, Level, Q } from "./questions";

export type Screen =
  | "splash" | "identitas" | "menu" | "profil" | "panduan" | "peta" | "level" | "main" | "misi"
  | "scan" | "kartu" | "soal" | "hasil" | "bonus" | "zonk" | "peti" | "teleport"
  | "badge" | "progres" | "setelan" | "senjata" | "kalah"
  | "guru" | "pemain" | "belajar" | "laporan" | "generator" | "cetak";

export type IslandProg = {
  soal: number;
  stations: number[];
  pearls: number[];
  coins: number[];
  dogs: number[];
  key: boolean;
  claimed: boolean;
  chest: boolean;
};
export type Log = { t: number; pulau: number; soal: string; jawab: string; benar: boolean };
export type Player = {
  id: string;
  nama: string;
  kelas: string;
  avatar: number;
  poin: number;
  totalPoin: number;
  kristal: number;
  acak: number;
  laserUnlocked: boolean;
  plasmaUnlocked: boolean;
  equippedWeapon: "laser" | "plasma";
  islands: IslandProg[];
  logs: Log[];
};
export type Settings = { musik: boolean; suara: boolean; efek: boolean; level: Level };
export type GuruInfo = { password: string; wa: string };
export type PrintCard = { t: "N" | "O" | "S" | "Z"; v: string };
export type Result = {
  benar: boolean;
  pilih: string;
  poin: number;
  kristal: number;
  habis: boolean;
  tuntas: boolean;
};
export type Session = {
  island: number;
  station: number;
  hearts: number;
  cards: Cards | null;
  q: Q | null;
  result: Result | null;
  lastSpecial: boolean;
};
type Save = { players: Player[]; active: string; settings: Settings; guru: GuruInfo; deck: PrintCard[] };

export const SOAL_TARGET = 10;
export const PEARL_TARGET = 5;
export const PER_STATION = 2;
export const START_X = 70;

/** Posisi robot & ukuran ekstra layar diingat agar kamera mengikuti semua gadget. */
export const playMem = { island: -1, x: START_X, bleedX: 0, bleedY: 0 };

/** Input bersama untuk kendali robot dari tombol layar, gamepad HP/tablet, & keyboard. */
export const playInput = {
  l: false,
  r: false,
  j: false,
  d: false,
  dash: 0,
  punch: 0,
  kick: 0,
  shoot: 0,
  act: 0,
};

const KEY = "island-explorer-save-v1";
const DEFAULTS: Settings = { musik: true, suara: true, efek: true, level: "Mudah" };
const DEFAULT_GURU: GuruInfo = { password: "1234", wa: "" };
const uid = () => Math.random().toString(36).slice(2, 9);

export const emptyIsland = (): IslandProg => ({
  soal: 0,
  stations: [0, 0, 0, 0, 0],
  pearls: [],
  coins: [],
  dogs: [],
  key: false,
  claimed: false,
  chest: false,
});

const newPlayer = (nama: string, kelas: string): Player => ({
  id: uid(),
  nama,
  kelas,
  avatar: 0,
  poin: 0,
  totalPoin: 0,
  kristal: 0,
  acak: 0,
  laserUnlocked: false,
  plasmaUnlocked: false,
  equippedWeapon: "laser",
  islands: [0, 1, 2, 3, 4].map(emptyIsland),
  logs: [],
});

export const withIsland = (p: Player, i: number, isl: IslandProg): Player => ({
  ...p,
  islands: p.islands.map((v, k) => (k === i ? isl : v)),
});
export const badgeCount = (p: Player) => p.islands.filter((i) => i.chest).length;
export const unlocked = (p: Player, i: number) => i === 0 || p.islands[i - 1].chest;

function load(): Save {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Save;
      if (Array.isArray(s.players) && s.players.length > 0 && s.settings) {
        const players = s.players.map((p) => {
          const totalPoin = typeof p.totalPoin === "number" ? p.totalPoin : Math.max(0, p.poin || 0);
          const plasmaUnlocked = p.plasmaUnlocked === true;
          return {
            ...newPlayer(p.nama ?? "", p.kelas ?? ""),
            ...p,
            totalPoin,
            laserUnlocked: p.laserUnlocked === true || totalPoin >= 100,
            plasmaUnlocked,
            equippedWeapon: p.equippedWeapon === "plasma" && plasmaUnlocked ? "plasma" as const : "laser" as const,
            islands: [0, 1, 2, 3, 4].map((i) => ({ ...emptyIsland(), ...(p.islands?.[i] ?? {}) })),
            logs: Array.isArray(p.logs) ? p.logs : [],
          };
        });
        const active = players.some((p) => p.id === s.active) ? s.active : players[0].id;
        return {
          players,
          active,
          settings: { ...DEFAULTS, ...s.settings },
          guru: { ...DEFAULT_GURU, ...(s as Partial<Save>).guru },
          deck: Array.isArray(s.deck) ? s.deck : [],
        };
      }
    }
  } catch {
    /* simpanan rusak / tidak tersedia → mulai baru */
  }
  const p = newPlayer("", "");
  return {
    players: [p],
    active: p.id,
    settings: { musik: true, suara: true, efek: true, level: "Mudah" },
    guru: { ...DEFAULT_GURU },
    deck: [],
  };
}

type Flash = { id: number; text: string } | null;

type Ctx = {
  players: Player[];
  player: Player;
  settings: Settings;
  guru: GuruInfo;
  deck: PrintCard[];
  session: Session;
  screen: Screen;
  flash: Flash;
  go: (s: Screen) => void;
  replace: (s: Screen) => void;
  back: () => void;
  reset: (...s: Screen[]) => void;
  updatePlayer: (fn: (p: Player) => Player) => void;
  setSettings: (p: Partial<Settings>) => void;
  setGuru: (p: Partial<GuruInfo>) => void;
  setSession: (p: Partial<Session>) => void;
  enterPlayer: (nama: string, kelas: string) => void;
  addPlayer: (nama: string, kelas: string) => void;
  removePlayer: (id: string) => void;
  selectPlayer: (id: string) => void;
  setDeck: (fn: (d: PrintCard[]) => PrintCard[]) => void;
  notify: (text: string) => void;
};

const GameCtx = createContext<Ctx | null>(null);
let flashSeq = 0;

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<Save>(load);
  const [stack, setStack] = useState<Screen[]>(["splash"]);
  const [flash, setFlash] = useState<Flash>(null);
  const [session, setSess] = useState<Session>({
    island: 0,
    station: 0,
    hearts: 3,
    cards: null,
    q: null,
    result: null,
    lastSpecial: false,
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(save));
    } catch {
      /* penyimpanan tidak tersedia */
    }
  }, [save]);

  useEffect(() => {
    audio.sfxOn = save.settings.suara;
    audio.musicOn = save.settings.musik;
    if (save.settings.musik) audio.startMusic();
    else audio.stopMusic();
  }, [save.settings.suara, save.settings.musik]);

  const go = useCallback((s: Screen) => setStack((st) => [...st, s]), []);
  const replace = useCallback((s: Screen) => setStack((st) => [...st.slice(0, -1), s]), []);
  const back = useCallback(() => setStack((st) => (st.length > 1 ? st.slice(0, -1) : ["menu"])), []);
  const reset = useCallback((...s: Screen[]) => setStack(s.length ? s : ["menu"]), []);

  const updatePlayer = useCallback((fn: (p: Player) => Player) => {
    setSave((s) => ({
      ...s,
      players: s.players.map((p) => {
        if (p.id !== s.active) return p;
        const next = fn(p);
        if (next === p) return p;
        // Poin yang dibelanjakan tidak menghapus kemajuan menuju laser.
        const totalPoin = next.totalPoin !== p.totalPoin
          ? next.totalPoin
          : p.totalPoin + Math.max(0, next.poin - p.poin);
        return { ...next, totalPoin, laserUnlocked: next.laserUnlocked || totalPoin >= 100 };
      }),
    }));
  }, []);
  const setSettings = useCallback((p: Partial<Settings>) => {
    setSave((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  }, []);
  const setGuru = useCallback((p: Partial<GuruInfo>) => {
    setSave((s) => ({ ...s, guru: { ...s.guru, ...p } }));
  }, []);
  const setSession = useCallback((p: Partial<Session>) => setSess((s) => ({ ...s, ...p })), []);
  const enterPlayer = useCallback((nama: string, kelas: string) => {
    const cleanName = nama.trim().slice(0, 14);
    const cleanClass = kelas.trim().slice(0, 6);
    if (!cleanName || !cleanClass) return;
    setSave((s) => {
      const match = s.players.find((p) =>
        p.nama.trim().toLocaleLowerCase() === cleanName.toLocaleLowerCase() &&
        p.kelas.trim().toLocaleLowerCase() === cleanClass.toLocaleLowerCase(),
      );
      if (match) return { ...s, active: match.id };
      const p = newPlayer(cleanName, cleanClass);
      return { ...s, players: [...s.players.filter((v) => v.nama.trim() && v.kelas.trim()), p], active: p.id };
    });
    playMem.island = -1;
    playMem.x = START_X;
    setSess({ island: 0, station: 0, hearts: 3, cards: null, q: null, result: null, lastSpecial: false });
  }, []);
  const addPlayer = useCallback((nama: string, kelas: string) => {
    const p = newPlayer(nama, kelas);
    setSave((s) => ({ ...s, players: [...s.players, p], active: p.id }));
    playMem.island = -1;
  }, []);
  const removePlayer = useCallback((id: string) => {
    setSave((s) => {
      if (s.players.length <= 1) return s;
      const players = s.players.filter((p) => p.id !== id);
      return { ...s, players, active: s.active === id ? players[0].id : s.active };
    });
    playMem.island = -1;
  }, []);
  const selectPlayer = useCallback((id: string) => {
    setSave((s) => ({ ...s, active: id }));
    playMem.island = -1;
  }, []);
  const setDeck = useCallback((fn: (d: PrintCard[]) => PrintCard[]) => {
    setSave((s) => ({ ...s, deck: fn(s.deck).slice(0, 120) }));
  }, []);
  const notify = useCallback((text: string) => {
    flashSeq += 1;
    const id = flashSeq;
    setFlash({ id, text });
    window.setTimeout(() => setFlash((f) => (f && f.id === id ? null : f)), 1300);
  }, []);

  const player = save.players.find((p) => p.id === save.active) ?? save.players[0];
  const screen = stack[stack.length - 1];
  const lastUnlock = useRef({ id: player.id, laser: player.laserUnlocked });

  useEffect(() => {
    if (lastUnlock.current.id === player.id && !lastUnlock.current.laser && player.laserUnlocked) {
      notify("100 poin terkumpul! Laser terbuka!");
      audio.sfx("star");
    }
    lastUnlock.current = { id: player.id, laser: player.laserUnlocked };
  }, [player.id, player.laserUnlocked, notify]);

  const value = useMemo<Ctx>(
    () => ({
      players: save.players, player, settings: save.settings, guru: save.guru, deck: save.deck, session, screen, flash,
      go, replace, back, reset, updatePlayer, setSettings, setGuru, setSession,
      enterPlayer, addPlayer, removePlayer, selectPlayer, setDeck, notify,
    }),
    [save, player, session, screen, flash, go, replace, back, reset, updatePlayer, setSettings, setGuru, setSession,
      enterPlayer, addPlayer, removePlayer, selectPlayer, setDeck, notify],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame(): Ctx {
  const c = useContext(GameCtx);
  if (!c) throw new Error("useGame harus dipakai di dalam GameProvider");
  return c;
}
