import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Avatar, BackBtn, Btn, Frame, Ic, Logo, Pearl, Plaque, Robot, SHIRTS, TopBar } from "../ui";
import {
  PEARL_TARGET, SOAL_TARGET, START_X, badgeCount, emptyIsland, playMem, unlocked, useGame, withIsland,
} from "../game/store";
import { ISLANDS } from "../game/data";
import { audio } from "../game/audio";
import hero from "../assets/hero-island.jpg";
import beach from "../assets/beach-scene.jpg";
import mapImg from "../assets/island-map.jpg";

/* ============ 1. SPLASH ============ */
export function Splash() {
  const { reset, player } = useGame();
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setP((v) => Math.min(100, v + 4)), 55);
    return () => window.clearInterval(t);
  }, []);
  const ready = p >= 100;
  const lama = Boolean(player.nama.trim() && player.kelas.trim());

  return (
    <Frame>
      <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a4d7a]/45 via-[#0a4d7a]/5 to-[#062a45]/85" />
      <div className="relative mx-auto mt-6 w-fit text-center">
        <p className="ol-sm text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#fff3c4]">Kartu berburu Poin</p>
        <div className="mt-1">
          <Logo size={42} />
        </div>
        <div className="wood mx-auto mt-2 w-fit rounded-lg px-4 py-[3px]">
          <span className="font-display text-[13px] tracking-[0.16em] text-[#fff3c4]">EKSPEDISI PULAU MISTERI</span>
        </div>
        <p className="ol-sm mt-2 text-[10px] font-bold tracking-wide text-white">created by: widodo guru sd</p>
      </div>
      <Robot className="anim-float absolute bottom-[58px] left-3 w-[88px] drop-shadow-[0_6px_0_rgba(0,0,0,0.28)]" action="victory" />
      <div className="absolute bottom-4 left-1/2 w-[260px] -translate-x-1/2 text-center">
        {ready ? (
          <>
            <Btn
              tone="green"
              onClick={() => {
                audio.unlock();
                reset("identitas");
              }}
              className="px-9 py-2 font-display text-[19px] tracking-wide"
            >
              <span className="flex items-center gap-2">
                <Ic n="play" className="h-4 w-4" /> {lama ? "LANJUTKAN" : "MULAI"}
              </span>
            </Btn>
            <div className="ol-sm mt-2 text-[11px] font-extrabold text-white">
              {lama ? `Selamat datang lagi, ${player.nama}!` : "Game matematika untuk kelas 2 SD"}
            </div>
          </>
        ) : (
          <>
            <div className="h-5 overflow-hidden rounded-full border-[3px] border-[#2b1b0e] bg-[#062a45]/90">
              <div className="h-full bg-gradient-to-b from-[#9dffbe] to-[#37c871]" style={{ width: `${p}%` }} />
            </div>
            <div className="ol-sm mt-1 text-[11px] font-extrabold text-white">Loading... {p}%</div>
          </>
        )}
      </div>
    </Frame>
  );
}

