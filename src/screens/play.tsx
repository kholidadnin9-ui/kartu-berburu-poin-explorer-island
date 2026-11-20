import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Avatar, Btn, Frame, Ic, Pearl, Robot, SHIRTS, TopBar, type RobotAction } from "../ui";
import { PEARL_TARGET, PER_STATION, SOAL_TARGET, START_X, playInput, playMem, useGame, withIsland } from "../game/store";
import { GH, ISLANDS, VW, buildLevel } from "../game/data";
import { audio } from "../game/audio";
import dogSprite from "../assets/robot-dog.png";

const SPEED = 155;
const DASH_SPEED = 330;
const GRAV = 1500;
const JUMP = 545;

type Attack = "punch" | "kick" | "laser" | "plasma";
type Dog = {
  id: number;
  x: number;
  origin: number;
  dir: number;
  hp: number;
  dead: boolean;
  hit: number;
  fade: number;
};
type Projectile = { id: number; x: number; y: number; dir: number; type: "laser" | "plasma"; life: number };

function Hold({
  set,
  label,
  className = "",
  children,
}: {
  set: (v: boolean) => void;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-quiet=""
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerLeave={() => set(false)}
      onPointerCancel={() => set(false)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: "none" }}
      className={`btn3d grid place-items-center bg-[#2fa7e8] text-white ${className}`}
    >
      {children}
    </button>
  );
}

