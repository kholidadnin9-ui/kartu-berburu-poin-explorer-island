import { useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { Avatar, Btn, Frame, Ic, SHIRTS, TopBar } from "../ui";
import { SOAL_TARGET, badgeCount, useGame, type Player, type PrintCard } from "../game/store";
import { ISLANDS } from "../game/data";

/* ---------- pembantu kartu ---------- */
const JENIS: Record<PrintCard["t"], string> = { N: "Angka", O: "Operator", S: "Bintang", Z: "Zonk" };
const cardLabel = (c: PrintCard) => (c.t === "S" ? "★" : c.t === "Z" ? "✕" : c.v);
const cardCode = (c: PrintCard) =>
  c.t === "S"
    ? "IE|S|BINTANG"
    : c.t === "Z"
      ? "IE|Z|ZONK"
      : c.t === "O"
        ? `IE|O|${c.v === "−" ? "-" : c.v === "×" ? "x" : c.v}`
        : `IE|N|${c.v}`;
const cardColor = (c: PrintCard) => (c.t === "N" ? "#1173b8" : c.t === "O" ? "#e53935" : c.t === "S" ? "#e09b00" : "#7c3aed");

const PAKET: PrintCard[] = [
  ...Array.from({ length: 20 }, (_, i): PrintCard => ({ t: "N", v: String(i + 1) })),
  ...["+", "−", "×", "<", ">", "="].flatMap((v): PrintCard[] => [{ t: "O", v }, { t: "O", v }]),
  ...Array.from({ length: 4 }, (): PrintCard => ({ t: "S", v: "★" })),
  ...Array.from({ length: 4 }, (): PrintCard => ({ t: "Z", v: "✕" })),
];

const stat = (p: Player) => {
  const total = p.logs.length;
  const benar = p.logs.filter((l) => l.benar).length;
  return { total, benar, akurasi: total ? Math.round((benar / total) * 100) : 0 };
};

/* ============ 18. DASHBOARD GURU ============ */
export function Guru() {
  const { players, player, back, go, notify, guru, setGuru } = useGame();
  const [wa, setWa] = useState(guru.wa);
  const [pwBaru, setPwBaru] = useState("");
  const [pwKonfirm, setPwKonfirm] = useState("");
  const [pwError, setPwError] = useState("");

  const simpanWa = () => {
    const digits = wa.replace(/\D/g, "").replace(/^0/, "62").slice(0, 15);
    setGuru({ wa: digits });
    setWa(digits);
    notify(digits ? `Nomor WhatsApp guru tersimpan: ${digits}` : "Nomor WhatsApp dikosongkan");
  };

  const simpanPassword = () => {
    const pw = pwBaru.trim();
    if (pw.length < 4) {
      setPwError("Password minimal 4 karakter.");
      return;
    }
    if (pw !== pwKonfirm.trim()) {
      setPwError("Konfirmasi password tidak sama.");
      return;
    }
    setGuru({ password: pw });
    setPwBaru("");
    setPwKonfirm("");
    setPwError("");
    notify("Password Menu Guru berhasil diubah");
  };

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows: (string | number)[][] = [
      ["Nama", "Kelas", "Poin", "Kristal", "Badge", "Soal Dijawab", "Benar", "Ketepatan (%)", ...ISLANDS.map((i) => `${i.name} (/${SOAL_TARGET})`)],
      ...players.map((p) => {
        const s = stat(p);
        return [p.nama, p.kelas, p.poin, p.kristal, badgeCount(p), s.total, s.benar, s.akurasi, ...p.islands.map((i) => (i.chest ? SOAL_TARGET : i.soal))];
      }),
      [],
      ["Nama", "Waktu", "Pulau", "Soal", "Jawaban", "Hasil"],
      ...players.flatMap((p) =>
        p.logs.map((l) => [p.nama, new Date(l.t).toLocaleString("id-ID"), ISLANDS[l.pulau].name, l.soal, l.jawab, l.benar ? "Benar" : "Salah"]),
      ),
    ];
    try {
      const blob = new Blob(["\ufeff" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "island-explorer-data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify("File CSV diunduh ✓");
    } catch {
      notify("Gagal mengunduh CSV");
    }
  };

  const tiles = [
    { icon: "users", name: "Data Pemain", tone: "#2fa7e8", act: () => go("pemain") },
    { icon: "chart", name: "Progres Belajar", tone: "#37c871", act: () => go("belajar") },
    { icon: "gear", name: "Pengaturan Permainan", tone: "#7c3aed", act: () => go("setelan") },
    { icon: "qr", name: "Generator Kartu QR", tone: "#ff8a3d", act: () => go("generator") },
    { icon: "doc", name: "Laporan Hasil", tone: "#ff4f91", act: () => go("laporan") },
    { icon: "download", name: "Ekspor Data (CSV)", tone: "#e53935", act: exportCsv },
  ];

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#5cc3f5] to-[#dff4ff]" />
      <TopBar title="Dashboard Guru" onBack={back} />
      <div className="absolute inset-x-4 bottom-3 top-[52px]">
        <div className="grid grid-cols-3 gap-2">
          {tiles.map((t) => (
            <button key={t.name} type="button" onClick={t.act} className="btn3d flex flex-col items-center gap-1 bg-white px-1 py-[9px] text-center">
              <span className="grid h-9 w-9 place-items-center rounded-xl border-[3px] border-[#2b1b0e]" style={{ background: t.tone }}>
                <Ic n={t.icon} className="h-5 w-5 text-white" />
              </span>
              <span className="text-[10px] font-extrabold leading-tight text-[#5b3212]">{t.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border-[3px] border-[#4a2a12] bg-white/95 px-3 py-1.5">
          <Avatar className="h-6 w-6" shirt={SHIRTS[player.avatar % SHIRTS.length]} />
          <span className="text-[11px] font-bold text-[#6b5233]">
            Pemain aktif: <b className="text-[#2b1b0e]">{player.nama}</b> ({player.kelas}) · {players.length} pemain di perangkat ini
          </span>
        </div>

        <div className="parch mt-3 rounded-2xl px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl border-[3px] border-[#2b1b0e] bg-[#25d366] text-white">
              <Ic n="volume" className="h-4 w-4" />
            </span>
            <div className="font-display text-[14px] leading-none text-[#2b1b0e]">Kontak &amp; Keamanan Guru</div>
          </div>
          <label className="mt-2 block text-[11px] font-extrabold text-[#5b3212]">
            Nomor WhatsApp guru (format 62..., contoh 628123456789)
            <span className="mt-[2px] flex items-center gap-1.5">
              <input
                value={wa}
                onChange={(e) => setWa(e.target.value.replace(/[^0-9+]/g, ""))}
                inputMode="tel"
                maxLength={16}
                placeholder="628123456789"
                className="min-w-0 flex-1 rounded-lg border-[3px] border-[#ad8552] bg-white px-2 py-[3px] text-[13px] font-bold text-[#2b1b0e] outline-none focus:border-[#25d366]"
              />
              <Btn tone="green" onClick={simpanWa} className="px-2.5 py-[4px] text-[11px]">Simpan</Btn>
            </span>
            <span className="mt-1 block text-[9px] font-bold text-[#8a6a4a]">
              {guru.wa ? `Hasil skor setiap level akan dikirim ke wa.me/${guru.wa}` : "Isi nomor agar hasil skor pemain terkirim otomatis saat level selesai."}
            </span>
          </label>
          <div className="mt-2 grid grid-cols-2 gap-1.5 border-t-[3px] border-dashed border-[#c9a24b] pt-2">
            <label className="block text-[10px] font-extrabold text-[#5b3212]">
              Password baru
              <input
                type="password"
                value={pwBaru}
                onChange={(e) => { setPwBaru(e.target.value); setPwError(""); }}
                placeholder="min. 4 karakter"
                className="mt-[2px] block w-full rounded-lg border-[3px] border-[#ad8552] bg-white px-2 py-[3px] text-[12px] font-bold text-[#2b1b0e] outline-none"
              />
            </label>
            <label className="block text-[10px] font-extrabold text-[#5b3212]">
              Konfirmasi password
              <input
                type="password"
                value={pwKonfirm}
                onChange={(e) => { setPwKonfirm(e.target.value); setPwError(""); }}
                placeholder="ulangi password"
                className="mt-[2px] block w-full rounded-lg border-[3px] border-[#ad8552] bg-white px-2 py-[3px] text-[12px] font-bold text-[#2b1b0e] outline-none"
              />
            </label>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className="min-h-[12px] flex-1 text-[9px] font-bold text-[#a34236]" role="alert">{pwError || "Password saat ini: tersimpan (default 1234)."}</p>
            <Btn tone="yellow" onClick={simpanPassword} className="px-2.5 py-[3px] text-[11px]">Ubah Password</Btn>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ============ DATA PEMAIN ============ */
export function Pemain() {
  const { players, player, back, addPlayer, removePlayer, selectPlayer, notify } = useGame();
  const [nama, setNama] = useState("");
  const [kelas, setKelas] = useState("2");
  const [del, setDel] = useState<string | null>(null);
  const inp = "min-w-0 rounded-lg border-[3px] border-[#2b1b0e] bg-white px-2 py-[2px] text-[12px] font-bold outline-none";

  const tambah = () => {
    const n = nama.trim();
    if (!n) {
      notify("Isi nama pemain dulu");
      return;
    }
    addPlayer(n.slice(0, 14), kelas.trim().slice(0, 6) || "2");
    setNama("");
    notify(`${n} ditambahkan`);
  };

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#5cc3f5] to-[#dff4ff]" />
      <TopBar title="Data Pemain" onBack={back} />
      <div className="parch absolute inset-x-4 bottom-3 top-[52px] flex flex-col rounded-2xl px-3 py-2.5">
        <ul className="min-h-0 flex-1 space-y-[5px] overflow-y-auto pr-1">
          {players.map((p) => {
            const aktif = p.id === player.id;
            return (
              <li key={p.id} className={`flex items-center gap-2 rounded-lg border-[3px] px-2 py-[3px] ${aktif ? "border-[#2b1b0e] bg-[#e9fff2]" : "border-[#c9a24b] bg-white"}`}>
                <Avatar className="h-6 w-6 shrink-0" shirt={SHIRTS[p.avatar % SHIRTS.length]} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-extrabold text-[#2b1b0e]">
                  {p.nama} <span className="font-bold text-[#8a6a4a]">· {p.kelas}</span>
                </span>
                <span className="flex items-center gap-[2px] font-display text-[11px] tabular-nums">
                  <Ic n="star" className="h-3 w-3 text-[#ff9f1c]" /> {p.poin}
                </span>
                <span className="flex items-center gap-[2px] font-display text-[11px] tabular-nums">
                  <Ic n="medal" className="h-3 w-3 text-[#ff8a3d]" /> {badgeCount(p)}
                </span>
                {aktif ? (
                  <span className="rounded-full bg-[#22a75b] px-2 py-[1px] text-[9px] font-black uppercase text-white">Aktif</span>
                ) : (
                  <Btn tone="green" onClick={() => selectPlayer(p.id)} className="px-2 py-[1px] text-[10px]">Pilih</Btn>
                )}
                {players.length > 1 && (
                  <Btn
                    tone={del === p.id ? "red" : "white"}
                    ariaLabel={`Hapus ${p.nama}`}
                    onClick={() => {
                      if (del === p.id) {
                        removePlayer(p.id);
                        setDel(null);
                      } else setDel(p.id);
                    }}
                    className="grid h-6 place-items-center px-1.5 text-[9px]"
                  >
                    {del === p.id ? "Yakin?" : <Ic n="trash" className="h-3 w-3" />}
                  </Btn>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-center gap-2 border-t-[3px] border-dashed border-[#c9a24b] pt-2">
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama pemain baru" maxLength={14} className={`${inp} flex-1`} />
          <input value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="Kelas" maxLength={6} className={`${inp} w-[58px]`} />
          <Btn tone="green" onClick={tambah} className="px-3 py-[3px] text-[12px]">
            <span className="flex items-center gap-1"><Ic n="plus" className="h-3 w-3" /> Tambah</span>
          </Btn>
        </div>
      </div>
    </Frame>
  );
}

/* ============ PROGRES BELAJAR ============ */
export function Belajar() {
  const { player, back } = useGame();
  const rows = ISLANDS.map((isl, i) => {
    const logs = player.logs.filter((l) => l.pulau === i);
    const benar = logs.filter((l) => l.benar).length;
    return { isl, total: logs.length, benar, pct: logs.length ? Math.round((benar / logs.length) * 100) : 0 };
  });
  const dicoba = rows.filter((r) => r.total >= 3);
  const lemah = dicoba.length ? dicoba.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
  const s = stat(player);

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#5cc3f5] to-[#dff4ff]" />
      <TopBar title="Progres Belajar" onBack={back} />
      <div className="parch absolute inset-x-4 bottom-3 top-[52px] rounded-2xl px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#6b5233]">
          <span><b className="text-[#2b1b0e]">{player.nama}</b> · Kelas {player.kelas}</span>
          <span>{s.total} soal · {s.benar} benar · <b className="text-[#22a75b]">{s.akurasi}%</b></span>
        </div>
        <ul className="space-y-[6px]">
          {rows.map((r) => (
            <li key={r.isl.id} className="flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-[3px] border-[#2b1b0e]" style={{ background: r.isl.color }}>
                <Ic n={r.isl.icon} className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="w-[92px] shrink-0 text-[12px] font-extrabold text-[#5b3212]">{r.isl.topicLabel}</span>
              <span className="h-[15px] flex-1 overflow-hidden rounded-full border-[3px] border-[#4a2a12] bg-[#eaddc4]">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${r.pct}%`, background: r.pct >= 80 ? "#22a75b" : r.pct >= 50 ? "#ffb300" : "#e53935" }}
                />
              </span>
              <span className="w-[74px] shrink-0 text-right font-display text-[12px] tabular-nums text-[#5b3212]">
                {r.total ? `${r.benar}/${r.total} · ${r.pct}%` : "belum ada"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2.5 rounded-xl border-[3px] border-[#c9a24b] bg-white px-2.5 py-1.5 text-[11px] font-bold leading-snug text-[#5b3212]">
          {s.total === 0
            ? "Belum ada soal yang dijawab. Data muncul setelah pemain menjawab soal kartu."
            : lemah && lemah.pct < 80
              ? `Saran: latih lagi ${lemah.isl.topicLabel.toLowerCase()} (${lemah.pct}% tepat) di pulau ${lemah.isl.name}.`
              : "Semua topik yang sudah dicoba berjalan baik. Coba naikkan tingkat kesulitan."}
        </div>
      </div>
    </Frame>
  );
}

/* ============ LAPORAN HASIL ============ */
export function Laporan() {
  const { player, back } = useGame();
  const s = stat(player);
  const logs = player.logs.slice(-60).reverse();
  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#5cc3f5] to-[#dff4ff]" />
      <TopBar title="Laporan Hasil" onBack={back} />
      <div className="parch absolute inset-x-4 bottom-3 top-[52px] flex flex-col rounded-2xl px-3 py-2.5">
        <div className="mb-2 grid grid-cols-4 gap-1.5 text-center">
          {[
            { k: "Soal", v: s.total, c: "#2fa7e8" },
            { k: "Benar", v: s.benar, c: "#22a75b" },
            { k: "Salah", v: s.total - s.benar, c: "#e53935" },
            { k: "Tepat", v: `${s.akurasi}%`, c: "#ff8a3d" },
          ].map((x) => (
            <div key={x.k} className="rounded-lg border-[3px] border-[#c9a24b] bg-white">
              <div className="font-display text-[15px] leading-tight tabular-nums" style={{ color: x.c }}>{x.v}</div>
              <div className="text-[8px] font-extrabold uppercase tracking-wider text-[#8a6a4a]">{x.k}</div>
            </div>
          ))}
        </div>
        {logs.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-xl border-[3px] border-dashed border-[#c9a24b] text-center text-[12px] font-bold text-[#8a6a4a]">
            Belum ada riwayat jawaban untuk {player.nama}.
          </div>
        ) : (
          <ul className="min-h-0 flex-1 space-y-[4px] overflow-y-auto pr-1">
            {logs.map((l, i) => (
              <li key={`${l.t}-${i}`} className="flex items-center gap-2 rounded-lg border-2 border-[#d9c59a] bg-white px-2 py-[2px]">
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${l.benar ? "bg-[#22a75b]" : "bg-[#e53935]"}`}>
                  <Ic n={l.benar ? "check" : "x"} className="h-3 w-3" />
                </span>
                <span className="font-display text-[13px] tabular-nums text-[#2b1b0e]">{l.soal}</span>
                <span className="text-[11px] font-bold text-[#6b5233]">jawab: {l.jawab}</span>
                <span className="ml-auto truncate text-[9px] font-bold text-[#a08a6c]">
                  {ISLANDS[l.pulau].name} · {new Date(l.t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Frame>
  );
}

/* ============ 19. GENERATOR KARTU QR ============ */
export function Generator() {
  const { deck, setDeck, back, go, notify } = useGame();
  const [jenis, setJenis] = useState<PrintCard["t"]>("N");
  const [angka, setAngka] = useState("15");
  const [op, setOp] = useState("+");
  const card: PrintCard =
    jenis === "N" ? { t: "N", v: angka === "" ? "0" : angka } : jenis === "O" ? { t: "O", v: op } : jenis === "S" ? { t: "S", v: "★" } : { t: "Z", v: "✕" };
  const sel = "mb-2 mt-[2px] w-full rounded-lg border-[3px] border-[#2b1b0e] bg-white px-2 py-[3px] text-[13px] font-bold outline-none";

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#7fd0f7] to-[#e8f8ff]" />
      <TopBar title="Generator Kartu Berburu Poin" onBack={back} />
      <div className="absolute inset-x-4 bottom-3 top-[52px] flex gap-3">
        <div className="parch flex-1 rounded-2xl px-3 py-2.5">
          <label className="block text-[12px] font-extrabold text-[#5b3212]">
            Jenis Kartu
            <select value={jenis} onChange={(e) => setJenis(e.target.value as PrintCard["t"])} className={sel}>
              <option value="N">Angka</option>
              <option value="O">Operator</option>
              <option value="S">Bintang (bonus)</option>
              <option value="Z">Zonk</option>
            </select>
          </label>
          <label className="block text-[12px] font-extrabold text-[#5b3212]">
            Nilai
            {jenis === "N" ? (
              <input
                type="number"
                min={0}
                max={100}
                value={angka}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                  setAngka(v === "" ? "" : String(Math.min(100, Number(v))));
                }}
                className={sel}
              />
            ) : jenis === "O" ? (
              <select value={op} onChange={(e) => setOp(e.target.value)} className={sel}>
                {["+", "−", "×", "<", ">", "="].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <div className={`${sel} bg-[#f1e7d0] text-[#8a6a4a]`}>{jenis === "S" ? "Kartu bonus" : "Kartu jebakan"}</div>
            )}
          </label>
          <div className="flex gap-2">
            <Btn
              tone="green"
              onClick={() => {
                setDeck((d) => [...d, card]);
                notify(`Kartu ${cardLabel(card)} masuk lembar cetak`);
              }}
              className="flex-1 px-2 py-[6px] text-[13px]"
            >
              <span className="flex items-center justify-center gap-1.5"><Ic n="plus" className="h-3.5 w-3.5" /> Buat Kartu</span>
            </Btn>
            <Btn
              tone="purple"
              onClick={() => {
                setDeck((d) => [...d, ...PAKET]);
                notify("Paket standar 40 kartu ditambahkan");
              }}
              className="px-2 py-[6px] text-[12px]"
            >
              Paket 40
            </Btn>
          </div>
          <Btn tone="yellow" onClick={() => go("cetak")} className="mt-2.5 w-full px-2 py-[5px] text-[13px]">
            <span className="flex items-center justify-center gap-1.5">
              <Ic n="printer" className="h-4 w-4" /> Lembar Cetak ({deck.length} kartu)
            </span>
          </Btn>
        </div>

        <div className="flex w-[150px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border-[4px] border-[#2b1b0e] bg-white p-2 shadow-[0_5px_0_rgba(43,27,14,0.35)]">
          <div className="text-[8px] font-extrabold uppercase tracking-widest text-[#a9673a]">Kartu {JENIS[card.t]}</div>
          <div className="font-display text-[50px] leading-none tabular-nums" style={{ color: cardColor(card) }}>{cardLabel(card)}</div>
          <QRCodeSVG value={cardCode(card)} size={84} level="M" />
          <div className="text-[8px] font-extrabold uppercase tracking-wider text-[#8a6a4a]">Island Explorer</div>
        </div>
      </div>
    </Frame>
  );
}

/* ============ 20. PREVIEW CETAK KARTU ============ */
const chunk = <T,>(arr: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

function PrintRoot({ deck }: { deck: PrintCard[] }) {
  return createPortal(
    <div className="print-root">
      {chunk(deck, 10).map((pg, i) => (
        <div key={i} className="print-page">
          {pg.map((c, k) => (
            <div key={k} className="print-card">
              <div className="print-brand">ISLAND EXPLORER</div>
              <div className="print-value" style={{ color: cardColor(c) }}>{cardLabel(c)}</div>
              <QRCodeSVG value={cardCode(c)} size={128} level="M" style={{ width: "30mm", height: "30mm" }} />
              <div className="print-kind">Kartu {JENIS[c.t]}</div>
            </div>
          ))}
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function Cetak() {
  const { deck, setDeck, back, notify } = useGame();
  const [page, setPage] = useState(0);
  const pages = chunk(deck, 10);
  const pg = Math.min(page, Math.max(0, pages.length - 1));
  const cards = pages[pg] ?? [];

  const print = () => {
    if (deck.length === 0) {
      notify("Lembar masih kosong");
      return;
    }
    try {
      window.print();
    } catch {
      notify("Cetak tidak tersedia di sini");
    }
  };

  return (
    <Frame className="bg-[#8a9bb0]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#9fb2c6] to-[#d8e3ec]" />
      <TopBar title="Hasil Cetak Kartu (A4)" onBack={back} />

      <div className="absolute left-3 top-[50px] h-[258px] w-[300px] rounded-sm border-[3px] border-[#2b1b0e] bg-white p-2 shadow-[0_5px_0_rgba(43,27,14,0.35)]">
        <div className="mb-1.5 flex items-center justify-between border-b-2 border-dashed border-[#c9c9c9] pb-1">
          <span className="font-display text-[9px] leading-none text-[#2b1b0e]">ISLAND EXPLORER · KARTU BERBURU POIN</span>
          <span className="text-[7px] font-extrabold uppercase tracking-wider text-[#a9673a]">
            A4 · hal {pages.length ? pg + 1 : 0}/{pages.length}
          </span>
        </div>
        {cards.length === 0 ? (
          <div className="grid h-[200px] place-items-center text-center text-[12px] font-bold text-[#8a6a4a]">
            Lembar masih kosong.
            <br />
            Tambahkan Paket 40 atau buat kartu di Generator.
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-[5px]">
            {cards.map((c, k) => (
              <button
                key={`${pg}-${k}`}
                type="button"
                title="Ketuk untuk menghapus kartu"
                onClick={() => setDeck((d) => d.filter((_, i) => i !== pg * 10 + k))}
                className="flex h-[104px] min-w-0 flex-col items-center justify-between rounded-md border-[2.5px] border-[#2b1b0e] bg-white px-[2px] py-1 hover:bg-[#ffecec]"
              >
                <span className="text-[5px] font-extrabold uppercase tracking-tight text-[#a9673a]">{JENIS[c.t]}</span>
                <span className="font-display text-[20px] leading-none tabular-nums" style={{ color: cardColor(c) }}>{cardLabel(c)}</span>
                <QRCodeSVG value={cardCode(c)} size={40} level="L" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-3 top-[50px] flex w-[150px] flex-col gap-2">
        <div className="rounded-xl border-[3px] border-[#2b1b0e] bg-white px-2 py-1.5 text-center">
          <div className="font-display text-[20px] leading-none text-[#2b1b0e]">{deck.length}</div>
          <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#8a6a4a]">kartu · {pages.length} halaman</div>
        </div>
        <div className="flex gap-2">
          <Btn tone="white" onClick={() => setPage(Math.max(0, pg - 1))} ariaLabel="Halaman sebelumnya" className="grid h-8 flex-1 place-items-center">
            <Ic n="left" className="h-4 w-4" />
          </Btn>
          <Btn tone="white" onClick={() => setPage(Math.min(pages.length - 1, pg + 1))} ariaLabel="Halaman berikutnya" className="grid h-8 flex-1 place-items-center">
            <Ic n="right" className="h-4 w-4" />
          </Btn>
        </div>
        <Btn tone="green" onClick={print} className="px-2 py-[7px] text-[14px]">
          <span className="flex items-center justify-center gap-1.5"><Ic n="printer" className="h-4 w-4" /> Cetak A4</span>
        </Btn>
        <Btn tone="purple" onClick={() => setDeck((d) => [...d, ...PAKET])} className="px-2 py-[5px] text-[12px]">+ Paket 40 Kartu</Btn>
        <Btn tone="red" onClick={() => setDeck(() => [])} className="px-2 py-[5px] text-[12px]">Kosongkan</Btn>
        <p className="mt-auto text-center text-[9px] font-bold leading-tight text-[#3d4a57]">
          Ketuk kartu untuk menghapusnya. Kartu cetak bisa dipindai lewat tombol “Kartu Cetak” di layar Scan.
        </p>
      </div>

      <PrintRoot deck={deck} />
    </Frame>
  );
}
