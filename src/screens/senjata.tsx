import { Btn, Frame, Ic, Robot, TopBar } from "../ui";
import { START_X, playMem, useGame } from "../game/store";

export function Senjata() {
  const { player, updatePlayer, back, notify } = useGame();
  const progress = Math.min(player.totalPoin, 100);

  const pilihLaser = () => {
    if (!player.laserUnlocked) return;
    updatePlayer((p) => ({ ...p, equippedWeapon: "laser" }));
    notify("Laser siap digunakan!");
  };

  const pilihPlasma = () => {
    if (player.plasmaUnlocked) {
      updatePlayer((p) => ({ ...p, equippedWeapon: "plasma" }));
      notify("Plasma siap digunakan!");
      return;
    }
    if (player.poin < 500) return;
    updatePlayer((p) => {
      if (p.plasmaUnlocked || p.poin < 500) return p;
      return { ...p, poin: p.poin - 500, plasmaUnlocked: true, equippedWeapon: "plasma" };
    });
    notify("Plasma berhasil ditukar!");
  };

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#1888c8] via-[#9cdcff] to-[#dbf3ff]" />
      <div className="pixgrid absolute inset-0" />
      <TopBar title="Gudang Senjata" onBack={back} />

      <div className="parch absolute inset-x-4 bottom-3 top-[51px] rounded-2xl px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-[#725438]">Pilih senjata untuk menghadapi robot anjing.</p>
          <span className="flex shrink-0 items-center gap-1 rounded-full border-[3px] border-[#2b1b0e] bg-white px-2 py-[2px]">
            <Ic n="star" className="h-3.5 w-3.5 text-[#ffad16]" />
            <span className="font-display text-[13px] tabular-nums">{player.poin} poin</span>
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border-[3px] border-[#4a2a12] bg-white px-2 py-2 shadow-[0_3px_0_rgba(43,27,14,0.2)]">
            <span className="weapon-emblem weapon-emblem-laser"><Ic n="bolt" className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[16px] leading-none text-[#137eb4]">Laser</div>
              <p className="mt-1 text-[10px] font-bold leading-tight text-[#725438]">
                {player.laserUnlocked ? "Terbuka otomatis, tanpa mengurangi poin." : `Kumpulkan 100 poin total (${progress}/100).`}
              </p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#d9e8ef]">
                <div className="h-full rounded-full bg-[#29bce5]" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button
              type="button"
              disabled={!player.laserUnlocked}
              aria-pressed={player.laserUnlocked && player.equippedWeapon === "laser"}
              onClick={pilihLaser}
              className="weapon-select btn3d min-w-[76px] bg-[#2fa7e8] px-2 py-[6px] text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#abbac2]"
            >
              {!player.laserUnlocked ? "Terkunci" : player.equippedWeapon === "laser" ? "Dipakai" : "Pakai Laser"}
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl border-[3px] border-[#4a2a12] bg-white px-2 py-2 shadow-[0_3px_0_rgba(43,27,14,0.2)]">
            <span className="weapon-emblem weapon-emblem-plasma"><Ic n="sparkle" className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[16px] leading-none text-[#7c3aed]">Plasma</div>
              <p className="mt-1 text-[10px] font-bold leading-tight text-[#725438]">
                {player.plasmaUnlocked ? "Sudah dimiliki. Tembakan lebih kuat!" : "Tukar 500 poin sekali untuk membuka plasma."}
              </p>
              <div className="mt-1 text-[9px] font-extrabold text-[#947555]">
                {player.plasmaUnlocked ? "Dimiliki selamanya" : `Poin tersedia: ${player.poin}/500`}
              </div>
            </div>
            <button
              type="button"
              disabled={!player.plasmaUnlocked && player.poin < 500}
              aria-pressed={player.plasmaUnlocked && player.equippedWeapon === "plasma"}
              onClick={pilihPlasma}
              className="weapon-select btn3d min-w-[76px] bg-[#7c3aed] px-2 py-[6px] text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#abbac2]"
            >
              {player.plasmaUnlocked ? (player.equippedWeapon === "plasma" ? "Dipakai" : "Pakai Plasma") : "Tukar 500"}
            </button>
          </div>
        </div>

        <p className="mt-2 text-center text-[10px] font-bold text-[#8a6a4a]">
          Senjata yang sudah terbuka tetap tersimpan untuk pemain ini.
        </p>
      </div>
    </Frame>
  );
}

export function Kalah() {
  const { session, setSession, reset, back } = useGame();

  const cobaLagi = () => {
    playMem.island = session.island;
    playMem.x = START_X;
    setSession({ hearts: 3 });
    back();
  };

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#3b62a0] to-[#a9d4f1]" />
      <div className="pixgrid absolute inset-0" />
      <div className="absolute left-4 top-[62px] w-[120px]">
        <Robot className="w-full drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]" mood="sad" action="hurt" />
      </div>
      <div className="parch absolute right-4 top-[50px] w-[310px] rounded-2xl px-4 py-4">
        <h1 className="font-display text-[23px] leading-tight text-[#5b3212]">Hati Habis!</h1>
        <p className="mt-2 text-[13px] font-bold leading-snug text-[#725438]">
          Robot perlu beristirahat. Kembali ke awal pulau dengan 3 hati baru.
        </p>
        <p className="mt-2 text-[11px] font-bold text-[#228457]">Poin dan robot anjing yang sudah dikalahkan tetap tersimpan.</p>
        <div className="mt-4 flex gap-2">
          <Btn tone="green" onClick={cobaLagi} className="flex-1 px-3 py-[7px] text-[13px]">Coba Lagi</Btn>
          <Btn tone="yellow" onClick={() => reset("menu", "peta")} className="flex-1 px-3 py-[7px] text-[13px]">Ke Peta</Btn>
        </div>
      </div>
    </Frame>
  );
}