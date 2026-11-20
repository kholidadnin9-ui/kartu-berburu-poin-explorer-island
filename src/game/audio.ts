/* Suara game: efek + musik chiptune sederhana, semuanya disintesis (tanpa file). */

export type Sfx =
  | "click"
  | "jump"
  | "coin"
  | "pearl"
  | "key"
  | "scan"
  | "card"
  | "correct"
  | "wrong"
  | "zonk"
  | "star"
  | "chest"
  | "teleport"
  | "arrive"
  | "dash"
  | "action"
  | "kick"
  | "laser"
  | "plasma"
  | "hit"
  | "dogdown";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicTimer = 0;
let step = 0;
let nextTime = 0;
let hooked = false;

const MEL = [
  659, 784, 880, 784, 659, 587, 523, 0, 587, 659, 784, 880, 1047, 880, 784, 0,
  698, 880, 1047, 880, 698, 659, 587, 0, 784, 698, 659, 587, 523, 587, 523, 0,
];
const BASS = [131, 98, 175, 131];
const STEP = 0.21;

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "square",
  vol = 0.07,
  slideTo?: number,
) {
  if (!ctx || !master) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g);
    g.connect(master);
    o.start(start);
    o.stop(start + dur + 0.04);
  } catch {
    /* abaikan */
  }
}

function schedule() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.35) {
    const n = MEL[step % MEL.length];
    if (n) tone(n, nextTime, STEP * 0.9, "triangle", 0.035);
    if (step % 4 === 0) tone(BASS[Math.floor(step / 8) % BASS.length], nextTime, STEP * 2.4, "sine", 0.05);
    step += 1;
    nextTime += STEP;
  }
}

export const audio = {
  sfxOn: true,
  musicOn: true,

  /** Harus dipanggil dari aksi pengguna (ketuk/klik) agar browser mengizinkan suara. */
  unlock() {
    try {
      if (!ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") void ctx.resume();
      if (!hooked) {
        hooked = true;
        document.addEventListener("visibilitychange", () => {
          if (!ctx) return;
          if (document.hidden) void ctx.suspend();
          else void ctx.resume();
        });
      }
      if (audio.musicOn) audio.startMusic();
    } catch {
      /* abaikan */
    }
  },

  startMusic() {
    if (!ctx || musicTimer) return;
    nextTime = ctx.currentTime + 0.08;
    musicTimer = window.setInterval(schedule, 110);
  },

  stopMusic() {
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = 0;
  },

  sfx(name: Sfx) {
    if (!audio.sfxOn || !ctx) return;
    const t = ctx.currentTime + 0.005;
    switch (name) {
      case "click":
        tone(620, t, 0.06, "square", 0.04);
        break;
      case "jump":
        tone(300, t, 0.16, "square", 0.05, 640);
        break;
      case "coin":
        tone(988, t, 0.07, "square", 0.05);
        tone(1319, t + 0.07, 0.14, "square", 0.05);
        break;
      case "pearl":
        tone(784, t, 0.08, "triangle", 0.09);
        tone(1175, t + 0.08, 0.1, "triangle", 0.09);
        tone(1568, t + 0.16, 0.18, "triangle", 0.09);
        break;
      case "key":
        [659, 831, 988, 1319].forEach((f, i) => tone(f, t + i * 0.07, 0.14, "square", 0.05));
        break;
      case "scan":
        tone(880, t, 0.09, "sine", 0.08);
        tone(880, t + 0.2, 0.09, "sine", 0.08);
        tone(1320, t + 0.4, 0.2, "sine", 0.08);
        break;
      case "card":
        tone(520, t, 0.07, "triangle", 0.09, 780);
        break;
      case "correct":
        [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.2, "square", 0.055));
        break;
      case "wrong":
        tone(233, t, 0.22, "sawtooth", 0.05, 160);
        tone(175, t + 0.2, 0.3, "sawtooth", 0.05, 110);
        break;
      case "zonk":
        [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * 0.12, 0.2, "square", 0.05));
        break;
      case "star":
        [1047, 1319, 1568, 2093, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.06, 0.12, "triangle", 0.08));
        break;
      case "chest":
        [523, 523, 523, 659, 784, 1047].forEach((f, i) =>
          tone(f, t + [0, 0.12, 0.24, 0.36, 0.52, 0.7][i], i === 5 ? 0.6 : 0.16, "square", 0.06),
        );
        break;
      case "teleport":
        tone(140, t, 0.85, "sine", 0.07, 520);
        [330, 440, 587, 784].forEach((f, i) => tone(f, t + i * 0.18, 0.24, "triangle", 0.045));
        tone(380, t + 0.85, 0.7, "triangle", 0.065, 1900);
        tone(260, t + 1.18, 0.32, "sine", 0.045, 1100);
        break;
      case "arrive":
        [659, 988, 1319].forEach((f, i) => tone(f, t + i * 0.1, 0.3, "triangle", 0.06));
        break;
      case "dash":
        tone(520, t, 0.14, "sawtooth", 0.055, 180);
        tone(780, t + 0.04, 0.12, "triangle", 0.06, 1280);
        break;
      case "action":
        tone(440, t, 0.07, "square", 0.05, 880);
        tone(880, t + 0.07, 0.14, "triangle", 0.06, 1175);
        break;
      case "kick":
        tone(220, t, 0.12, "triangle", 0.06, 110);
        tone(500, t + 0.04, 0.08, "square", 0.035, 200);
        break;
      case "laser":
        tone(1300, t, 0.17, "square", 0.035, 330);
        break;
      case "plasma":
        tone(350, t, 0.22, "sawtooth", 0.04, 880);
        tone(880, t + 0.07, 0.2, "triangle", 0.05, 280);
        break;
      case "hit":
        tone(220, t, 0.13, "square", 0.04, 130);
        break;
      case "dogdown":
        [660, 880, 1100].forEach((f, i) => tone(f, t + i * 0.08, 0.16, "triangle", 0.05));
        break;
    }
  },
};
