/* Pembuat soal: tiga kartu (angka, operator, angka) selalu menjadi satu soal. */

export type Topic = "tambah" | "kurang" | "banding" | "kali" | "campur";
export type Level = "Mudah" | "Sedang" | "Sulit";
export type Cards = [string, string, string];

export type Q = {
  /** null = kotak kosong yang harus diisi */
  tokens: (string | null)[];
  answer: string;
  choices: string[];
  cards: Cards;
  hint: string;
};

const MAXV: Record<Level, number> = { Mudah: 20, Sedang: 50, Sulit: 100 };
export const REWARD: Record<Level, number> = { Mudah: 10, Sedang: 15, Sulit: 20 };

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = ri(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Mengambil tiga kartu acak sesuai topik pulau dan tingkat kesulitan. */
export function drawCards(topic: Topic, level: Level): Cards {
  const max = MAXV[level];
  const t = topic === "campur" ? (["tambah", "kurang", "banding", "kali"] as const)[ri(0, 3)] : topic;

  if (t === "tambah") {
    if (Math.random() < 0.5) {
      const a = ri(1, max - 2);
      const c = ri(a + 1, max);
      return [String(a), "+", String(c)]; // a + □ = c
    }
    const a = ri(1, max - 1);
    const b = ri(1, Math.min(a, max - a));
    return [String(a), "+", String(b)]; // a + b = □
  }
  if (t === "kurang") {
    const a = ri(2, max);
    const b = ri(1, a - 1);
    return [String(a), "−", String(b)];
  }
  if (t === "banding") {
    const a = ri(1, max);
    const b = Math.random() < 0.2 ? a : ri(1, max);
    return [String(a), "<>", String(b)];
  }
  const lim = level === "Mudah" ? [5, 5] : level === "Sedang" ? [10, 5] : [10, 10];
  return [String(ri(1, lim[0])), "×", String(ri(1, lim[1]))];
}

/** Menyusun soal dari tiga kartu. Mengembalikan null jika kartunya tidak cocok. */
export function buildQuestion(cards: Cards): Q | null {
  const a = Number(cards[0]);
  const b = Number(cards[2]);
  const op = cards[1];
  if (!Number.isFinite(a) || !Number.isFinite(b) || cards[0] === "" || cards[2] === "") return null;

  if (op === "<" || op === ">" || op === "=" || op === "<>") {
    const ans = a < b ? "<" : a > b ? ">" : "=";
    const kata = ans === "<" ? "lebih kecil dari" : ans === ">" ? "lebih besar dari" : "sama dengan";
    return {
      tokens: [String(a), null, String(b)],
      answer: ans,
      choices: ["<", "=", ">"],
      cards,
      hint: `${a} ${kata} ${b}, jadi ${a} ${ans} ${b}.`,
    };
  }

  let tokens: (string | null)[];
  let ans: number;
  let hint: string;

  if (op === "+") {
    if (b > a) {
      tokens = [String(a), "+", null, "=", String(b)];
      ans = b - a;
      hint = `Hitung maju dari ${a} sampai ${b}: ada ${ans} langkah.`;
    } else {
      tokens = [String(a), "+", String(b), "=", null];
      ans = a + b;
      hint = `${a} ditambah ${b} sama dengan ${ans}.`;
    }
  } else if (op === "−" || op === "-") {
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    if ((hi + lo) % 2 === 0 && lo > 0) {
      tokens = [String(hi), "−", null, "=", String(lo)];
      ans = hi - lo;
      hint = `${hi} dikurangi ${ans} tersisa ${lo}.`;
    } else {
      tokens = [String(hi), "−", String(lo), "=", null];
      ans = hi - lo;
      hint = `${hi} dikurangi ${lo} tersisa ${ans}.`;
    }
  } else if (op === "×" || op === "x") {
    tokens = [String(a), "×", String(b), "=", null];
    ans = a * b;
    hint =
      a >= 2 && a <= 5
        ? `${a} × ${b} artinya ${Array(a).fill(b).join(" + ")} = ${ans}.`
        : `${a} × ${b} sama dengan ${ans}.`;
  } else {
    return null;
  }

  const pool = shuffle([ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans + 3]).filter(
    (v) => v >= 0 && v !== ans,
  );
  const wrong = Array.from(new Set(pool)).slice(0, 2);
  return {
    tokens,
    answer: String(ans),
    choices: shuffle([ans, ...wrong]).map(String),
    cards,
    hint,
  };
}

/** Teks soal; kotak kosong diganti `fill`. */
export function fillQ(q: Q, fill: string): string {
  return q.tokens.map((t) => t ?? fill).join(" ");
}
