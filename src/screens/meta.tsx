import { useState } from "react";
import { Btn, Frame, Ic, TopBar } from "../ui";
import { SOAL_TARGET, badgeCount, emptyIsland, playMem, useGame } from "../game/store";
import { ISLANDS } from "../game/data";
import type { Level } from "../game/questions";

/* ============ 15. KOLEKSI BADGE ============ */
export function Badge() {
  const { player, back } = useGame();
  const n = badgeCount(player);
  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#bfe9ff] to-[#eefaff]" />
      <TopBar title="Koleksi Badge" onBack={back} />
      <div className="parch absolute inset-x-4 bottom-3 top-[52px] rounded-2xl px-3 py-3">
        <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
          {ISLANDS.map((isl, i) => {
            const got = player.islands[i].chest;
            return (
              <div key={isl.id} className="flex flex-col items-center gap-1 text-center">
                <div className="relative">
                  <div
                    className={`grid h-[54px] w-[54px] place-items-center rounded-full border-[4px] border-[#2b1b0e] shadow-[0_4px_0_rgba(43,27,14,0.35)] ${got ? "anim-glow" : ""}`}
                    style={{ background: got ? isl.color : "#d9cbb3" }}
                  >
                    <Ic n={isl.icon} className={`h-7 w-7 ${got ? "text-white" : "text-[#b3a48b]"}`} />
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-[3px] border-[#2b1b0e] ${
                      got ? "bg-[#37c871] text-white" : "bg-white text-[#8a6a4a]"
                    }`}
                  >
                    <Ic n={got ? "check" : "lock"} className="h-3 w-3" />
                  </span>
                </div>
                <span className={`text-[10px] font-extrabold leading-tight ${got ? "text-[#5b3212]" : "text-[#a08a6c]"}`}>{isl.badge}</span>
              </div>
            );
          })}
          <div className="flex flex-col items-center justify-center rounded-xl border-[3px] border-dashed border-[#c9a24b] bg-white/70 text-center">
            <span className="font-display text-[24px] leading-none text-[#ff8a3d]">{n} / 5</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8a6a4a]">Badge terkumpul</span>
          </div>
        </div>
        <p className="mt-2.5 text-center text-[11px] font-bold text-[#6b5233]">
          {n === 5 ? "Luar biasa! Semua badge sudah jadi milikmu." : "Buka peti harta di tiap pulau untuk mendapat badge."}
        </p>
      </div>
    </Frame>
  );
}

/* ============ 16. RIWAYAT & PROGRES ============ */
export function Progres() {
  const { player, back, reset } = useGame();
  const total = player.islands.reduce((a, i) => a + Math.min(i.soal, SOAL_TARGET), 0);
  const benar = player.logs.filter((l) => l.benar).length;
  const akurasi = player.logs.length ? Math.round((benar / player.logs.length) * 100) : 0;
  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#5cc3f5] to-[#dff4ff]" />
      <TopBar title="Progres Petualangan" onBack={back} />
      <div className="parch absolute inset-x-4 bottom-3 top-[52px] rounded-2xl px-3 py-2.5">
        <ul className="space-y-[3px]">
          {ISLANDS.map((isl, i) => {
            const p = player.islands[i];
            const v = p.chest ? SOAL_TARGET : Math.min(p.soal, SOAL_TARGET);
            return (
              <li key={isl.id} className="flex items-center gap-2">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[3px] border-[#2b1b0e]"
                  style={{ background: v > 0 ? isl.color : "#d9cbb3" }}
                >
                  <Ic n={isl.icon} className="h-4 w-4 text-white" />
                </span>
                <span className="w-[112px] shrink-0 text-[12px] font-extrabold leading-none text-[#5b3212]">
                  {isl.name}
                  <span className="block text-[9px] font-bold text-[#a9673a]">{isl.topicLabel}</span>
                </span>
                <span className="h-[15px] flex-1 overflow-hidden rounded-full border-[3px] border-[#4a2a12] bg-[#eaddc4]">
                  <span className="block h-full rounded-full bg-gradient-to-b from-[#9dffbe] to-[#22a75b]" style={{ width: `${v * 10}%` }} />
                </span>
                <span className="w-[46px] shrink-0 text-right font-display text-[13px] tabular-nums text-[#5b3212]">{v} / {SOAL_TARGET}</span>
                <span className="w-4 shrink-0 text-[#22a75b]">{p.chest && <Ic n="check" className="h-4 w-4" />}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
          {[
            { k: "Misi selesai", v: `${total} / 50`, c: "#22a75b" },
            { k: "Soal dijawab", v: String(player.logs.length), c: "#2fa7e8" },
            { k: "Ketepatan", v: `${akurasi}%`, c: "#ff8a3d" },
          ].map((x) => (
            <div key={x.k} className="rounded-lg border-[3px] border-[#c9a24b] bg-white py-[2px]">
              <div className="font-display text-[15px] leading-tight tabular-nums" style={{ color: x.c }}>{x.v}</div>
              <div className="text-[8px] font-extrabold uppercase tracking-wider text-[#8a6a4a]">{x.k}</div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 text-center">
          <Btn tone="green" onClick={() => reset("menu", "peta")} className="px-5 py-[3px] text-[12px]">Lanjutkan Petualangan</Btn>
        </div>
      </div>
    </Frame>
  );
}

/* ============ 17. PENGATURAN ============ */
function Toggle({ on, onToggle, label, icon }: { on: boolean; onToggle: () => void; label: string; icon: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className="flex w-full items-center gap-2 rounded-lg border-[3px] border-[#c9a24b] bg-white px-2 py-[4px] text-left shadow-[0_2px_0_rgba(43,27,14,0.2)]"
    >
      <Ic n={icon} className="h-4 w-4 shrink-0 text-[#a9673a]" />
      <span className="flex-1 text-[13px] font-bold text-[#5b3212]">{label}</span>
      <span className={`relative h-[24px] w-[44px] shrink-0 rounded-full border-[3px] border-[#2b1b0e] transition-colors ${on ? "bg-[#37c871]" : "bg-[#d9cbb3]"}`}>
        <span
          className={`absolute top-[1px] h-[16px] w-[16px] rounded-full border-2 border-[#2b1b0e] bg-white transition-all duration-150 ${
            on ? "left-[21px]" : "left-[1px]"
          }`}
        />
      </span>
    </button>
  );
}

export function Setelan() {
  const { settings, setSettings, updatePlayer, player, back, notify } = useGame();
  const [yakin, setYakin] = useState(false);

  const layarPenuh = () => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen().catch(() => notify("Layar penuh tidak tersedia"));
    } catch {
      notify("Layar penuh tidak tersedia");
    }
  };
  const ulang = () => {
    if (!yakin) {
      setYakin(true);
      return;
    }
    updatePlayer((p) => ({
      ...p, poin: 0, totalPoin: 0, kristal: 0, acak: 0,
      laserUnlocked: false, plasmaUnlocked: false, equippedWeapon: "laser",
      islands: [0, 1, 2, 3, 4].map(emptyIsland), logs: [],
    }));
    playMem.island = -1;
    setYakin(false);
    notify("Progres diulang dari awal");
  };

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#7fd0f7] to-[#e8f8ff]" />
      <TopBar title="Pengaturan" onBack={back} />
      <div className="parch absolute inset-x-6 bottom-3 top-[52px] rounded-2xl px-3 py-2.5">
        <div className="space-y-[6px]">
          <Toggle on={settings.musik} onToggle={() => setSettings({ musik: !settings.musik })} label="Musik" icon="volume" />
          <Toggle on={settings.suara} onToggle={() => setSettings({ suara: !settings.suara })} label="Efek Suara" icon="volume" />
          <Toggle on={settings.efek} onToggle={() => setSettings({ efek: !settings.efek })} label="Visual Efek" icon="sparkle" />
        </div>
        <div className="mt-[6px] flex items-center gap-2 rounded-lg border-[3px] border-[#c9a24b] bg-white px-2 py-[4px]">
          <span className="flex-1 text-[13px] font-bold text-[#5b3212]">
            Tingkat Kesulitan
            <span className="block text-[9px] font-bold text-[#a9673a]">
              {settings.level === "Mudah" ? "Angka sampai 20" : settings.level === "Sedang" ? "Angka sampai 50" : "Angka sampai 100"}
            </span>
          </span>
          <select
            value={settings.level}
            onChange={(e) => setSettings({ level: e.target.value as Level })}
            className="rounded-lg border-[3px] border-[#2b1b0e] bg-[#ffd54f] px-2 py-[2px] font-display text-[14px] text-[#2b1b0e] outline-none"
          >
            <option>Mudah</option>
            <option>Sedang</option>
            <option>Sulit</option>
          </select>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <Btn tone="blue" onClick={layarPenuh} className="flex-1 px-2 py-[5px] text-[12px]">
            <span className="flex items-center justify-center gap-1.5"><Ic n="screen" className="h-3.5 w-3.5" /> Layar Penuh</span>
          </Btn>
          <Btn tone={yakin ? "red" : "white"} onClick={ulang} className="flex-1 px-2 py-[5px] text-[12px]">
            <span className="flex items-center justify-center gap-1.5">
              <Ic n="refresh" className="h-3.5 w-3.5" /> {yakin ? `Yakin hapus progres ${player.nama}?` : "Ulang Progres"}
            </span>
          </Btn>
        </div>
      </div>
    </Frame>
  );
}