/* ============ IDENTITAS PEMAIN ============ */
export function Identitas() {
  const { enterPlayer, reset } = useGame();
  const [nama, setNama] = useState("");
  const [kelas, setKelas] = useState("");
  const [error, setError] = useState("");

  const masuk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nama.trim() || !kelas.trim()) {
      setError("Isi nama dan kelas terlebih dahulu, ya!");
      return;
    }
    enterPlayer(nama, kelas);
    reset("menu");
  };

  return (
    <Frame>
      <img src={beach} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#08324f]/65" />
      <div className="absolute left-2 top-2 z-10">
        <BackBtn onClick={() => reset("splash")} />
      </div>
      <div className="parch absolute left-1/2 top-1/2 w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-2xl px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 shrink-0" />
          <div>
            <h1 className="font-display text-[20px] leading-tight text-[#5b3212]">Halo, Petualang!</h1>
            <p className="text-[11px] font-bold leading-tight text-[#80603c]">Isi nama dan kelas sebelum mulai bermain.</p>
          </div>
        </div>
        <form onSubmit={masuk} noValidate className="mt-2.5 space-y-1.5">
          <label className="block text-[11px] font-extrabold text-[#5b3212]">
            Nama pemain
            <input
              name="nama"
              value={nama}
              onChange={(e) => { setNama(e.target.value); setError(""); }}
              maxLength={14}
              autoComplete="given-name"
              placeholder="Masukkan namamu"
              required
              className="mt-[2px] block w-full rounded-lg border-[3px] border-[#ad8552] bg-white px-2 py-[3px] text-[15px] font-bold text-[#2b1b0e] outline-none focus:border-[#2fa7e8]"
            />
          </label>
          <label className="block text-[11px] font-extrabold text-[#5b3212]">
            Kelas
            <input
              name="kelas"
              value={kelas}
              onChange={(e) => { setKelas(e.target.value); setError(""); }}
              maxLength={6}
              autoComplete="off"
              placeholder="Contoh: 2B"
              required
              className="mt-[2px] block w-full rounded-lg border-[3px] border-[#ad8552] bg-white px-2 py-[3px] text-[15px] font-bold text-[#2b1b0e] outline-none focus:border-[#2fa7e8]"
            />
          </label>
          <p className="min-h-[14px] text-center text-[10px] font-bold text-[#a34236]" role="status">
            {error || "Gunakan nama dan kelas yang sama untuk melanjutkan progresmu."}
          </p>
          <button type="submit" className="btn3d flex w-full items-center justify-center gap-2 bg-[#37c871] py-[6px] text-[14px] font-extrabold text-white">
            <Ic n="play" className="h-3.5 w-3.5" /> Mulai Petualangan
          </button>
        </form>
      </div>
    </Frame>
  );
}

/* ============ 2. MENU UTAMA ============ */
function MenuRow({ tone, icon, children, onClick }: { tone: string; icon: string; children: ReactNode; onClick: () => void }) {
  return (
    <Btn tone={tone} onClick={onClick} className="flex w-full items-center gap-2 px-2.5 py-[7px] text-left text-[15px] leading-none">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/30">
        <Ic n={icon} className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1">{children}</span>
      <Ic n="right" className="h-4 w-4" />
    </Btn>
  );
}

export function Menu() {
  const { go, player } = useGame();
  const [guruOpen, setGuruOpen] = useState(false);
  return (
    <Frame>
      <img src={beach} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#0b6ea8]/35" />
      <div
        className="absolute top-2 z-20 flex items-center gap-1.5 rounded-full border-[3px] border-[#2b1b0e] bg-white/95 py-[2px] pl-[3px] pr-2.5 shadow-[0_3px_0_rgba(43,27,14,0.45)]"
        style={{ left: "calc(8px - var(--bleed-x, 0px))" }}
      >
        <Avatar className="h-6 w-6" shirt={SHIRTS[player.avatar % SHIRTS.length]} />
        <span className="text-[12px] font-extrabold text-[#2b1b0e]">Halo, {player.nama || "Petualang"}!</span>
        <Ic n="star" className="ml-1 h-3.5 w-3.5 text-[#ff9f1c]" />
        <span className="font-display text-[12px] tabular-nums">{player.poin}</span>
      </div>
      <div className="relative flex h-full items-center gap-2 px-3 pb-3 pt-9">
        <Robot className="anim-float w-[144px] shrink-0 drop-shadow-[0_8px_0_rgba(0,0,0,0.28)]" action="idle" />
        <div className="flex flex-1 flex-col gap-[9px]">
          <MenuRow tone="green" icon="play" onClick={() => go("peta")}>Mulai Petualangan</MenuRow>
          <MenuRow tone="blue" icon="users" onClick={() => go("profil")}>Profil Pemain</MenuRow>
          <MenuRow tone="orange" icon="bolt" onClick={() => go("senjata")}>Gudang Senjata</MenuRow>
          <MenuRow tone="purple" icon="book" onClick={() => go("panduan")}>Panduan</MenuRow>
          <MenuRow tone="pink" icon="chart" onClick={() => setGuruOpen(true)}>Untuk Guru</MenuRow>
        </div>
      </div>
      {guruOpen && <GuruGate onClose={() => setGuruOpen(false)} onSuccess={() => { setGuruOpen(false); go("guru"); }} />}
      <div className="absolute top-2 z-20" style={{ right: "calc(8px - var(--bleed-x, 0px))" }}>
        <Btn tone="yellow" onClick={() => go("setelan")} ariaLabel="Pengaturan" className="grid h-8 w-8 place-items-center">
          <Ic n="gear" className="h-4 w-4" />
        </Btn>
      </div>
    </Frame>
  );
}

