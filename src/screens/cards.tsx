import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import jsQR from "jsqr";
import { QRCodeSVG } from "qrcode.react";
import { Btn, Chip, Frame, Ic, Robot, TopBar } from "../ui";
import { PER_STATION, SOAL_TARGET, START_X, badgeCount, playMem, useGame, withIsland } from "../game/store";
import { ISLANDS } from "../game/data";
import { REWARD, buildQuestion, drawCards, fillQ, type Cards } from "../game/questions";
import { audio } from "../game/audio";
import chestImg from "../assets/treasure-chest.jpg";

/* ---------- konfeti ---------- */
const KONFETI = ["#ffd54f", "#ff4f91", "#37c871", "#2fa7e8", "#7c3aed"];
export function Confetti() {
  const { settings } = useGame();
  const bits = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        l: Math.random() * 100,
        d: Math.random() * 0.7,
        t: 1.5 + Math.random() * 1.3,
        c: KONFETI[i % KONFETI.length],
      })),
    [],
  );
  if (!settings.efek) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti"
          style={{ left: `${b.l}%`, background: b.c, animationDelay: `${b.d}s`, animationDuration: `${b.t}s` }}
        />
      ))}
    </div>
  );
}

/** Isi QR kartu cetak: IE|N|15, IE|O|+, IE|S|BINTANG, IE|Z|ZONK */
function parseCode(raw: string): { t: string; v: string } | null {
  const m = /^IE\|([NOSZ])\|(.*)$/.exec(raw.trim());
  if (!m) return null;
  let v = m[2];
  if (m[1] === "O") v = v === "-" ? "−" : v === "x" || v === "*" ? "×" : v;
  return { t: m[1], v };
}

