import type { Topic } from "./questions";
import beach from "../assets/beach-scene.jpg";
import forest from "../assets/mystic-forest.jpg";
import cave from "../assets/crystal-cave.jpg";
import waterfall from "../assets/waterfall.jpg";
import temple from "../assets/temple.jpg";

type Deco = { n: string; c: string };

export type IslandDef = {
  id: number;
  name: string;
  topic: Topic;
  topicLabel: string;
  badge: string;
  icon: string;
  color: string;
  img: string;
  ground: [string, string];
  top: string;
  deco: Deco[];
  /** posisi label pada peta (persen) */
  mx: number;
  my: number;
};

export const ISLANDS: IslandDef[] = [
  {
    id: 0, name: "Sunset Beach", topic: "tambah", topicLabel: "Penjumlahan", badge: "Beach Explorer",
    icon: "palm", color: "#2fa7e8", img: beach, ground: ["#f3cf7a", "#c98d43"], top: "#ffe9a8",
    deco: [{ n: "palm", c: "#2f9e58" }, { n: "palm", c: "#49b96f" }, { n: "palm", c: "#1f8a4c" }], mx: 24, my: 92,
  },
  {
    id: 1, name: "Mystic Forest", topic: "kurang", topicLabel: "Pengurangan", badge: "Forest Adventurer",
    icon: "tree", color: "#37c871", img: forest, ground: ["#7a5230", "#4f311a"], top: "#4fd07a",
    deco: [{ n: "tree", c: "#2f9e58" }, { n: "tree", c: "#1f7a45" }, { n: "palm", c: "#49b96f" }], mx: 25, my: 47,
  },
  {
    id: 2, name: "Crystal Cave", topic: "banding", topicLabel: "Perbandingan", badge: "Crystal Hunter",
    icon: "crystal", color: "#7c3aed", img: cave, ground: ["#5b3fa3", "#35226b"], top: "#b79bff",
    deco: [{ n: "crystal", c: "#c4a8ff" }, { n: "crystal", c: "#6fdcff" }, { n: "crystal", c: "#ff9bd5" }], mx: 57, my: 34,
  },
  {
    id: 3, name: "Waterfall Island", topic: "kali", topicLabel: "Perkalian", badge: "Waterfall Master",
    icon: "drop", color: "#0891b2", img: waterfall, ground: ["#3f8f6a", "#27624a"], top: "#7fe3b0",
    deco: [{ n: "palm", c: "#2f9e58" }, { n: "tree", c: "#1f7a45" }, { n: "palm", c: "#49b96f" }], mx: 79, my: 64,
  },
  {
    id: 4, name: "Ancient Temple", topic: "campur", topicLabel: "Campuran", badge: "Treasure Legend",
    icon: "chest", color: "#a9673a", img: temple, ground: ["#c9a56a", "#8f6c38"], top: "#f0d79a",
    deco: [{ n: "pillar", c: "#efe0b8" }, { n: "palm", c: "#2f9e58" }, { n: "pillar", c: "#d9c391" }], mx: 69, my: 94,
  },
];

/* ------------------------------------------------------------------ */
/* Tata letak level (koordinat dunia; y = tinggi di atas tanah)        */
/* ------------------------------------------------------------------ */
export const GH = 58; // tinggi tanah
export const VW = 480;

export type Pt = { x: number; y: number; guard?: number };
export type LevelDef = {
  W: number;
  plats: { x: number; y: number; w: number }[];
  pearls: Pt[];
  coins: Pt[];
  dogs: number[];
  stations: number[];
  key: Pt;
  chest: number;
  deco: { x: number; n: string; c: string; s: number }[];
};

export function buildLevel(id: number): LevelDef {
  const plats: LevelDef["plats"] = [];
  const pearls: Pt[] = [];
  const coins: Pt[] = [];
  const dogs: number[] = [];
  const stations: number[] = [];
  const deco: LevelDef["deco"] = [];
  const dec = ISLANDS[id].deco;
  let key: Pt = { x: 0, y: 0 };

  for (let i = 0; i < 5; i++) {
    const sx = 230 + i * 400;
    dogs.push(sx - 30);
    const off = (id * 37 + i * 53) % 50;
    const p1 = { x: sx + 40 + off, y: 54, w: 92 };
    plats.push(p1);
    const high = (i + id) % 2 === 0;

    if (high) {
      const p2 = { x: p1.x + 118, y: 100, w: 84 };
      plats.push(p2);
      pearls.push({ x: p2.x + 42, y: 116, guard: i });
      coins.push({ x: p1.x + 30, y: 68, guard: i }, { x: p1.x + 62, y: 68, guard: i });
      // pulau bernomor genap: kunci di menara tengah
      if (id % 2 === 0 && i === 2) {
        const p3 = { x: p2.x + 12, y: 146, w: 60 };
        plats.push(p3);
        key = { x: p3.x + 30, y: 162 };
      }
    } else {
      pearls.push({ x: p1.x + 46, y: 70, guard: i });
      coins.push({ x: sx + 196, y: 14, guard: i }, { x: sx + 224, y: 14, guard: i }, { x: sx + 252, y: 14, guard: i });
    }

    stations.push(sx + 330);
    const a = dec[(i + id) % 3];
    const b = dec[(i + id + 1) % 3];
    deco.push({ x: sx - 44 + off, n: a.n, c: a.c, s: 44 + ((i * 7 + id * 3) % 3) * 8 });
    deco.push({ x: sx + 262 - off, n: b.n, c: b.c, s: 28 + ((i * 5 + id) % 3) * 6 });
  }

  // tangga di ujung pulau (pulau ganjil: kunci di puncaknya; lainnya: koin bonus)
  plats.push({ x: 2218, y: 54, w: 70 }, { x: 2304, y: 100, w: 72 });
  if (id % 2 === 1) key = { x: 2340, y: 116 };
  else coins.push({ x: 2326, y: 114, guard: 4 }, { x: 2354, y: 114, guard: 4 });

  return { W: 2560, plats, pearls, coins, dogs, stations, key, chest: 2450, deco };
}