/* ============ GERBANG PASSWORD GURU ============ */
function GuruGate({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { guru, notify } = useGame();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (input !== guru.password) {
      setError("Password salah. Hanya guru yang boleh masuk.");
      notify("Password guru salah");
      return;
    }
    onSuccess();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Password Menu Guru"
      className="absolute inset-0 z-40 grid place-items-center bg-[#06182b]/75 p-3"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="parch w-[300px] rounded-2xl px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border-[3px] border-[#2b1b0e] bg-[#e53935] text-white">
            <Ic n="lock" className="h-5 w-5" />
          </span>
          <div>
            <div className="font-display text-[17px] leading-none text-[#2b1b0e]">Menu Guru</div>
            <div className="text-[10px] font-bold text-[#8a6a4a]">Masukkan password untuk melanjutkan</div>
          </div>
        </div>
        <label className="mt-2.5 block text-[11px] font-extrabold text-[#5b3212]">
          Password Guru
          <input
            type="password"
            inputMode="numeric"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            placeholder="Password"
            autoFocus
            className="mt-[2px] block w-full rounded-lg border-[3px] border-[#ad8552] bg-white px-2 py-[4px] text-[15px] font-bold tracking-[0.2em] text-[#2b1b0e] outline-none focus:border-[#e53935]"
          />
        </label>
        <p className="min-h-[14px] text-[10px] font-bold text-[#a34236]" role="alert">{error}</p>
        <div className="mt-1 flex gap-2">
          <button type="submit" className="btn3d flex-1 bg-[#37c871] py-[6px] text-[13px] font-extrabold text-white">
            Masuk
          </button>
          <Btn tone="white" onClick={onClose} className="flex-1 px-3 py-[6px] text-[13px]">Batal</Btn>
        </div>
      </form>
    </div>
  );
}

/* ============ 3. PROFIL PEMAIN ============ */
function StatBox({ icon, value, label, color }: { icon: string; value: ReactNode; label: string; color: string }) {
  return (
    <div className="rounded-xl border-[3px] border-[#4a2a12] bg-white px-1 py-1 text-center shadow-[0_3px_0_rgba(43,27,14,0.3)]">
      <div className="mx-auto grid h-6 w-6 place-items-center rounded-full border-[3px] border-[#2b1b0e]" style={{ background: color }}>
        <Ic n={icon} className="h-3 w-3 text-white" />
      </div>
      <div className="mt-[3px] font-display text-[16px] leading-none tabular-nums text-[#2b1b0e]">{value}</div>
      <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#8a6a4a]">{label}</div>
    </div>
  );
}