function CardFace({ v, big = false }: { v: string; big?: boolean }) {
  const isNum = /^\d+$/.test(v);
  const label = v === "<>" ? "< >" : v;
  return (
    <div
      className={`grid place-items-center rounded-xl border-[4px] bg-white shadow-[0_5px_0_rgba(43,27,14,0.4)] ${
        isNum ? "border-[#2fa7e8]" : "border-[#e53935]"
      } ${big ? "h-[78px] min-w-[70px] px-2" : "h-[44px] w-[40px] rounded-lg border-[3px] shadow-[0_3px_0_rgba(43,27,14,0.4)]"}`}
    >
      <span
        className={`whitespace-nowrap font-display leading-none tabular-nums ${isNum ? "text-[#2b1b0e]" : "text-[#e53935]"} ${
          big ? (label.length > 2 ? "text-[30px]" : "text-[42px]") : label.length > 2 ? "text-[13px]" : "text-[20px]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* ============ 8. SCAN QR KARTU ============ */
export function Scan() {
  const { session, settings, player, setSession, replace, back } = useGame();
  const isl = ISLANDS[session.island];
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null]);
  const [busy, setBusy] = useState(false);
  const [cam, setCam] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef<(raw: string) => void>(() => undefined);
  const doneRef = useRef(false);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const finish = (cards: Cards) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setBusy(true);
    setSession({ cards, lastSpecial: false });
    later(() => replace("kartu"), 700);
  };
  const special = (kind: "bonus" | "zonk") => {
    if (doneRef.current) return;
    doneRef.current = true;
    setSession({ lastSpecial: true });
    replace(kind);
  };

  const scanDigital = () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    audio.sfx("scan");
    const r = Math.random();
    const sp = !session.lastSpecial && player.logs.length > 0 && r < 0.24;
    later(() => {
      if (sp) {
        special(r < 0.12 ? "zonk" : "bonus");
        return;
      }
      const cards = drawCards(isl.topic, settings.level);
      cards.forEach((c, i) =>
        later(() => {
          setSlots((s) => s.map((v, k) => (k === i ? c : v)));
          audio.sfx("card");
        }, i * 260),
      );
      later(() => finish(cards), 3 * 260);
    }, 850);
  };

  onCodeRef.current = (raw: string) => {
    if (doneRef.current) return;
    const c = parseCode(raw);
    if (!c) {
      setMsg("Ini bukan kartu Island Explorer");
      return;
    }
    audio.sfx("card");
    if (c.t === "S") {
      special("bonus");
      return;
    }
    if (c.t === "Z") {
      special("zonk");
      return;
    }
    const next = slots.slice();
    if (c.t === "N") {
      const i = next[0] === null ? 0 : next[2] === null ? 2 : -1;
      if (i < 0) {
        setMsg("Kartu angka sudah dua. Sekarang pindai kartu tanda.");
        return;
      }
      next[i] = c.v;
    } else {
      next[1] = c.v;
    }
    setSlots(next);
    setMsg(`Kartu ${c.v} terbaca!`);
    if (next.every((v) => v !== null)) finish(next as Cards);
  };

  useEffect(() => {
    if (!cam) return;
    let stream: MediaStream | null = null;
    let timer = 0;
    let stop = false;
    let lastCode = "";
    let lastAt = 0;
    const canvas = document.createElement("canvas");

    const run = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("unsupported");
        const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        stream = ms;
        if (stop) {
          ms.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = ms;
        await v.play();
        timer = window.setInterval(() => {
          if (!v.videoWidth) return;
          const w = 320;
          const h = Math.round((320 * v.videoHeight) / v.videoWidth);
          canvas.width = w;
          canvas.height = h;
          const cx = canvas.getContext("2d", { willReadFrequently: true });
          if (!cx) return;
          cx.drawImage(v, 0, 0, w, h);
          const res = jsQR(cx.getImageData(0, 0, w, h).data, w, h);
          if (!res || !res.data) return;
          const now = Date.now();
          if (res.data === lastCode && now - lastAt < 2500) return;
          lastCode = res.data;
          lastAt = now;
          onCodeRef.current(res.data);
        }, 250);
      } catch {
        setMsg("Kamera tidak bisa dibuka di sini. Pakai tombol Scan Sekarang, ya!");
        setCam(false);
      }
    };
    void run();

    return () => {
      stop = true;
      window.clearInterval(timer);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [cam]);

  return (
    <Frame className="bg-[#0d2b3f]">
      <img src={isl.img} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-[2px]" />
      <div className="absolute inset-0 bg-[#0d2b3f]/60" />
      <TopBar title="Scan Kartu Berburu Poin" onBack={back} />

      <div className="absolute left-1/2 top-[46px] h-[116px] w-[116px] -translate-x-1/2">
        {[
          "left-0 top-0 border-l-4 border-t-4 rounded-tl-lg",
          "right-0 top-0 border-r-4 border-t-4 rounded-tr-lg",
          "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-lg",
          "right-0 bottom-0 border-r-4 border-b-4 rounded-br-lg",
        ].map((c) => (
          <span key={c} className={`absolute h-7 w-7 border-white ${c}`} />
        ))}
        <div className="absolute inset-3 overflow-hidden rounded-lg border-[4px] border-white bg-white">
          {cam ? (
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          ) : (
            <QRCodeSVG value="IE|N|15" size={82} level="M" className={`h-full w-full ${busy ? "" : "opacity-80"}`} />
          )}
        </div>
        <span className="anim-scan absolute left-2 right-2 h-[3px] rounded bg-[#37c871] shadow-[0_0_10px_#37c871]" />
      </div>

      <div className="absolute inset-x-0 top-[170px] flex items-center justify-center gap-2">
        {slots.map((v, i) =>
          v === null ? (
            <div
              key={i}
              className="grid h-[44px] w-[40px] place-items-center rounded-lg border-[3px] border-dashed border-white/70 font-display text-[16px] text-white/70"
            >
              {i === 1 ? "±" : "?"}
            </div>
          ) : (
            <div key={i} className="anim-pop">
              <CardFace v={v} />
            </div>
          ),
        )}
      </div>

      <div className="absolute inset-x-0 top-[220px] text-center text-[11px] font-extrabold text-white">
        {msg ??
          (cam
            ? "Arahkan kamera ke kartu: angka, tanda, lalu angka"
            : busy
              ? "Memindai kartu…"
              : `Pos ${session.station + 1} · ${isl.topicLabel} · tekan Scan untuk mengambil kartu`)}
      </div>

      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
        <Btn tone="green" onClick={scanDigital} className={`px-5 py-[7px] text-[14px] ${busy ? "opacity-60" : ""}`}>
          <span className="flex items-center gap-1.5">
            <Ic n="qr" className="h-4 w-4" /> Scan Sekarang
          </span>
        </Btn>
        <Btn
          tone={cam ? "yellow" : "white"}
          onClick={() => {
            if (busy) return;
            setMsg(null);
            setCam((c) => !c);
          }}
          className="px-3 py-[7px] text-[13px]"
        >
          <span className="flex items-center gap-1.5">
            <Ic n="camera" className="h-4 w-4" /> {cam ? "Matikan Kamera" : "Kartu Cetak"}
          </span>
        </Btn>
      </div>
    </Frame>
  );
}

/* ============ 9. KARTU TERPILIH ============ */
export function Kartu() {
  const { session, settings, player, setSession, updatePlayer, replace, back, notify } = useGame();
  const cards = session.cards;
  const isl = ISLANDS[session.island];

  const make = () => {
    if (!cards) return;
    const q = buildQuestion(cards);
    if (!q) {
      notify("Kartu tidak cocok, scan lagi ya");
      replace("scan");
      return;
    }
    setSession({ q });
    replace("soal");
  };
  const acak = () => {
    if (player.acak <= 0) return;
    updatePlayer((p) => ({ ...p, acak: Math.max(0, p.acak - 1) }));
    setSession({ cards: drawCards(isl.topic, settings.level) });
    audio.sfx("card");
  };

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#5cc3f5] via-[#9fe0ff] to-[#dff4ff]" />
      <div className="pixgrid absolute inset-0" />
      <TopBar
        title="Kartu Terpilih"
        onBack={back}
        right={
          <Btn tone="red" onClick={back} ariaLabel="Buang kartu" className="grid h-7 w-7 place-items-center">
            <Ic n="x" className="h-3.5 w-3.5" />
          </Btn>
        }
      />
      <div className="parch absolute inset-x-6 bottom-5 top-[56px] rounded-2xl px-3 py-3">
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2.5">
            {(cards ?? ["?", "+", "?"]).map((c, i) => (
              <div key={`${i}-${c}`} className="anim-pop" style={{ animationDelay: `${i * 90}ms` }}>
                <CardFace v={c} big />
              </div>
            ))}
          </div>
          <span className="rounded-full border-[3px] border-[#2b1b0e] bg-[#fff8e6] px-3 py-[2px] text-[11px] font-extrabold text-[#6b5233]">
            Tiga kartu ini akan menjadi satu soal {isl.topicLabel.toLowerCase()}
          </span>
          <div className="flex items-center gap-2">
            <Btn tone="green" onClick={make} className="px-6 py-[7px] text-[15px]">
              <span className="flex items-center gap-1.5">
                <Ic n="play" className="h-3.5 w-3.5" /> Buat Soal
              </span>
            </Btn>
            {player.acak > 0 && (
              <Btn tone="purple" onClick={acak} className="px-3 py-[7px] text-[13px]">
                <span className="flex items-center gap-1.5">
                  <Ic n="shuffle" className="h-4 w-4" /> Acak ({player.acak})
                </span>
              </Btn>
            )}
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ============ 10. TANTANGAN SOAL ============ */
export function Soal() {
  const { session, player, settings, updatePlayer, setSession, replace, back } = useGame();
  const q = session.q;
  const [sel, setSel] = useState<string | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!q) {
    return (
      <Frame>
        <TopBar title="Tantangan Matematika" onBack={back} />
      </Frame>
    );
  }

  const answer = (v: string) => {
    if (sel !== null) return;
    setSel(v);
    const benar = v === q.answer;
    const ii = session.island;
    const stn = session.station;
    const now = player.islands[ii];
    const counts = benar && now.soal < SOAL_TARGET && now.stations[stn] < PER_STATION;
    const poin = benar ? REWARD[settings.level] : 0;
    const kristal = benar ? 2 : 0;
    const hearts = benar ? session.hearts : Math.max(0, session.hearts - 1);
    const text = fillQ(q, "□");

    updatePlayer((p) => {
      const it = p.islands[ii];
      const ok = benar && it.soal < SOAL_TARGET && it.stations[stn] < PER_STATION;
      const nextIsl = ok
        ? { ...it, soal: it.soal + 1, stations: it.stations.map((n, k) => (k === stn ? n + 1 : n)) }
        : it;
      return {
        ...withIsland(p, ii, nextIsl),
        poin: p.poin + poin,
        kristal: p.kristal + kristal,
        logs: [...p.logs, { t: Date.now(), pulau: ii, soal: text, jawab: v, benar }].slice(-400),
      };
    });
    setSession({
      hearts,
      result: { benar, pilih: v, poin, kristal, habis: hearts === 0, tuntas: counts && now.soal + 1 >= SOAL_TARGET },
    });
    audio.sfx(benar ? "correct" : "wrong");
    timer.current = window.setTimeout(() => replace("hasil"), 700);
  };

  const big = "font-display text-[38px] leading-none tabular-nums";

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#2fa7e8] via-[#7fd0f7] to-[#d6f0ff]" />
      <div className="pixgrid absolute inset-0" />
      <TopBar
        title="Tantangan Matematika"
        onBack={back}
        right={
          <span className="flex items-center gap-[2px] rounded-full border-[3px] border-[#2b1b0e] bg-white px-1.5 py-[3px]">
            {[0, 1, 2].map((h) => (
              <Ic key={h} n="heart" className={`h-3.5 w-3.5 ${h < session.hearts ? "text-[#e53935]" : "text-[#d9cbb3]"}`} />
            ))}
          </span>
        }
      />

      <div className="absolute left-2 top-[72px] w-[112px] text-center">
        <Robot
          className="anim-float mx-auto w-[100px] drop-shadow-[0_6px_0_rgba(0,0,0,0.28)]"
          mood={sel === null ? "wow" : sel === q.answer ? "cheer" : "sad"}
          action={sel === null ? "idle" : sel === q.answer ? "victory" : "hurt"}
        />
        <span className="ol-sm font-display text-[15px] text-[#ffef8f]">{sel === null ? "? ? ?" : sel === q.answer ? "Yes!" : "Ups…"}</span>
      </div>

      <div className="absolute right-3 top-[66px] w-[330px]">
        <div
          role="group"
          aria-label={`Soal: ${fillQ(q, "kotak")}`}
          className="flex items-center justify-center gap-2 rounded-2xl border-[4px] border-[#2b1b0e] bg-white px-2 py-3 shadow-[0_6px_0_rgba(43,27,14,0.35)]"
        >
          {q.tokens.map((t, i) =>
            t === null ? (
              <span
                key={i}
                className={`grid h-[50px] min-w-[54px] place-items-center rounded-lg border-[4px] border-dashed px-1 ${
                  sel === null
                    ? "border-[#8ec9ec] bg-[#eef8ff]"
                    : sel === q.answer
                      ? "border-[#37c871] bg-[#e9fff2]"
                      : "border-[#e53935] bg-[#ffecec]"
                }`}
              >
                <span className={`${big} text-[#2b1b0e]`}>{sel ?? ""}</span>
              </span>
            ) : (
              <span key={i} className={`${big} ${/^\d+$/.test(t) ? "text-[#2b1b0e]" : "text-[#e53935]"}`}>
                {t}
              </span>
            ),
          )}
        </div>

        <div className="mt-4 flex justify-center gap-3">
          {q.choices.map((v, i) => {
            const picked = sel === v;
            const show = sel !== null && v === q.answer;
            return (
              <Btn
                key={v}
                tone={show ? "green" : picked ? "red" : i === 1 ? "yellow" : "purple"}
                onClick={() => answer(v)}
                className={`h-[56px] min-w-[68px] px-2 font-display text-[30px] leading-none ${
                  sel !== null && !picked && !show ? "opacity-50" : ""
                }`}
              >
                {v}
              </Btn>
            );
          })}
        </div>
        <div className="ol-sm mt-3 text-center text-[12px] font-extrabold text-white">
          {q.choices[0] === "<" ? "Pilih tanda yang tepat: lebih kecil, sama, atau lebih besar" : "Pilih angka yang tepat untuk mengisi kotak"}
        </div>
      </div>
    </Frame>
  );
}

