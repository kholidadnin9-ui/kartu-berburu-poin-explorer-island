import { type CSSProperties } from "react";

export type Mood = "happy" | "sad" | "wow" | "cheer";
export type RobotAction =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "doubleJump"
  | "fall"
  | "land"
  | "dash"
  | "crouch"
  | "attack"
  | "kick"
  | "shoot"
  | "wave"
  | "victory"
  | "hurt";

/* ------------------------------------------------------------------ */
/* Palet piksel persis dari gambar referensi robot                     */
/* ------------------------------------------------------------------ */
const PAL: Record<string, string> = {
  K: "#141020", // garis tepi piksel hitam-ungu tua
  W: "#ffffff", // putih highlight terang
  L: "#eef4fa", // putih armor utama
  S: "#b8cbe0", // bayangan putih biru-abu muda
  D: "#7e95b3", // bayangan putih slate sedang
  M: "#52647e", // bayangan metal dalam

  Y: "#fff675", // emas highlight terang
  G: "#ffc800", // kuning-emas utama
  O: "#ee8600", // oranye-emas hangat
  B: "#a84e00", // cokelat-emas bayangan

  V: "#180b04", // visor hitam-cokelat terdalam
  U: "#2e1508", // visor cokelat gelap
  N: "#4d240d", // visor cokelat hangat
  R: "#733714", // pendar dalam visor

  E: "#ffffe0", // inti mata putih-kuning menyala
  F: "#ffe436", // kuning mata menyala
  H: "#ff9000", // oranye pendar mata
  J: "#c85200", // tepi pendar mata

  C: "#ffffff", // inti LED biru
  A: "#3cf6ff", // sian terang LED biru
  P: "#007bff", // biru elektrik LED

  Q: "#7d899b", // abu terang sendi & kepalan
  T: "#4d576b", // abu sedang paha & kepalan
  Z: "#2b3242", // abu gelap sendi & sol sepatu
};

type Span = { x: number; y: number; w: number; c: string };

function compileGrid(rows: string[], ox = 0, oy = 0): Span[] {
  const out: Span[] = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === "." || ch === " " || !PAL[ch]) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === ch) w++;
      out.push({ x: ox + x, y: oy + y, w, c: PAL[ch] });
      x += w;
    }
  }
  return out;
}