/* ============ 6. GAMEPLAY EKSPLORASI ============ */
export function Play() {
  const { player, session, go, back, updatePlayer, notify, setSession } = useGame();
  const ii = session.island;
  const isl = ISLANDS[ii];
  const prog = player.islands[ii];
  const level = useMemo(() => buildLevel(ii), [ii]);

  const st = useRef({
    x: playMem.island === ii ? Math.min(playMem.x, level.W - 30) : START_X,
    y: 0,
    vx: 0,
    vy: 0,
    ground: true,
    dir: 1,
    moving: false,
    jumps: 0,
    prevJump: false,
    dashTimer: 0,
    dashCd: 0,
    landTimer: 0,
    djumpTimer: 0,
    poseTimer: 0,
    attackTimer: 0,
    attackCooldown: 0,
    attackType: "punch" as Attack,
    invulnerable: 0,
    hurtTimer: 0,
    crouching: false,
    t: 0,
  });
  const input = useRef({ l: false, r: false, j: false, d: false });
  const seenSeq = useRef({
    dash: playInput.dash, punch: playInput.punch, kick: playInput.kick,
    shoot: playInput.shoot, act: playInput.act,
  });
  const dogs = useRef<Dog[]>(level.dogs.map((x, id) => ({
    id, x, origin: x, dir: -1, hp: 3, dead: prog.dogs.includes(id), hit: 0, fade: 0,
  })));
  const projectiles = useRef<Projectile[]>([]);
  const projectileId = useRef(0);
  const playerRef = useRef(player);
  playerRef.current = player;
  const heartsRef = useRef(session.hearts);
  heartsRef.current = session.hearts;
  const gameOver = useRef(false);
  const warningCooldown = useRef(0);
  const got = useRef(new Set<string>());
  const progRef = useRef(prog);
  progRef.current = prog;
  const actRef = useRef<() => void>(() => undefined);
  const dashRef = useRef<() => void>(() => undefined);
  const attackRef = useRef<(attack: Attack) => void>(() => undefined);
  const [, setTick] = useState(0);

  const triggerDash = () => {
    const s = st.current;
    if (s.dashCd > 0) return;
    s.dashTimer = 0.22;
    s.dashCd = 0.52;
    s.poseTimer = 0;
    if (!s.ground && s.vy < 80) s.vy = 110;
    audio.sfx("dash");
  };
  dashRef.current = triggerDash;

  const damageDog = (dog: Dog, damage: number, direction: number) => {
    if (dog.dead) return;
    dog.hp = Math.max(0, dog.hp - damage);
    dog.hit = 0.38;
    dog.x = Math.max(dog.origin - 38, Math.min(dog.origin + 38, dog.x + direction * 12));
    if (dog.hp > 0) {
      audio.sfx("hit");
      return;
    }
    dog.dead = true;
    dog.fade = 0.55;
    updatePlayer((p) => {
      const island = p.islands[ii];
      if (island.dogs.includes(dog.id)) return p;
      return { ...withIsland(p, ii, { ...island, dogs: [...island.dogs, dog.id] }), poin: p.poin + 5 };
    });
    audio.sfx("dogdown");
    notify("Penjaga kalah! +5 Poin");
  };

  const triggerAttack = (kind: Attack) => {
    const s = st.current;
    if (s.attackCooldown > 0 || gameOver.current) return;
    const active = playerRef.current;
    if ((kind === "laser" && !active.laserUnlocked) || (kind === "plasma" && !active.plasmaUnlocked)) {
      notify("Laser terbuka setelah 100 poin. Buka Gudang Senjata!");
      return;
    }

    s.attackType = kind;
    s.attackTimer = 0.3;
    s.attackCooldown = kind === "plasma" ? 0.55 : 0.38;
    s.poseTimer = 0;

    if (kind === "punch" || kind === "kick") {
      audio.sfx(kind === "punch" ? "action" : "kick");
      const reach = kind === "punch" ? 57 : 69;
      const target = dogs.current
        .filter((dog) => !dog.dead && (dog.x - s.x) * s.dir >= -8 && (dog.x - s.x) * s.dir <= reach && s.y < 48)
        .sort((a, b) => Math.abs(a.x - s.x) - Math.abs(b.x - s.x))[0];
      if (target) damageDog(target, kind === "punch" ? 1 : 2, s.dir);
      return;
    }

    audio.sfx(kind);
    projectiles.current.push({ id: ++projectileId.current, x: s.x + s.dir * 26, y: s.y + 30, dir: s.dir, type: kind, life: 1.1 });
  };
  attackRef.current = triggerAttack;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    playInput.l = false;
    playInput.r = false;
    playInput.j = false;
    playInput.d = false;

    const collect = (kind: "coins" | "pearls" | "key", i: number) => {
      const id = kind + i;
      if (got.current.has(id)) return;
      got.current.add(id);
      updatePlayer((p) => {
        const it = p.islands[ii];
        if (kind === "key") return it.key ? p : withIsland(p, ii, { ...it, key: true });
        if (it[kind].includes(i)) return p;
        const nextIsl = kind === "coins" ? { ...it, coins: [...it.coins, i] } : { ...it, pearls: [...it.pearls, i] };
        return { ...withIsland(p, ii, nextIsl), poin: p.poin + (kind === "coins" ? 2 : 5) };
      });
      if (kind === "coins") {
        audio.sfx("coin");
        notify("+2 Poin");
      } else if (kind === "pearls") {
        st.current.poseTimer = 0.45;
        audio.sfx("pearl");
        notify("Mutiara! +5 Poin");
      } else {
        st.current.poseTimer = 0.65;
        audio.sfx("key");
        notify("Kunci peti ditemukan!");
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const s = st.current;
      const inp = input.current;
      const pr = progRef.current;

      // Sinkronkan pemicu dari gamepad eksternal
      if (playInput.dash !== seenSeq.current.dash) {
        seenSeq.current.dash = playInput.dash;
        dashRef.current();
      }
      if (playInput.punch !== seenSeq.current.punch) {
        seenSeq.current.punch = playInput.punch;
        attackRef.current("punch");
      }
      if (playInput.kick !== seenSeq.current.kick) {
        seenSeq.current.kick = playInput.kick;
        attackRef.current("kick");
      }
      if (playInput.shoot !== seenSeq.current.shoot) {
        seenSeq.current.shoot = playInput.shoot;
        attackRef.current(playerRef.current.equippedWeapon);
      }
      if (playInput.act !== seenSeq.current.act) {
        seenSeq.current.act = playInput.act;
        actRef.current();
      }

      const moveL = inp.l || playInput.l;
      const moveR = inp.r || playInput.r;
      const wantJump = inp.j || playInput.j;
      const wantCrouch = inp.d || playInput.d;

      s.dashTimer = Math.max(0, s.dashTimer - dt);
      s.dashCd = Math.max(0, s.dashCd - dt);
      s.landTimer = Math.max(0, s.landTimer - dt);
      s.djumpTimer = Math.max(0, s.djumpTimer - dt);
      s.poseTimer = Math.max(0, s.poseTimer - dt);
      s.attackTimer = Math.max(0, s.attackTimer - dt);
      s.attackCooldown = Math.max(0, s.attackCooldown - dt);
      s.invulnerable = Math.max(0, s.invulnerable - dt);
      s.hurtTimer = Math.max(0, s.hurtTimer - dt);
      warningCooldown.current = Math.max(0, warningCooldown.current - dt);

      const dirInput = (moveR ? 1 : 0) - (moveL ? 1 : 0);
      if (dirInput !== 0) s.dir = dirInput;
      s.crouching = s.ground && wantCrouch && dirInput === 0 && s.dashTimer <= 0;

      if (s.dashTimer > 0) {
        s.vx = s.dir * DASH_SPEED;
        s.moving = true;
      } else {
        const targetVx = s.crouching ? 0 : dirInput * SPEED;
        const accel = dirInput !== 0 ? 1400 : 1800;
        if (Math.abs(targetVx - s.vx) <= accel * dt) s.vx = targetVx;
        else s.vx += Math.sign(targetVx - s.vx) * accel * dt;
        s.moving = Math.abs(s.vx) > 8;
      }

      s.x = Math.max(24, Math.min(level.W - 24, s.x + s.vx * dt));

      const freshJump = wantJump && !s.prevJump;
      s.prevJump = wantJump;

      if (wantJump && s.ground) {
        s.vy = JUMP;
        s.ground = false;
        s.jumps = 1;
        s.landTimer = 0;
        audio.sfx("jump");
      } else if (freshJump && !s.ground && s.jumps < 2) {
        s.vy = JUMP * 0.92;
        s.jumps = 2;
        s.djumpTimer = 0.36;
        audio.sfx("jump");
      }

      const wasGround = s.ground;
      s.vy -= GRAV * dt;
      const prevY = s.y;
      s.y += s.vy * dt;
      let landed = false;
      if (s.y <= 0) {
        s.y = 0;
        s.vy = 0;
        landed = true;
      } else if (s.vy <= 0) {
        for (const p of level.plats) {
          if (s.x > p.x - 8 && s.x < p.x + p.w + 8 && prevY >= p.y && s.y <= p.y) {
            s.y = p.y;
            s.vy = 0;
            landed = true;
            break;
          }
        }
      }
      if (landed && !wasGround) {
        s.landTimer = 0.16;
        s.jumps = 0;
      } else if (landed) {
        s.jumps = 0;
      }
      s.ground = landed;
      s.t += dt;
      playMem.island = ii;
      playMem.x = s.x;

      // Anjing berpatroli di sekitar harta yang dijaganya.
      for (const dog of dogs.current) {
        dog.hit = Math.max(0, dog.hit - dt);
        if (dog.dead) {
          dog.fade = Math.max(0, dog.fade - dt);
          continue;
        }
        if (dog.hit <= 0) {
          dog.x += dog.dir * 24 * dt;
          if (dog.x <= dog.origin - 32) dog.dir = 1;
          if (dog.x >= dog.origin + 32) dog.dir = -1;
        }
      }

      // Tembakan bergerak di dunia dan hanya mengenai anjing yang searah.
      for (const shot of projectiles.current) {
        const before = shot.x;
        shot.x += shot.dir * (shot.type === "plasma" ? 420 : 580) * dt;
        shot.life -= dt;
        if (shot.y > 58 || shot.y < 0) continue;
        const hit = dogs.current.find((dog) =>
          !dog.dead && dog.x >= Math.min(before, shot.x) - 22 && dog.x <= Math.max(before, shot.x) + 22,
        );
        if (hit) {
          damageDog(hit, shot.type === "plasma" ? 3 : 2, shot.dir);
          shot.life = 0;
        }
      }
      projectiles.current = projectiles.current.filter((shot) => shot.life > 0 && shot.x >= 0 && shot.x <= level.W);

      const collision = dogs.current.find((dog) => !dog.dead && dog.hit <= 0 && Math.abs(dog.x - s.x) < 25 && s.y < 38);
      if (collision && s.invulnerable <= 0) {
        const hearts = Math.max(0, heartsRef.current - 1);
        heartsRef.current = hearts;
        setSession({ hearts });
        s.invulnerable = 1.6;
        s.hurtTimer = 0.45;
        s.x = Math.max(24, Math.min(level.W - 24, s.x + (s.x < collision.x ? -30 : 30)));
        s.vy = 190;
        s.ground = false;
        audio.sfx("wrong");
        if (hearts === 0) {
          gameOver.current = true;
          go("kalah");
          return;
        }
        notify("Hati berkurang! Hindari robot anjing.");
      }

      const cy = s.y + 22;
      const canCollect = (guard: number | undefined) => {
        if (guard === undefined || dogs.current[guard]?.dead) return true;
        if (warningCooldown.current <= 0) {
          warningCooldown.current = 2;
          notify("Kalahkan robot anjing penjaga dulu!");
        }
        return false;
      };
      level.coins.forEach((c, i) => {
        if (!pr.coins.includes(i) && Math.abs(c.x - s.x) < 20 && Math.abs(c.y + 8 - cy) < 28 && canCollect(c.guard)) collect("coins", i);
      });
      level.pearls.forEach((c, i) => {
        if (!pr.pearls.includes(i) && Math.abs(c.x - s.x) < 20 && Math.abs(c.y + 8 - cy) < 28 && canCollect(c.guard)) collect("pearls", i);
      });
      if (!pr.key && Math.abs(level.key.x - s.x) < 22 && Math.abs(level.key.y + 10 - cy) < 30) collect("key", 0);

      setTick((t) => (t + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") input.current.l = down;
      else if (k === "arrowright" || k === "d") input.current.r = down;
      else if (k === "arrowup" || k === "w" || k === " ") input.current.j = down;
      else if (k === "arrowdown" || k === "s") input.current.d = down;
      else if (k === "shift" || k === "x") {
        if (down && !e.repeat) dashRef.current();
      } else if (k === "f" || k === "z" || k === "j") {
        if (down && !e.repeat) attackRef.current("punch");
      } else if (k === "k" || k === "c") {
        if (down && !e.repeat) attackRef.current("kick");
      } else if (k === "l" || k === "v") {
        if (down && !e.repeat) attackRef.current(playerRef.current.equippedWeapon);
      } else if (k === "q") {
        if (down && !e.repeat) go("senjata");
      } else if (k === "enter" || k === "e") {
        if (down && !e.repeat) actRef.current();
      } else return;
      e.preventDefault();
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    const blur = () => {
      input.current = { l: false, r: false, j: false, d: false };
      playInput.l = false;
      playInput.r = false;
      playInput.j = false;
      playInput.d = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
      blur();
    };
  }, [level, ii, updatePlayer, notify, setSession, go]);

  /* ---------- turunan per frame ---------- */
  const s = st.current;
  const bx = playMem.bleedX;
  const by = playMem.bleedY;
  const viewW = Math.min(level.W, VW + bx * 2);
  const cam = Math.max(0, Math.min(level.W - viewW, s.x - (200 + bx)));
  const par = (cam / Math.max(1, level.W - viewW)) * 160;
  const soalDone = prog.soal >= SOAL_TARGET;
  const tasksDone = prog.pearls.length >= PEARL_TARGET && soalDone && prog.key;
  const nearSt = level.stations.findIndex((sx) => Math.abs(sx - s.x) < 36 && s.y < 30);
  const canScan = nearSt >= 0 && !soalDone && prog.stations[nearSt] < PER_STATION;
  const nearChest = Math.abs(level.chest - s.x) < 44 && s.y < 30;
  const canOpen = nearChest && tasksDone && !prog.chest;
  const nearbyDog = dogs.current.some((dog) => !dog.dead && Math.abs(dog.x - s.x) < 115);

  const act = () => {
    if (canScan) {
      setSession({ station: nearSt, cards: null, q: null, result: null });
      go("scan");
    } else if (canOpen) {
      go("peti");
    } else {
      go("misi");
    }
  };
  actRef.current = act;

  // petunjuk arah ke tujuan berikutnya
  let target: { x: number; label: string } | null = null;
  if (!soalDone) {
    let best = Infinity;
    level.stations.forEach((sx, i) => {
      if (prog.stations[i] < PER_STATION && Math.abs(sx - s.x) < best) {
        best = Math.abs(sx - s.x);
        target = { x: sx, label: "Pos Kartu" };
      }
    });
  } else if (!prog.key) target = { x: level.key.x, label: "Kunci Peti" };
  else if (prog.pearls.length < PEARL_TARGET) {
    const i = level.pearls.findIndex((_, k) => !prog.pearls.includes(k));
    if (i >= 0) target = { x: level.pearls[i].x, label: "Mutiara" };
  } else if (!prog.chest) target = { x: level.chest, label: "Peti Harta" };
  const tg = target as { x: number; label: string } | null;
  const dx = tg ? tg.x - s.x : 0;

  const setKey = (k: "l" | "r" | "j" | "d") => (v: boolean) => {
    input.current[k] = v;
  };

  let robotAction: RobotAction = "idle";
  if (s.hurtTimer > 0) robotAction = "hurt";
  else if (s.attackTimer > 0) robotAction = s.attackType === "kick" ? "kick" : s.attackType === "punch" ? "attack" : "shoot";
  else if (s.dashTimer > 0) robotAction = "dash";
  else if (!s.ground) {
    if (s.djumpTimer > 0) robotAction = "doubleJump";
    else if (s.vy >= -40) robotAction = "jump";
    else robotAction = "fall";
  } else if (s.poseTimer > 0) robotAction = "victory";
  else if (s.crouching) robotAction = "crouch";
  else if (s.moving) robotAction = Math.abs(s.vx) > SPEED * 0.72 ? "run" : "walk";
  else if (s.landTimer > 0) robotAction = "land";

  const speedRatio = Math.min(1, Math.abs(s.vx) / SPEED);

  return (
    <Frame className="select-none">
      <img
        src={isl.img}
        alt=""
        className="absolute max-w-none object-cover"
        style={{
          left: -bx,
          top: -by,
          width: Math.max(640, viewW + 160),
          height: 320 + by * 2,
          transform: `translate3d(${-par}px,0,0)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a4d7a]/15 to-[#08324f]/40" />

      {/* ---------- dunia ---------- */}
      <div
        className="absolute h-full"
        style={{ left: -bx, bottom: -by, width: level.W, transform: `translate3d(${-cam}px,0,0)` }}
      >
        {level.deco.map((d, i) => (
          <span key={i} className="absolute block" style={{ left: d.x, bottom: GH - 3, width: d.s, height: d.s, color: d.c }}>
            <Ic n={d.n} className="h-full w-full drop-shadow-[0_2px_0_rgba(43,27,14,0.6)]" />
          </span>
        ))}

        {/* papan awal */}
        <div className="absolute flex flex-col items-center" style={{ left: 14, bottom: GH - 2 }}>
          <div className="wood rounded-md px-1.5 py-[1px]">
            <span className="font-display text-[9px] text-[#fff3c4]">{isl.name.toUpperCase()} ➜</span>
          </div>
          <div className="h-[14px] w-[6px] border-x-[3px] border-[#2b1b0e] bg-[#a9673a]" />
        </div>

        {/* tanah */}
        <div
          className="absolute bottom-0 left-0 border-t-[4px] border-[#2b1b0e]"
          style={{ width: level.W, height: GH, background: `linear-gradient(${isl.top} 0 9px, ${isl.ground[0]} 9px, ${isl.ground[1]})` }}
        />

        {level.plats.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-md border-[3px] border-[#2b1b0e] shadow-[0_3px_0_rgba(43,27,14,0.35)]"
            style={{
              left: p.x,
              bottom: GH + p.y - 14,
              width: p.w,
              height: 14,
              background: `linear-gradient(${isl.top} 0 5px, ${isl.ground[0]} 5px)`,
            }}
          />
        ))}

        {level.coins.map((c, i) => {
          const locked = c.guard !== undefined && !dogs.current[c.guard]?.dead;
          return prog.coins.includes(i) ? null : (
            <span
              key={i}
              className={`${locked ? "guarded-treasure" : "anim-coin"} absolute grid h-[16px] w-[16px] place-items-center rounded-full border-2 border-[#2b1b0e] bg-[#ffd54f]`}
              style={{ left: c.x - 8, bottom: GH + c.y }}
              aria-label={locked ? "Koin dijaga robot anjing" : "Koin terbuka"}
            >
              <span className="h-[5px] w-[5px] rounded-full bg-[#e08a00]" />
              {locked && <Ic n="lock" className="absolute -right-1 -top-1 h-2.5 w-2.5 text-[#382b3c]" />}
            </span>
          );
        })}

        {level.pearls.map((c, i) => {
          const locked = c.guard !== undefined && !dogs.current[c.guard]?.dead;
          return prog.pearls.includes(i) ? null : (
            <span
              key={i}
              className={`${locked ? "guarded-treasure" : "anim-bob"} absolute`}
              style={{ left: c.x - 9, bottom: GH + c.y }}
              aria-label={locked ? "Mutiara dijaga robot anjing" : "Mutiara terbuka"}
            >
              <Pearl size={18} />
              {locked && <Ic n="lock" className="absolute -right-1 -top-1 h-3 w-3 text-[#382b3c]" />}
            </span>
          );
        })}

        {/* Penjaga berpindah-pindah di depan poin, lalu menghilang saat dikalahkan. */}
        {dogs.current.map((dog) => dog.dead && dog.fade <= 0 ? null : (
          <div
            key={dog.id}
            data-dog-id={dog.id}
            data-hp={dog.hp}
            data-defeated={dog.dead}
            className="absolute w-[56px]"
            style={{ left: dog.x - 28, bottom: GH - 2, opacity: dog.dead ? dog.fade / 0.55 : 1 }}
            role="img"
            aria-label={`Robot anjing penjaga ${dog.id + 1}, energi ${dog.hp} dari 3`}
          >
            {!dog.dead && (
              <div className="absolute -top-[6px] left-1/2 h-[7px] w-[30px] -translate-x-1/2 overflow-hidden rounded-full border-[2px] border-[#2b1b0e] bg-[#eee2d2]">
                <div className="h-full bg-[#ff784e] transition-[width]" style={{ width: `${dog.hp / 3 * 100}%` }} />
              </div>
            )}
            <img
              src={dogSprite}
              alt=""
              draggable={false}
              className={`dog-sprite w-full ${dog.hit > 0 ? "dog-hit" : "dog-patrol"}`}
              style={{ transform: `scaleX(${dog.dir < 0 ? 1 : -1})` }}
            />
          </div>
        ))}

        {projectiles.current.map((shot) => (
          <span
            key={shot.id}
            data-projectile={shot.type}
            className={`game-shot game-shot-${shot.type}`}
            style={{ left: shot.x - (shot.type === "plasma" ? 8 : 12), bottom: GH + shot.y - 4, transform: `scaleX(${shot.dir})` }}
          />
        ))}

        {!prog.key && (
          <span className="anim-bob anim-glow absolute text-[#ffb300]" style={{ left: level.key.x - 12, bottom: GH + level.key.y }}>
            <Ic n="key" className="h-6 w-6 drop-shadow-[0_2px_0_#2b1b0e]" />
          </span>
        )}

        {/* pos kartu */}
        {level.stations.map((sx, i) => {
          const n = prog.stations[i];
          const done = n >= PER_STATION || soalDone;
          return (
            <div key={i} className="absolute flex w-[48px] flex-col items-center" style={{ left: sx - 24, bottom: GH - 2 }}>
              {nearSt === i && !done && (
                <span className="anim-bob mb-1 whitespace-nowrap rounded-full border-2 border-[#2b1b0e] bg-[#ffd54f] px-1.5 text-[9px] font-black leading-[14px] text-[#2b1b0e]">
                  Scan di sini!
                </span>
              )}
              <div
                className={`relative grid h-[40px] w-[44px] place-items-center rounded-lg border-[3px] border-[#2b1b0e] shadow-[0_3px_0_rgba(43,27,14,0.35)] ${
                  done ? "bg-[#37c871] text-white" : "bg-white text-[#2b1b0e]"
                }`}
              >
                <Ic n={done ? "check" : "qr"} className="h-6 w-6" />
                <span className="absolute -right-2 -top-2 rounded-full border-2 border-[#2b1b0e] bg-[#7c3aed] px-1 text-[8px] font-black leading-[12px] text-white">
                  {Math.min(n, PER_STATION)}/{PER_STATION}
                </span>
              </div>
              <div className="h-[18px] w-[8px] border-x-[3px] border-[#2b1b0e] bg-[#a9673a]" />
            </div>
          );
        })}

        {/* peti */}
        <div className="absolute flex w-[60px] flex-col items-center" style={{ left: level.chest - 30, bottom: GH - 2 }}>
          {nearChest && !prog.chest && (
            <span className="anim-bob mb-1 whitespace-nowrap rounded-full border-2 border-[#2b1b0e] bg-[#ffd54f] px-1.5 text-[9px] font-black leading-[14px] text-[#2b1b0e]">
              {tasksDone ? "Buka peti!" : "Misi belum selesai"}
            </span>
          )}
          <div
            className={`grid h-[44px] w-[56px] place-items-center rounded-lg border-[3px] border-[#2b1b0e] shadow-[0_4px_0_rgba(43,27,14,0.5)] ${
              prog.chest ? "bg-[#37c871] text-white" : "bg-[#a9673a] text-[#ffd54f]"
            } ${tasksDone && !prog.chest ? "anim-glow" : ""}`}
          >
            <Ic n={prog.chest ? "check" : "chest"} className="h-8 w-8" />
          </div>
        </div>

        {/* robot */}
        <div
          className={`absolute w-[52px] ${s.invulnerable > 0 ? "robot-invulnerable" : ""}`}
          style={{ left: s.x - 23, bottom: GH + s.y - 2, transform: `scaleX(${s.dir})` }}
          data-player-x={s.x.toFixed(1)}
          data-player-y={s.y.toFixed(1)}
          data-player-action={robotAction}
        >
          <Robot
            className="w-full drop-shadow-[0_3px_0_rgba(0,0,0,0.28)]"
            mood={s.poseTimer > 0 || !s.ground ? "cheer" : "happy"}
            action={robotAction}
            speed={speedRatio}
          />
          {s.attackTimer > 0 && (s.attackType === "punch" || s.attackType === "kick") && (
            <span className="combat-spark" aria-hidden="true"><Ic n="sparkle" className="h-5 w-5" /></span>
          )}
        </div>
      </div>

      {/* ---------- HUD ---------- */}
      <div
        className="absolute z-20 flex items-center gap-1.5"
        style={{ left: 8 - bx, right: 8 - bx, top: 8 - by }}
      >
        <div aria-label={`${session.hearts} hati tersisa`} role="status" className="flex items-center gap-1 rounded-full border-[3px] border-[#2b1b0e] bg-white/95 py-[2px] pl-[3px] pr-2 shadow-[0_3px_0_rgba(43,27,14,0.45)]">
          <Avatar className="h-6 w-6" shirt={SHIRTS[player.avatar % SHIRTS.length]} />
          {[0, 1, 2].map((h) => (
            <Ic key={h} n="heart" className={`h-4 w-4 ${h < session.hearts ? "text-[#e53935]" : "text-[#d9cbb3]"}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go("misi")}
          aria-label="Lihat misi"
          className="mx-auto flex items-center gap-1.5 rounded-full border-[3px] border-[#2b1b0e] bg-white/95 px-2 py-[4px] text-[11px] font-extrabold tabular-nums text-[#2b1b0e] shadow-[0_3px_0_rgba(43,27,14,0.45)]"
        >
          <Pearl size={12} /> {prog.pearls.length}/{PEARL_TARGET}
          <Ic n="qr" className="ml-1 h-3.5 w-3.5 text-[#7c3aed]" /> {prog.soal}/{SOAL_TARGET}
          <Ic n="key" className={`ml-1 h-4 w-4 ${prog.key ? "text-[#e09b00]" : "text-[#c9c1b4]"}`} />
        </button>
        <div className="flex items-center gap-1 rounded-full border-[3px] border-[#2b1b0e] bg-[#fff8e6] px-2 py-[3px] shadow-[0_3px_0_rgba(43,27,14,0.45)]">
          <Ic n="star" className="h-4 w-4 text-[#ff9f1c]" />
          <span className="font-display text-[13px] tabular-nums">{player.poin}</span>
        </div>
        <Btn tone="purple" onClick={() => go("senjata")} ariaLabel="Buka gudang senjata" className="px-2 py-[4px] text-[10px]">
          <span className="flex items-center gap-1"><Ic n="bolt" className="h-3.5 w-3.5" /> Senjata</span>
        </Btn>
        <Btn tone="yellow" onClick={back} ariaLabel="Keluar ke pilih pulau" className="grid h-7 w-7 place-items-center">
          <Ic n="home" className="h-3.5 w-3.5" />
        </Btn>
      </div>

      {/* petunjuk */}
      {nearbyDog ? (
        <div className="absolute left-1/2 top-[44px] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border-[3px] border-[#2b1b0e] bg-[#ffcf4d] px-3 py-[3px] text-[10px] font-extrabold text-[#2b1b0e] shadow-[0_3px_0_rgba(43,27,14,0.45)]">
          Robot anjing menjaga poin! Pukul (J), tendang (K), atau tembak (L).
        </div>
      ) : s.x < 190 && prog.soal === 0 && prog.pearls.length === 0 ? (
        <div className="absolute left-1/2 top-[44px] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border-[3px] border-[#2b1b0e] bg-[#7c3aed] px-3 py-[3px] text-[11px] font-extrabold text-white shadow-[0_3px_0_rgba(43,27,14,0.45)]">
          Jalan dan lompat, lalu hadapi penjaga untuk membuka poin!
        </div>
      ) : (
        tg &&
        Math.abs(dx) > 90 && (
          <div
            className={`absolute top-[46px] z-10 flex items-center gap-1 rounded-full border-[3px] border-[#2b1b0e] bg-white/95 px-2 py-[2px] text-[10px] font-extrabold text-[#2b1b0e] shadow-[0_3px_0_rgba(43,27,14,0.45)] ${
              dx > 0 ? "right-2" : "left-2"
            }`}
          >
            {dx < 0 && <Ic n="left" className="h-3 w-3 text-[#e53935]" />}
            {tg.label} · {Math.round(Math.abs(dx) / 10)} m
            {dx > 0 && <Ic n="right" className="h-3 w-3 text-[#e53935]" />}
          </div>
        )
      )}

      {/* ---------- kontrol ---------- */}
      <div
        className="play-touch-controls absolute z-20 flex items-end gap-1.5"
        style={{ left: 8 - bx, bottom: 8 - by }}
      >
        <Hold set={setKey("l")} label="Jalan ke kiri" className="h-10 w-11">
          <Ic n="left" className="h-5 w-5" />
        </Hold>
        <Hold set={setKey("d")} label="Merunduk" className="h-9 w-9 !bg-[#1173b8]">
          <Ic n="down" className="h-4 w-4" />
        </Hold>
        <Hold set={setKey("r")} label="Jalan ke kanan" className="h-10 w-11">
          <Ic n="right" className="h-5 w-5" />
        </Hold>
      </div>
      <div
        className="play-touch-controls absolute z-20 flex items-end gap-1.5"
        style={{ right: 8 - bx, bottom: 8 - by }}
      >
        <Btn
          tone={canScan ? "green" : canOpen ? "yellow" : "purple"}
          onClick={act}
          className={`px-2.5 py-[9px] text-[12px] leading-none ${canScan || canOpen ? "anim-bob" : ""}`}
        >
          <span className="flex items-center gap-1">
            <Ic n={canScan ? "camera" : canOpen ? "chest" : "book"} className="h-4 w-4" />
            {canScan ? "Scan Kartu" : canOpen ? "Buka Peti" : "Misi"}
          </span>
        </Btn>
        <button
          type="button"
          data-quiet=""
          aria-label="Pukul robot anjing"
          onClick={() => triggerAttack("punch")}
          className="btn3d flex h-10 w-9 flex-col items-center justify-center bg-[#ffd54f] text-[#2b1b0e]"
          title="Pukul (J)"
        >
          <Ic n="fist" className="h-4 w-4" />
          <span className="text-[6px] font-black">PUKUL</span>
        </button>
        <button
          type="button"
          data-quiet=""
          aria-label="Tendang robot anjing"
          onClick={() => triggerAttack("kick")}
          className="btn3d flex h-10 w-9 flex-col items-center justify-center bg-[#ff8a3d] text-white"
          title="Tendang (K)"
        >
          <Ic n="kick" className="h-4 w-4" />
          <span className="text-[6px] font-black">TENDANG</span>
        </button>
        <button
          type="button"
          data-quiet=""
          aria-label={`Tembak ${player.equippedWeapon}`}
          onClick={() => triggerAttack(player.equippedWeapon)}
          className={`btn3d flex h-10 w-9 flex-col items-center justify-center text-white ${player.equippedWeapon === "plasma" ? "bg-[#7c3aed]" : "bg-[#00a7c9]"}`}
          title={`Tembak ${player.equippedWeapon} (L)`}
        >
          <Ic n="bolt" className="h-4 w-4" />
          <span className="text-[6px] font-black">TEMBAK</span>
        </button>
        <button
          type="button"
          data-quiet=""
          aria-label="Meluncur cepat"
          onClick={triggerDash}
          className="btn3d grid h-9 w-9 place-items-center bg-[#00b4d8] text-white"
          title="Meluncur Cepat / Dash (Shift / X)"
        >
          <Ic n="bolt" className="h-4 w-4" />
        </button>
        <Hold set={setKey("j")} label="Lompat" className="h-10 w-11 !bg-[#ff8a3d]">
          <Ic n="up" className="h-5 w-5" />
        </Hold>
      </div>
    </Frame>
  );
}

/* ============ 7. PANEL MISI ============ */
export function Misi() {
  const { player, session, back, updatePlayer, notify } = useGame();
  const ii = session.island;
  const isl = ISLANDS[ii];
  const prog = player.islands[ii];
  const rows = [
    { ok: prog.pearls.length >= PEARL_TARGET, text: `Kumpulkan ${PEARL_TARGET} mutiara (${Math.min(prog.pearls.length, PEARL_TARGET)}/${PEARL_TARGET})` },
    { ok: prog.soal >= SOAL_TARGET, text: `Pindai kartu & jawab soal (${prog.soal}/${SOAL_TARGET})` },
    { ok: prog.key, text: "Temukan kunci peti" },
  ];
  const all = rows.every((r) => r.ok);

  const claim = () => {
    if (!all || prog.claimed) return;
    updatePlayer((p) => {
      const it = p.islands[ii];
      if (it.claimed) return p;
      return { ...withIsland(p, ii, { ...it, claimed: true }), poin: p.poin + 20, kristal: p.kristal + 3 };
    });
    audio.sfx("star");
    notify("+20 Poin · +3 Kristal");
  };

  return (
    <Frame>
      <div className="absolute inset-0 bg-gradient-to-b from-[#5cc3f5] to-[#d6f0ff]" />
      <TopBar title={`Misi Pulau ${isl.name}`} onBack={back} />
      <div className="parch absolute inset-x-4 bottom-3 top-[52px] rounded-2xl px-3 py-2.5">
        <ul className="space-y-[7px]">
          {rows.map((r) => (
            <li key={r.text} className="flex items-center gap-2 rounded-lg border-[3px] border-[#c9a24b] bg-white px-2 py-[5px] shadow-[0_2px_0_rgba(43,27,14,0.2)]">
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded border-[3px] ${
                  r.ok ? "border-[#2b1b0e] bg-[#37c871] text-white" : "border-[#8a6a4a] bg-white"
                }`}
              >
                {r.ok && <Ic n="check" className="h-3 w-3" />}
              </span>
              <span className={`text-[13px] font-bold ${r.ok ? "text-[#2b1b0e]" : "text-[#6b5233]"}`}>{r.text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-2.5 rounded-xl border-[3px] border-[#4a2a12] bg-gradient-to-b from-[#ffeab4] to-[#f7cf6f] px-2 py-1.5">
          <div className="flex items-center gap-2">
            <span className="font-display text-[13px] tracking-wide text-[#5b3212]">Hadiah Misi</span>
            <span className="flex items-center gap-1 rounded-full border-[3px] border-[#2b1b0e] bg-white px-2 py-[1px]">
              <Ic n="star" className="h-3.5 w-3.5 text-[#ff9f1c]" />
              <span className="font-display text-[12px]">20 Poin</span>
            </span>
            <span className="flex items-center gap-1 rounded-full border-[3px] border-[#2b1b0e] bg-white px-2 py-[1px]">
              <Ic n="crystal" className="h-3.5 w-3.5 text-[#7c3aed]" />
              <span className="font-display text-[12px]">3 Kristal</span>
            </span>
            <Ic n="chest" className="ml-auto h-7 w-7 text-[#a9673a]" />
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Btn tone={all && !prog.claimed ? "green" : "white"} onClick={claim} className={`px-3 py-[5px] text-[12px] ${all && !prog.claimed ? "" : "opacity-70"}`}>
              {prog.claimed ? "Sudah diklaim ✓" : all ? "Klaim Hadiah" : "Selesaikan 3 misi dulu"}
            </Btn>
            <span className="text-[11px] font-bold leading-tight text-[#6b4a1e]">
              {prog.chest
                ? "Peti sudah dibuka. Hebat!"
                : all
                  ? "Semua beres! Buka peti di ujung pulau."
                  : "Peti di ujung pulau terbuka jika 3 misi selesai."}
            </span>
          </div>
        </div>
      </div>
    </Frame>
  );
}