/* ============ 11. HASIL JAWABAN ============ */
export function Hasil() {
  const { session, player, back, setSession } = useGame();
  const { q, result } = session;
  if (!q || !result) {
    return (
      <Frame>
        <TopBar title="Hasil Jawaban" onBack={back} />
      </Frame>
    );
  }
  const ok = result.benar;
  const lanjut = () => {
    if (result.habis) {
      setSession({ hearts: 3 });
      playMem.x = START_X;
    }
    back();
  };
  const prog = player.islands[session.island];

  return (
    <Frame>
      <div className={`absolute inset-0 bg-gradient-to-b ${ok ? "from-[#7fd0f7] via-[#bde7ff] to-[#e8f8ff]" : "from-[#f6a5a5] via-[#ffd5d5] to-[#fff1f1]"}`} />
      <div className="pixgrid absolute inset-0" />
      {ok && <Confetti />}

      <div className="absolute left-[166px] top-[26px] -translate-x-1/2 -rotate-1">
        <div
          className={`rounded-lg border-[4px] border-[#2b1b0e] bg-gradient-to-b px-7 py-1.5 shadow-[0_5px_0_rgba(43,27,14,0.4)] ${
            ok ? "from-[#6ee79a] to-[#22a75b]" : "from-[#ff8a8a] to-[#d32f2f]"
          }`}
        >
          <span className="ol-sm whitespace-nowrap font-display text-[30px] leading-none text-white">{ok ? "Benar!" : "Belum Tepat"}</span>
        </div>
      </div>

      <div className="absolute left-4 top-[92px] w-[300px]">
        <div className="rounded-2xl border-[4px] border-[#2b1b0e] bg-white px-3 py-2.5 text-center shadow-[0_6px_0_rgba(43,27,14,0.35)]">
          <span className="whitespace-nowrap font-display text-[38px] leading-none tabular-nums text-[#2b1b0e]">
            {q.tokens.map((t, i) => (
              <span key={i} className={t === null ? (ok ? "text-[#22a75b]" : "text-[#d32f2f]") : ""}>
                {t ?? q.answer}
                {i < q.tokens.length - 1 ? " " : ""}
              </span>
            ))}
          </span>
        </div>

        {ok ? (
          <div className="mt-3 flex gap-2">
            <Chip icon={<Ic n="star" className="h-4 w-4 text-[#ff9f1c]" />} value={`+${result.poin} Poin`} className="bg-[#fff8e6]" />
            <Chip icon={<Ic n="crystal" className="h-4 w-4 text-[#7c3aed]" />} value={`+${result.kristal} Kristal`} className="bg-[#f3ecff]" />
          </div>
        ) : (
          <div className="mt-2.5 rounded-xl border-[3px] border-[#2b1b0e] bg-[#fff8e6] px-2.5 py-1.5 text-[12px] font-bold leading-snug text-[#5b3212]">
            Kamu memilih <b className="text-[#d32f2f]">{result.pilih}</b>. {q.hint}
          </div>
        )}

        <div className="mt-2 text-[11px] font-extrabold text-[#2b1b0e]">
          {ok
            ? result.tuntas
              ? "10 soal selesai! Cari kunci dan buka peti harta."
              : `Soal pulau ini: ${prog.soal} / ${SOAL_TARGET}`
            : result.habis
              ? "Hati habis! Robot istirahat dulu dan kembali ke awal pulau."
              : `Sisa hati: ${session.hearts}. Ayo coba kartu lain!`}
        </div>

        <div className="mt-2">
          <Btn tone={ok ? "green" : "yellow"} onClick={lanjut} className="px-6 py-[7px] text-[15px]">
            <span className="flex items-center gap-1.5">
              {ok ? "Lanjut" : "Coba Lagi"} <Ic n="right" className="h-3.5 w-3.5" />
            </span>
          </Btn>
        </div>
      </div>

      <Robot
        className="anim-float absolute bottom-4 right-3 w-[128px] drop-shadow-[0_8px_0_rgba(0,0,0,0.28)]"
        mood={ok ? "cheer" : "sad"}
        action={ok ? "victory" : "hurt"}
      />
    </Frame>
  );
}