export function Profil() {
  const { player, updatePlayer, back, go } = useGame();
  const field = "min-w-0 flex-1 bg-transparent font-display text-[15px] text-[#2b1b0e] outline-none";
  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#5cc3f5] via-[#9fe0ff] to-[#dff4ff]" />
      <div className="pixgrid absolute inset-0" />
      <TopBar title="Profil Pemain" onBack={back} />
      <div className="parch absolute inset-x-4 bottom-3 top-[50px] rounded-2xl px-3 py-2.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Ganti warna baju"
            onClick={() => updatePlayer((p) => ({ ...p, avatar: (p.avatar + 1) % SHIRTS.length }))}
            className="relative shrink-0"
          >
            <Avatar className="h-[70px] w-[70px]" shirt={SHIRTS[player.avatar % SHIRTS.length]} />
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-[3px] border-[#2b1b0e] bg-[#ffd54f]">
              <Ic n="refresh" className="h-3 w-3" />
            </span>
          </button>
          <div className="flex-1 space-y-1.5">
            <label className="flex items-center gap-2 rounded-lg border-[3px] border-[#c9a24b] bg-white px-2 py-1">
              <span className="text-[13px] font-bold text-[#6b5233]">Nama :</span>
              <input
                value={player.nama}
                maxLength={14}
                onChange={(e) => updatePlayer((p) => ({ ...p, nama: e.target.value }))}
                className={field}
              />
              <Ic n="pencil" className="h-3.5 w-3.5 shrink-0 text-[#a9673a]" />
            </label>
            <label className="flex items-center gap-2 rounded-lg border-[3px] border-[#c9a24b] bg-white px-2 py-1">
              <span className="text-[13px] font-bold text-[#6b5233]">Kelas :</span>
              <input
                value={player.kelas}
                maxLength={6}
                onChange={(e) => updatePlayer((p) => ({ ...p, kelas: e.target.value }))}
                className={field}
              />
              <Ic n="pencil" className="h-3.5 w-3.5 shrink-0 text-[#a9673a]" />
            </label>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          <StatBox icon="star" value={player.poin} label="Poin" color="#ffb300" />
          <StatBox icon="crystal" value={player.kristal} label="Kristal" color="#7c3aed" />
          <StatBox icon="medal" value={badgeCount(player)} label="Badge" color="#ff8a3d" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Btn tone="orange" onClick={() => go("badge")} className="px-2 py-[6px] text-[13px]">
            <span className="flex items-center justify-center gap-1.5"><Ic n="medal" className="h-4 w-4" /> Koleksi Badge</span>
          </Btn>
          <Btn tone="green" onClick={() => go("progres")} className="px-2 py-[6px] text-[13px]">
            <span className="flex items-center justify-center gap-1.5"><Ic n="chart" className="h-4 w-4" /> Progres</span>
          </Btn>
        </div>
      </div>
    </Frame>
  );
}

/* ============ PANDUAN ============ */
const PANDUAN = [
  { icon: "right", c: "#2fa7e8", judul: "Jelajahi Pulau", isi: "Gerakkan robot dengan tombol ◀ ▶ dan lompat dengan ▲. Di komputer, pakai tombol panah dan spasi." },
  { icon: "fist", c: "#ff8a3d", judul: "Hadapi Robot Anjing", isi: "Kalahkan penjaga untuk membuka koin dan mutiara. Pukul (J), tendang (K), atau tembak (L). Laser terbuka setelah 100 poin terkumpul." },
  { icon: "bolt", c: "#2fa7e8", judul: "Gudang Senjata", isi: "Laser terbuka otomatis tanpa mengurangi poin. Tukarkan 500 poin untuk plasma yang lebih kuat, lalu pilih senjata sebelum bertarung." },
  { icon: "qr", c: "#37c871", judul: "Cari Pos Kartu", isi: "Dekati papan QR lalu tekan Scan Kartu. Tiga kartu — angka, tanda, angka — berubah menjadi satu soal." },
  { icon: "star", c: "#ffb300", judul: "Jawab & Kumpulkan", isi: "Jawaban benar memberi poin dan kristal. Jawaban salah mengurangi 1 hati. Kartu Bintang memberi bonus, Kartu Zonk berarti coba lagi!" },
  { icon: "chest", c: "#a9673a", judul: "Buka Peti Harta", isi: "Kumpulkan 5 mutiara, jawab 10 soal, dan temukan kunci. Lalu buka peti di ujung pulau untuk mendapat badge." },
];

export function Panduan() {
  const { back, go } = useGame();
  const [i, setI] = useState(0);
  const p = PANDUAN[i];
  const last = i === PANDUAN.length - 1;
  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#7c3aed] via-[#9f7aea] to-[#d6bcfa]" />
      <div className="pixgrid absolute inset-0" />
      <TopBar title="Panduan Bermain" onBack={back} />
      <Robot className="anim-float absolute bottom-5 left-3 w-[106px] drop-shadow-[0_6px_0_rgba(0,0,0,0.28)]" mood="cheer" action="wave" />
      <div className="parch absolute bottom-4 right-4 top-[52px] w-[330px] rounded-2xl px-4 py-3">
        <div key={i} className="anim-pop">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-[3px] border-[#2b1b0e]" style={{ background: p.c }}>
              <Ic n={p.icon} className="h-5 w-5 text-white" />
            </span>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9673a]">Langkah {i + 1} dari {PANDUAN.length}</div>
              <div className="font-display text-[19px] leading-tight text-[#2b1b0e]">{p.judul}</div>
            </div>
          </div>
          <p className="mt-2.5 min-h-[88px] text-[14px] font-semibold leading-snug text-[#5b3212]">{p.isi}</p>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="flex gap-1">
            {PANDUAN.map((x, k) => (
              <span key={x.judul} className={`h-2.5 w-2.5 rounded-full border-2 border-[#2b1b0e] ${k === i ? "bg-[#7c3aed]" : "bg-white"}`} />
            ))}
          </span>
          <span className="ml-auto flex gap-2">
            {i > 0 && (
              <Btn tone="white" onClick={() => setI(i - 1)} className="px-3 py-[5px] text-[13px]">Kembali</Btn>
            )}
            <Btn tone="green" onClick={() => (last ? go("peta") : setI(i + 1))} className="px-4 py-[5px] text-[13px]">
              {last ? "Ayo Main!" : "Lanjut"}
            </Btn>
          </span>
        </div>
      </div>
    </Frame>
  );
}