function PixelLayer({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={1} fill={s.c} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 1. TANGAN KIRI ROBOT (di kanan gambar — kepalan tangan terangkat)   */
/* ------------------------------------------------------------------ */
// Lengan atas dan kepalan bergerak bersama pada satu sendi bahu.
const BACK_UPPER_ARM = compileGrid(
  [
    ".......KKKKKKKKKK.....",
    ".....KKQTTTQQQTTK.....",
    "...KKWWWWWLLSSSDDK....",
    "..KWWWLLLLLLSSSDDK....",
    ".KWWWLLLLLLLSSSDDK....",
    ".KWWWLLLLLLLSSDDK.....",
    ".KWWWWLLLLLSSDDK......",
    "KWWWWWLLLLSSSDDK......",
    "KWWWLLLLLSSSDDK.......",
    "KWWWLLLLSSDDKK........",
    "KYYYGGGGGODK..........",
    "KGGGGGGGOOK...........",
    ".KOOOOOBBK............",
    "..KKKKKKK.............",
  ],
  33,
  25,
);

const BACK_ARM = compileGrid(
  [
    "......KKKKKKKK......",
    "....KKQQTTTTQQKK....",
    "...KQTKKKKKKKKTQK...",
    "..KQTKQTKKKKTQKTQK..",
    "..KTKQTKZZZZKTQKTK..",
    "..KTKZZKKKKKKZZKTK..",
    "..KTKQQTTTTTTQQKTK..",
    "...KTZZZZZZZZZZTK...",
    "...KKYYYYGGGGGGKK...",
    "..KYYGGGGGGGGGOCK...",
    "..KGGOOOOOOBBBWWLK..",
    "...KKWWLLLLLLSSSKK..",
    "...KWWLLLLLLSSSSDK..",
    "...KWLLLLLSSSSSDDK..",
    "....KLLLLSSSSSDDK...",
    "....KKKKKSSSSDDKK...",
    ".......KKKKKKKK.....",
  ],
  36,
  15,
);

/* ------------------------------------------------------------------ */
/* 2. KAKI KIRI ROBOT (di kanan gambar — paha, pelindung lutut, bot)   */
/* ------------------------------------------------------------------ */
const BACK_LEG = compileGrid(
  [
    "..KKKKKKKK..........",
    ".KQTZZZZTQK.........",
    ".KTZZZZZZTK.........",
    ".KQTZZZZZTQK........",
    "..KTZZZZZTQK........",
    "..KTZZZKKKKKKK......",
    "..KKKKKWWLLLLKK.....",
    ".KGGYYWWLLLLLSSK....",
    "KGGGYYWWLLLLLSSSK...",
    "KOOOOGWWLLKKKSSSDK..",
    ".KKKKGWWLKYYGKSSDK..",
    "..KWWWLLLKGGOKSSDK..",
    "..KWWLLLLLKKKSSSDDK.",
    ".KWWLLLLSSSSSSSDDDK.",
    ".KWLLLLSSSSSSSSDDDK.",
    ".KKKKKKKKKKKKKKKKKK.",
    "KWWLLLLKKYYYYGGGGGK.",
    "KWLLLLLKYYYYGGGGGGOK",
    "KSSSSSSKGGGGGOOOOWWK",
    "KDDDDDDKOOOOOBBWWLSK",
    "KZZZZZZZKKKKKWWLLLSK",
    "KZZZZZZZZZZZZSSSSDDK",
    "KKKKKKKKKKKKKKKKKKKK",
  ],
  27,
  38,
);

/* ------------------------------------------------------------------ */
/* 3. TORSO / PELAT DADA & SABUK (dengan LED biru menyala)             */
/* ------------------------------------------------------------------ */
const TORSO = compileGrid(
  [
    "....KKKKKKKKKKKKKKKK....",
    "..KKGGYYYYWWWWLLLLGGKK..",
    ".KGGYYWWWWWWLLLLLLGGOCK.",
    ".KOOOWWWWWWWWLLLLSSOOOK.",
    ".KWWWWLLLLLLKKKKKSSSDDK.",
    ".KWWWLLLLLLKYYYYGKSSDDK.",
    "..KWWLLLLLLKGGGGOKSSDK..",
    "..KSSDDKKKKKOOOOOKSSDK..",
    "..KSSDKPAACKKKKKKKSSDK..",
    "..KDDDKPACCKYYGGGOKSDK..",
    "...KKKKPPPPKGGGGOCKKK...",
    "..KGGYYKKKKKOOOOOKYGGK..",
    ".KGGGYYWWLLKKKKKKLLYYGK.",
    ".KOOOOWWLLLSSSSSSLLLOOK.",
    "..KKWWLLLLSSDKKSSLLLLKK.",
    "....KKKKKKKKK..KKKKKKK..",
  ],
  16,
  23,
);

/* ------------------------------------------------------------------ */
/* 4. KAKI KANAN ROBOT (di kiri gambar — paha, pelindung lutut, bot)   */
/* ------------------------------------------------------------------ */
const FRONT_LEG = compileGrid(
  [
    ".........KKKKKKKK...",
    "........KQTZZZZTQK..",
    ".......KQTZZZZZZTQK.",
    ".......KTZZZZZZZZTK.",
    "......KTZZZZZZZQTK..",
    ".....KKKKKKKZZZZTK..",
    "....KKWWLLLKKKKKK...",
    "...KGYWWLLLLLSSK....",
    "..KGGYWWLLLLLSSSK...",
    "..KOOGWWLLKKKSSSSDK.",
    "..KKKGWWLKYYGKSSSDK.",
    "...KWWLLLKGGOKSSSDK.",
    "..KWWLLLLLKKKSSSSDDK",
    ".KWWLLLLLSSSSSSSDDDK",
    ".KWLLLLLLSSSSSSSSDDK",
    ".KKKKKKKKKKKKKKKKKK.",
    ".KYYYYGGGGGGGWWLLLK.",
    "KYYYYGGGGGGGGWWWLLSK",
    "KWWLLOOOOOOBBWWWLLSK",
    "KWWWWLLLLLLSSSSSDDDK",
    "KSSSSSSDDDDDDZZZZZZK",
    "KZZZZZZZZZZZZZZZZZZK",
    "KKKKKKKKKKKKKKKKKKKK",
  ],
  8,
  38,
);

/* ------------------------------------------------------------------ */
/* 5. TANGAN KANAN ROBOT (di kiri gambar — bahu + bracer + kepalan)    */
/* ------------------------------------------------------------------ */
const FRONT_ARM = compileGrid(
  [
    ".....KKKKKKKKK......",
    "...KKWWWWWWLLLKK....",
    "..KWWWWWWLLLLLSSK...",
    ".KWWWWWLLLLLLSSSDK..",
    ".KWWWLLLLSSSSSSDDK..",
    ".KYYGGGGGGGGSSSSDK..",
    ".KYYYYGGGGGGGOOODK..",
    "..KKOOOOOOOOBBBKK...",
    "...KKQTZZZZZTQKK....",
    "..KYYGQTZZZZTQK.....",
    ".KYYYYGQTZZTQK......",
    ".KWWLLGGQTTQK.......",
    ".KWWWLLGGOOOK.......",
    ".KWWLLLLLSSGGK......",
    "..KWLLLLSSSGYYK.....",
    "..KSSSSSDDDGOOK.....",
    "...KKKKGYYGQTQKK....",
    "......KGGOKQTTZQK...",
    "......KOOOKQTZZTQK..",
    ".......KKKKKZZZZTK..",
    "...........KZZZZTK..",
    "............KKKKK...",
  ],
  6,
  21,
);

/* ------------------------------------------------------------------ */
/* 6. KEPALA & HELM (kubah putih, crest emas, ear-pod, visor & dagu)   */
/* ------------------------------------------------------------------ */
const HEAD_BASE = compileGrid(
  [
    "..........KKKKKKKKKKKKK.........",
    ".......KKKWWWWWWKYYYYGGKKK......",
    ".....KKWWWWWWWWWKYYYYGGGOCKK....",
    "....KWWWWWWWWWWWKYYYYGGGOWWWK...",
    "...KWWWWWWWWWWWWKYYYYGGOWWWWWK..",
    "..KWWWWWWWWLLLLLLKYYYYGWWWWLLSK.",
    "..KWWWWWWLLLLLLLLSKGGGGWWWWLLSK.",
    ".KWWWWLLLLLLLLSSSSSKKKKWWWLLLLSK",
    ".KWWKKKKKKLLLLSSSSKKKKKKKKKKKKKK",
    "KWKGGGGYYKKSSSSSSKVVVVUUUUUUUVVK",
    "KKGGYYYYGGOKSSSSKVUUUUUUUUUUUUVK",
    "KGGYYKKKYYGOKSSKVUUUUUUUUUUUUUUK",
    "KGGYKQTTKYYGOKSKVUUUUUUUUUUUUUUK",
    "KGGYKQZZKYYGOKSKVUUUUUUUUUUUUUUK",
    "KGGYKQTTKYYGOKSKVUUUUUUUUUUUUUUK",
    "KOOOGKKKGGGOKSSKVUUUUUUUUUUUUUUK",
    "KKOOOOOOOOOKSSSSKVUUUUUUUUUUUUVK",
    ".KKBBBBBBBKKSSSSSKVVUUUUUUUUUVKK",
    "..KKKKKKKKKLLLLLLSKKKKKKKKKKKKK.",
    "...KWWWWLLLLLLSSSSKLLLLLSSSSSDK.",
    "....KWWWLLLLLLSSSSKLLLLLSSSSDK..",
    ".....KKWWLLLLLSSSSKLLLLSSSSKK...",
    ".......KKKKKKKKKKKKKKKKKKKK.....",
  ],
  10,
  1,
);

const EYES_HAPPY = compileGrid(
  [
    ".JHHHHHJ..JHHHJ.",
    "JHFFFFFHHJHFFFHJ",
    "HFFEEEEEHHFFEEEH",
    "HFEEEEEEFHFEEEEF",
    "JHFFEEEEFHHFEEHJ",
    ".JHHHFFFJ.JHFFJ.",
  ],
  27,
  12,
);

const EYES_CHEER = compileGrid(
  [
    "................",
    ".JHHHHHJ..JHHHJ.",
    "JHFFFFFFHHFFFFFH",
    "HFFEEJJFFEEFFEEJ",
    "JHFH...HFHHFH..H",
    "................",
  ],
  27,
  12,
);

const EYES_WOW = compileGrid(
  [
    "JHHHFFFFHHHHFFFJ",
    "HFFFEEEEFFFEEEEF",
    "HFFEEEEEEFFEEEEF",
    "HFFFEEEEFFFEEEEF",
    "JHHHFFFFHHHHFFFJ",
    "................",
  ],
  27,
  12,
);

const EYES_SAD = compileGrid(
  [
    "................",
    "..JHHHHJ..JHHHJ.",
    ".JHFFFFFHJHFFFFH",
    ".JJJFFFFJJJFFFFJ",
    "....AA......AA..",
    "................",
  ],
  27,
  12,
);

export type RobotProps = {
  className?: string;
  mood?: Mood;
  action?: RobotAction;
  /** Kecepatan gerak horizontal (0..1) untuk mengatur ayunan langkah */
  speed?: number;
};

export function Robot({
  className = "",
  mood = "happy",
  action = "idle",
  speed = 0,
}: RobotProps) {
  const eyes =
    mood === "cheer" || action === "victory"
      ? EYES_CHEER
      : mood === "sad" || action === "hurt"
        ? EYES_SAD
        : mood === "wow" || action === "dash" || action === "doubleJump"
          ? EYES_WOW
          : EYES_HAPPY;

  const isMoving = action === "walk" || action === "run";
  const isAir = action === "jump" || action === "doubleJump" || action === "fall";
  const isDash = action === "dash";

  const style = {
    "--robot-cycle": isMoving ? `${Math.max(0.26, 0.48 - speed * 0.18)}s` : "2.2s",
  } as CSSProperties;

  return (
    <svg
      viewBox="0 0 56 63"
      shapeRendering="crispEdges"
      className={`robot-rig robot-act-${action} ${className}`}
      style={style}
      aria-hidden="true"
    >
      {/* Bayangan di tanah */}
      {!isAir && (
        <ellipse
          cx="27"
          cy="61"
          rx={action === "crouch" ? 19 : 17}
          ry="2"
          fill="rgba(22, 18, 36, 0.38)"
          className="robot-shadow"
        />
      )}

      {/* Efek garis cepat saat Dash */}
      {isDash && (
        <g className="robot-dash-trail" opacity="0.65">
          <rect x="0" y="14" width="12" height="2" fill="#3cf6ff" />
          <rect x="0" y="27" width="15" height="3" fill="#ffd54f" />
          <rect x="1" y="40" width="11" height="2" fill="#3cf6ff" />
          <rect x="3" y="51" width="10" height="2" fill="#ffffff" />
        </g>
      )}

      {/* Semburan api jet di bawah sepatu saat Lompat / Lompat Ganda / Dash */}
      {(action === "jump" || action === "doubleJump" || action === "dash") && (
        <g className="robot-jet">
          <rect x="14" y="58" width="7" height="3" fill="#ff9000" />
          <rect x="15" y="58" width="5" height="5" fill="#ffe436" />
          <rect x="16" y="59" width="3" height="3" fill="#3cf6ff" />
          <rect x="33" y="58" width="7" height="3" fill="#ff9000" />
          <rect x="34" y="58" width="5" height="5" fill="#ffe436" />
          <rect x="35" y="59" width="3" height="3" fill="#3cf6ff" />
        </g>
      )}

      <g className="robot-body-root">
        {/* 1. Lengan belakang (kanan layar — kepalan terangkat) */}
        <g className="robot-part robot-back-arm">
          <PixelLayer spans={BACK_UPPER_ARM} />
          <PixelLayer spans={BACK_ARM} />
        </g>

        {/* 2. Kaki belakang (kanan layar) */}
        <g className="robot-part robot-back-leg">
          <PixelLayer spans={BACK_LEG} />
        </g>

        {/* 3. Torso / Dada */}
        <g className="robot-part robot-torso">
          <PixelLayer spans={TORSO} />
        </g>

        {/* 4. Kepala / Helm & Visor */}
        <g className="robot-part robot-head">
          <PixelLayer spans={HEAD_BASE} />
          <g className="robot-eyes">
            <PixelLayer spans={eyes} />
          </g>
        </g>

        {/* 5. Kaki depan (kiri layar) */}
        <g className="robot-part robot-front-leg">
          <PixelLayer spans={FRONT_LEG} />
        </g>

        {/* 6. Lengan depan (kiri layar — pelindung bahu + lengan) */}
        <g className="robot-part robot-front-arm">
          <PixelLayer spans={FRONT_ARM} />
        </g>
      </g>

      {/* Kepulan debu piksel saat berlari atau mendarat */}
      {(isMoving || action === "land") && (
        <g className="robot-dust">
          <rect x="5" y="57" width="4" height="3" fill="#fff6d0" opacity="0.88" />
          <rect x="2" y="55" width="3" height="3" fill="#ffffff" opacity="0.7" />
          {action === "land" && (
            <>
              <rect x="44" y="57" width="4" height="3" fill="#fff6d0" opacity="0.88" />
              <rect x="48" y="55" width="3" height="3" fill="#ffffff" opacity="0.7" />
            </>
          )}
        </g>
      )}

      {/* Efek kilatan energi saat aksi pukulan / selebrasi */}
      {(action === "attack" || action === "victory") && (
        <g className="robot-spark">
          <rect x="46" y="11" width="5" height="2" fill="#fff675" />
          <rect x="48" y="9" width="2" height="6" fill="#3cf6ff" />
          <rect x="44" y="7" width="2" height="2" fill="#ffffff" />
        </g>
      )}
    </svg>
  );
}