/* ============ 12. BONUS BINTANG ============ */
export function Bonus() {
  const { updatePlayer, back, notify } = useGame();
  const [picked, setPicked] = useState<string[]>([]);
  const sisa = 2 - picked.length;
  useEffect(() => {
    audio.sfx("star");
  }, []);

  const opts = [
    { key: "poin", icon: "gift", label: "+10 Poin", tone: "pink" },
    { key: "langkah", icon: "fast", label: "Maju 6 Langkah", tone: "yellow" },
    { key: "acak", icon: "shuffle", label: "Acak Kartu 1 Kali", tone: "blue" },
  ];
  const choose = (k: string) => {
    if (sisa <= 0 || picked.includes(k)) return;
    setPicked((p) => [...p, k]);
    audio.sfx("coin");
    if (k === "poin") {
      updatePlayer((p) => ({ ...p, poin: p.poin + 10 }));
      notify("+10 Poin");
    } else if (k === "langkah") {
      playMem.x += 240;
      notify("Robot maju 6 langkah!");
    } else {
      updatePlayer((p) => ({ ...p, acak: p.acak + 1 }));
      notify("+1 Acak Kartu");
    }
  };

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#6d28d9] via-[#8b5cf6] to-[#c084fc]" />
      <Confetti />
      <TopBar title="Bonus Bintang" onBack={back} />
      <div className="absolute inset-x-5 top-[50px] text-center">
        <div className="wood inline-block rounded-lg px-5 py-1">
          <span className="ol-sm font-display text-[19px] tracking-wide text-[#ffd54f]">★ Kartu Bintang! ★</span>
        </div>
        <div className="mx-auto mt-1.5 w-fit rounded-full border-[3px] border-[#2b1b0e] bg-white px-3 py-[2px] text-[12px] font-extrabold">
          Pilih hadiahmu! · Sisa Kesempatan : <span className="font-display text-[14px] text-[#7c3aed]">{sisa}</span>
        </div>
      </div>
      <div className="absolute inset-x-8 top-[131px] space-y-[6px]">
        {opts.map((o) => {
          const on = picked.includes(o.key);
          return (
            <Btn
              key={o.key}
              tone={on ? "green" : o.tone}
              onClick={() => choose(o.key)}
              className={`flex w-full items-center gap-2 px-3 py-[4px] text-left text-[15px] ${!on && sisa === 0 ? "opacity-50" : ""}`}
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/30">
                <Ic n={o.icon} className="h-4 w-4" />
              </span>
              <span className="flex-1">{o.label}</span>
              {on && <Ic n="check" className="h-4 w-4" />}
            </Btn>
          );
        })}
      </div>
      <div className="absolute inset-x-0 bottom-3 text-center">
        <Btn tone="white" onClick={back} className="px-5 py-[5px] text-[13px]">
          {sisa === 0 ? "Lanjut Menjelajah →" : "Lewati"}
        </Btn>
      </div>
    </Frame>
  );
}