/* ============ 4. PETA LIMA PULAU ============ */
export function Peta() {
  const { player, back, go, setSession, notify } = useGame();
  const next = ISLANDS.findIndex((_, i) => unlocked(player, i) && !player.islands[i].chest);
  return (
    <Frame>
      <img src={mapImg} alt="" className="absolute inset-0 h-full w-full object-cover blur-[2px] brightness-95" />
      <img src={mapImg} alt="" className="pointer-events-none absolute left-0 top-0 h-full w-full object-cover" />
      <div
        className="absolute top-2 z-20 flex items-center gap-2"
        style={{ left: "calc(8px - var(--bleed-x, 0px))" }}
      >
        <BackBtn onClick={back} />
        <Plaque>Peta Petualangan</Plaque>
      </div>
      <div
        className="absolute top-2 z-20 flex items-center gap-1.5 rounded-full border-[3px] border-[#2b1b0e] bg-white/95 px-2 py-[3px] shadow-[0_3px_0_rgba(43,27,14,0.45)]"
        style={{ right: "calc(8px - var(--bleed-x, 0px))" }}
      >
        <Ic n="medal" className="h-4 w-4 text-[#ff8a3d]" />
        <span className="font-display text-[13px] tabular-nums">{badgeCount(player)} / 5</span>
      </div>
      {ISLANDS.map((isl, i) => {
        const open = unlocked(player, i);
        const done = player.islands[i].chest;
        return (
          <button
            key={isl.id}
            type="button"
            onClick={() => {
              if (!open) {
                notify(`Selesaikan ${ISLANDS[i - 1].name} dulu`);
                return;
              }
              setSession({ island: i });
              go("level");
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
            style={{ left: `${isl.mx}%`, top: `${isl.my}%` }}
          >
            {i === next && (
              <span className="anim-bob absolute -top-5 left-1/2 -ml-[32px] w-[64px] whitespace-nowrap rounded-full border-2 border-[#2b1b0e] bg-[#ffd54f] text-center text-[8px] font-black uppercase leading-[13px] tracking-wider text-[#2b1b0e]">
                Main di sini
              </span>
            )}
            <span
              className={`flex items-center gap-1 rounded-full border-[3px] border-[#2b1b0e] px-1.5 py-[3px] shadow-[0_3px_0_rgba(43,27,14,0.45)] ${
                open ? "bg-white" : "bg-[#d5d9de]"
              }`}
            >
              <span
                className={`grid h-4 w-4 place-items-center rounded-full text-[9px] font-black leading-none text-white ${
                  done ? "bg-[#22a75b]" : open ? "bg-[#e53935]" : "bg-[#7b8794]"
                }`}
              >
                {done ? <Ic n="check" className="h-2.5 w-2.5" /> : open ? i + 1 : <Ic n="lock" className="h-2.5 w-2.5" />}
              </span>
              <span className={`whitespace-nowrap text-[10px] font-extrabold leading-none ${open ? "text-[#2b1b0e]" : "text-[#5f6b78]"}`}>
                {isl.name}
              </span>
              {open && (
                <span className="font-display text-[9px] tabular-nums text-[#7c3aed]">{player.islands[i].soal}/{SOAL_TARGET}</span>
              )}
            </span>
          </button>
        );
      })}
    </Frame>
  );
}

/* ============ 5. PILIH LEVEL PULAU ============ */
export function LevelSelect() {
  const { player, session, back, go, setSession, updatePlayer } = useGame();
  const [sel, setSel] = useState(session.island);
  const isl = ISLANDS[sel];
  const prog = player.islands[sel];
  const open = unlocked(player, sel);

  const start = () => {
    if (playMem.island !== sel) {
      playMem.island = sel;
      playMem.x = START_X;
    }
    setSession({ island: sel, hearts: 3, cards: null, q: null, result: null });
    go("main");
  };
  const replay = () => {
    updatePlayer((p) => withIsland(p, sel, { ...emptyIsland(), chest: true, claimed: true }));
    playMem.island = sel;
    playMem.x = START_X;
    setSession({ island: sel, hearts: 3, cards: null, q: null, result: null });
    go("main");
  };
  const arrow = "btn3d absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center bg-[#ffd54f] text-[#2b1b0e]";

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#5cc3f5] to-[#cdeeff]" />
      <div className="absolute inset-x-0 top-2 z-20 flex flex-col items-center gap-[2px]">
        <Plaque>{isl.name}</Plaque>
        <span className="rounded-full border-[2px] border-[#2b1b0e] bg-white px-2 py-[1px] text-[10px] font-extrabold">
          (Level {sel + 1} : {isl.topicLabel})
        </span>
      </div>
      <div className="absolute left-2 top-2 z-30">
        <BackBtn onClick={back} />
      </div>
      <div className="absolute inset-x-3 bottom-3 top-[62px] overflow-hidden rounded-2xl border-[4px] border-[#2b1b0e] shadow-[0_5px_0_rgba(43,27,14,0.4)]">
        <img key={sel} src={isl.img} alt="" className={`anim-pop h-full w-full object-cover ${open ? "" : "grayscale"}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08324f]/80 via-transparent to-transparent" />
        {!open && (
          <div className="absolute inset-0 grid place-items-center bg-[#08324f]/55">
            <div className="rounded-xl border-[3px] border-[#2b1b0e] bg-white px-3 py-2 text-center">
              <Ic n="lock" className="mx-auto h-6 w-6 text-[#7b8794]" />
              <div className="text-[12px] font-extrabold text-[#2b1b0e]">Selesaikan {ISLANDS[sel - 1].name} dulu</div>
            </div>
          </div>
        )}
        <button type="button" aria-label="Pulau sebelumnya" onClick={() => setSel((v) => (v + 4) % 5)} className={`${arrow} left-2`}>
          <Ic n="left" className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Pulau berikutnya" onClick={() => setSel((v) => (v + 1) % 5)} className={`${arrow} right-2`}>
          <Ic n="right" className="h-5 w-5" />
        </button>
        {open && (
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border-[3px] border-[#2b1b0e] bg-white px-2 py-[2px] text-[11px] font-extrabold">
              Misi : {prog.soal} / {SOAL_TARGET}
              <span className="flex items-center gap-[3px] border-l-2 border-[#d9cbb3] pl-1.5">
                <Pearl size={10} /> {prog.pearls.length}/{PEARL_TARGET}
              </span>
              <Ic n="key" className={`h-3.5 w-3.5 ${prog.key ? "text-[#e09b00]" : "text-[#c9c1b4]"}`} />
            </span>
            <Btn tone="green" onClick={start} className="px-4 py-[5px] text-[13px]">
              <span className="flex items-center gap-1"><Ic n="play" className="h-3 w-3" /> {prog.chest ? "Masuk" : prog.soal > 0 ? "Lanjut" : "Mulai"}</span>
            </Btn>
            {prog.chest && (
              <Btn tone="yellow" onClick={replay} className="px-3 py-[5px] text-[13px]">
                <span className="flex items-center gap-1"><Ic n="refresh" className="h-3 w-3" /> Ulangi</span>
              </Btn>
            )}
          </div>
        )}
        {prog.chest && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full border-[3px] border-[#2b1b0e] bg-[#22a75b] px-2 py-[2px] text-[10px] font-extrabold text-white">
            <Ic n="medal" className="h-3 w-3" /> {isl.badge}
          </span>
        )}
      </div>
    </Frame>
  );
}