/* ============ 13. KARTU ZONK ============ */
export function Zonk() {
  const { replace, back } = useGame();
  useEffect(() => {
    audio.sfx("zonk");
  }, []);
  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#a21caf] via-[#d946ef] to-[#f0abfc]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "repeating-conic-gradient(from 0deg at 50% 40%, rgba(255,255,255,.6) 0deg 8deg, transparent 8deg 16deg)" }}
      />
      <TopBar title="Kartu Zonk" onBack={back} />
      <div className="absolute left-1/2 top-[54px] flex -translate-x-1/2 items-center gap-3">
        <span className="ol-sm font-display text-[32px] text-[#ffd54f]">!?</span>
        <div className="rounded-lg border-[4px] border-[#2b1b0e] bg-gradient-to-b from-[#ff6b6b] to-[#d32f2f] px-6 py-1 shadow-[0_5px_0_rgba(43,27,14,0.45)]">
          <span className="ol-sm font-display text-[30px] leading-none text-white">Zonk!</span>
        </div>
      </div>
      <Robot className="anim-float absolute bottom-4 left-4 w-[132px] drop-shadow-[0_8px_0_rgba(0,0,0,0.28)]" mood="sad" action="hurt" />
      <div className="absolute right-4 top-[128px] w-[272px]">
        <div className="relative rounded-2xl border-[4px] border-[#2b1b0e] bg-white px-3 py-3 shadow-[0_6px_0_rgba(43,27,14,0.35)]">
          <span className="absolute -left-3 bottom-6 h-4 w-4 rotate-45 border-b-[4px] border-l-[4px] border-[#2b1b0e] bg-white" />
          <p className="text-[13px] font-bold leading-snug text-[#2b1b0e]">
            Wah, kamu mendapat <span className="text-[#d32f2f]">Kartu Zonk!</span> Tidak apa-apa — ayo coba lagi dengan kartu lain!
          </p>
          <div className="mt-3 flex gap-2">
            <Btn tone="green" onClick={() => replace("scan")} className="flex-1 px-3 py-[7px] text-[14px]">Scan Lagi</Btn>
            <Btn tone="yellow" onClick={back} className="flex-1 px-3 py-[7px] text-[14px]">Kembali</Btn>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ============ 14. PETI HARTA KARUN ============ */
export function Peti() {
  const { player, session, updatePlayer, replace, go, back } = useGame();
  const ii = session.island;
  const isl = ISLANDS[ii];
  const open = player.islands[ii].chest;
  const [baru, setBaru] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const departing = useRef(false);
  const tamat = open && badgeCount(player) >= ISLANDS.length;

  const teleport = useCallback(() => {
    if (!open || departing.current) return;
    departing.current = true;
    replace("teleport");
  }, [open, replace]);

  useEffect(() => {
    if (!baru || !open) return;
    const tick = window.setInterval(() => setCountdown((n) => Math.max(1, n - 1)), 1000);
    const departure = window.setTimeout(teleport, 3000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(departure);
    };
  }, [baru, open, teleport]);

  const buka = () => {
    if (open) return;
    updatePlayer((p) => {
      const it = p.islands[ii];
      if (it.chest) return p;
      return { ...withIsland(p, ii, { ...it, chest: true }), poin: p.poin + 100, kristal: p.kristal + 10 };
    });
    setBaru(true);
    audio.sfx("chest");
  };

  return (
    <Frame className="bg-[#3b0764]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#4c1d95] via-[#6d28d9] to-[#2e1065]" />
      <div
        className="absolute inset-0 opacity-40"
        style={{ backgroundImage: "repeating-conic-gradient(from 0deg at 28% 55%, rgba(255,255,255,.55) 0deg 7deg, transparent 7deg 16deg)" }}
      />
      {baru && <Confetti />}
      <TopBar title="Peti Harta Karun" onBack={back} />

      <div className="absolute left-3 top-[58px] w-[206px]">
        <div className="relative overflow-hidden rounded-2xl border-[4px] border-[#2b1b0e] shadow-[0_6px_0_rgba(0,0,0,0.4)]">
          <img src={chestImg} alt="Peti harta karun" className={`h-[170px] w-full object-cover transition ${open ? "" : "brightness-50 saturate-50"}`} />
          {open && <div className="shine absolute inset-0" />}
          {!open && (
            <div className="absolute inset-0 grid place-items-center">
              <Btn tone="green" onClick={buka} className="anim-bob px-5 py-2 font-display text-[17px]">
                <span className="flex items-center gap-2"><Ic n="key" className="h-5 w-5" /> BUKA PETI</span>
              </Btn>
            </div>
          )}
        </div>
        <div className="ol-sm mt-2 text-center text-[11px] font-extrabold text-white">
          {tamat ? "Semua pulau tamat. Kamu Treasure Legend!" : open ? `Pulau ${isl.name} selesai!` : "Kunci sudah di tangan. Buka petinya!"}
        </div>
        {baru && open && (
          <p className="mt-1 text-center text-[10px] font-extrabold text-[#b5f6ff]" role="status">
            Portal aktif! Teleportasi dalam {countdown} detik...
          </p>
        )}
      </div>

      <div className="absolute right-3 top-[56px] w-[232px]">
        <div className="wood rounded-xl px-2 py-1.5 text-center">
          <span className={`ol-sm whitespace-nowrap font-display leading-tight text-[#ffd54f] ${open ? "text-[13px]" : "text-[16px]"}`}>
            {open ? "Peti Harta Karun Terbuka!" : "Hadiah di Dalam Peti"}
          </span>
        </div>
        <div className="mt-2 space-y-1.5">
          {[
            { icon: "star", label: "+100 Poin", bg: "#fff8e6", c: "#ffb300" },
            { icon: "crystal", label: "+10 Kristal", bg: "#f3ecff", c: "#7c3aed" },
            { icon: "medal", label: `Badge ${isl.badge}`, bg: "#fff1e2", c: "#ff8a3d" },
          ].map((r, i) => (
            <div
              key={r.label}
              className={`flex items-center gap-2 rounded-xl border-[3px] border-[#2b1b0e] px-2 py-1 shadow-[0_4px_0_rgba(43,27,14,0.35)] ${open ? "anim-pop" : "opacity-60"}`}
              style={{ background: open ? r.bg : "#ffffff", animationDelay: `${i * 120}ms` }}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[3px] border-[#2b1b0e]" style={{ background: r.c }}>
                <Ic n={r.icon} className="h-4 w-4 text-white" />
              </span>
              <span className="font-display text-[14px] leading-tight text-[#2b1b0e]">{r.label}</span>
            </div>
          ))}
        </div>
        {open && (
          <div className="mt-2.5 flex justify-center gap-2">
            <Btn tone="yellow" onClick={() => go("badge")} className="whitespace-nowrap px-2.5 py-[5px] text-[11px]">Lihat Badge</Btn>
            <Btn
              tone="green"
              onClick={teleport}
              ariaLabel={`Teleport ke ${ISLANDS[ii + 1]?.name ?? "Peta Petualangan"}`}
              className="whitespace-nowrap px-2.5 py-[5px] text-[11px]"
            >
              <span className="flex items-center gap-1"><Ic n="sparkle" className="h-3 w-3" /> Teleport Sekarang</span>
            </Btn>
          </div>
        )}
      </div>
    </Frame>
  );
}
