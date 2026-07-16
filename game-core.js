export const SNAKE_DIRECTIONS = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});

const SNAKE_REVERSE = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatClock(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function randomChoice(items, random) {
  if (!items.length) {
    return null;
  }
  return items[Math.floor(random() * items.length)];
}

function randomInt(min, max, random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function cloneVector(vector) {
  return { x: vector.x, y: vector.y };
}

function shuffle(items, random) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function safeStorageRead(storage, key, fallback) {
  if (!storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeStorageWrite(storage, key, value) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in private mode or locked-down contexts.
  }
}

export class SnakeCore {
  constructor({ cols = 20, rows = 20, highScore = 0 } = {}) {
    this.cols = cols;
    this.rows = rows;
    this.highScore = highScore;
    this.reset();
  }

  reset() {
    const midX = Math.floor(this.cols / 2);
    const midY = Math.floor(this.rows / 2);

    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    this.direction = cloneVector(SNAKE_DIRECTIONS.right);
    this.nextDirection = cloneVector(SNAKE_DIRECTIONS.right);
    this.food = this.spawnFood();
    this.score = 0;
    this.status = 'idle';
    this.message = '대기';
    this.pendingGrowth = 0;
    this.speedMs = 140;
  }

  start() {
    if (this.status === 'over') {
      this.reset();
    }

    this.status = 'running';
    this.message = '진행 중';
    return this.status;
  }

  pause() {
    if (this.status === 'running') {
      this.status = 'paused';
      this.message = '일시정지';
    }

    return this.status;
  }

  togglePause() {
    if (this.status === 'running') {
      return this.pause();
    }

    if (this.status === 'paused') {
      return this.start();
    }

    return this.status;
  }

  restart() {
    this.reset();
    this.status = 'running';
    this.message = '새 게임';
    return this.status;
  }

  canTurn(direction) {
    if (this.snake.length < 2) {
      return true;
    }

    const reverse = SNAKE_REVERSE[this.directionName()];
    return direction !== reverse;
  }

  directionName() {
    const vector = this.direction;
    if (vector.x === 0 && vector.y === -1) return 'up';
    if (vector.x === 0 && vector.y === 1) return 'down';
    if (vector.x === -1 && vector.y === 0) return 'left';
    return 'right';
  }

  setDirection(directionName) {
    const direction = SNAKE_DIRECTIONS[directionName];
    if (!direction) {
      return false;
    }

    if (this.status === 'idle') {
      this.start();
    }

    if (!this.canTurn(directionName)) {
      return false;
    }

    this.nextDirection = cloneVector(direction);
    return true;
  }

  syncHighScore() {
    this.highScore = Math.max(this.highScore, this.score);
  }

  step() {
    if (this.status !== 'running') {
      return { moved: false, ateFood: false, ended: false };
    }

    this.direction = cloneVector(this.nextDirection);
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y,
    };

    const willGrow = head.x === this.food.x && head.y === this.food.y;
    const outOfBounds = head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows;
    const bodyToCheck = willGrow ? this.snake : this.snake.slice(0, -1);
    const hitsBody = bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y);

    if (outOfBounds || hitsBody) {
      this.status = 'over';
      this.message = '게임 오버';
      this.syncHighScore();
      return { moved: false, ateFood: false, ended: true };
    }

    this.snake.unshift(head);
    const ateFood = willGrow;

    if (ateFood) {
      this.score += 10;
      this.pendingGrowth += 1;
      this.syncHighScore();
      this.food = this.spawnFood();
      this.speedMs = Math.max(78, 140 - Math.floor(this.score / 40) * 8);
    }

    if (this.pendingGrowth > 0) {
      this.pendingGrowth -= 1;
    } else {
      this.snake.pop();
    }

    return { moved: true, ateFood, ended: false };
  }

  spawnFood() {
    const occupied = new Set(this.snake.map((segment) => `${segment.x}:${segment.y}`));
    const emptyCells = [];

    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.cols; x += 1) {
        const key = `${x}:${y}`;
        if (!occupied.has(key)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (!emptyCells.length) {
      return { x: 0, y: 0 };
    }

    return randomChoice(emptyCells, Math.random) ?? { x: 0, y: 0 };
  }
}

const DEFAULT_PERKS = Object.freeze({
  maxHp: 0,
  attack: 0,
  pickup: 0,
  coins: 0,
});

const PERK_COSTS = {
  maxHp: [20, 35, 50, 70, 95],
  attack: [20, 35, 50, 70, 95],
  pickup: [15, 30, 45, 65, 85],
};

const WEAPON_NAMES = ['spark', 'orbit', 'burst'];
const ELEVATION_LIMIT = 2;
const SURVIVOR_LIMITS = Object.freeze({
  enemies: 240,
  projectiles: 360,
  waves: 16,
  pickups: 320,
});

export class SurvivorCore {
  constructor({ storage = null, random = Math.random } = {}) {
    this.storage = storage;
    this.random = random;
    this.perks = this.loadPerks();
    this.resetRun();
  }

  loadPerks() {
    const stored = safeStorageRead(this.storage, 'loop-engineer-survivor-perks', DEFAULT_PERKS);
    const loaded = stored && typeof stored === 'object' && !Array.isArray(stored)
      ? stored
      : DEFAULT_PERKS;
    return {
      maxHp: clamp(Math.floor(Number(loaded.maxHp) || 0), 0, 5),
      attack: clamp(Math.floor(Number(loaded.attack) || 0), 0, 5),
      pickup: clamp(Math.floor(Number(loaded.pickup) || 0), 0, 5),
      coins: Math.max(0, Math.floor(Number(loaded.coins) || 0)),
    };
  }

  savePerks() {
    safeStorageWrite(this.storage, 'loop-engineer-survivor-perks', this.perks);
  }

  resetPerks() {
    this.perks = { ...DEFAULT_PERKS };
    this.savePerks();
  }

  canAffordPerk(perkName) {
    const level = this.perks[perkName];
    const costTable = PERK_COSTS[perkName];
    if (!costTable || level >= costTable.length) {
      return false;
    }

    return this.perks.coins >= costTable[level];
  }

  buyPerk(perkName) {
    const level = this.perks[perkName];
    const costTable = PERK_COSTS[perkName];
    if (!costTable || level >= costTable.length) {
      return { bought: false, reason: 'maxed' };
    }

    const cost = costTable[level];
    if (this.perks.coins < cost) {
      return { bought: false, reason: 'coins' };
    }

    this.perks.coins -= cost;
    this.perks[perkName] += 1;
    this.savePerks();
    return { bought: true, cost };
  }

  resetRun() {
    this.world = {
      width: 1800,
      height: 1000,
    };
    this.clock = 0;
    this.spawnTimer = 0;
    this.bossFireTimer = 0;
    this.status = 'idle';
    this.message = '시작을 누르세요';
    this.remainingTime = 300;
    this.elapsed = 0;
    this.level = 1;
    this.exp = 0;
    this.expToNext = 30;
    this.evolutionsUsed = 0;
    this.choiceMode = null;
    this.choices = [];
    this.enemyCounter = 0;
    this.projectileCounter = 0;
    this.waveCounter = 0;
    this.pickupsCounter = 0;
    this.bossCounter = 0;

    this.player = {
      x: this.world.width / 2,
      y: this.world.height / 2,
      moveX: 0,
      moveY: 0,
      speed: 260 + this.perks.pickup * 5,
      maxHp: 100 + this.perks.maxHp * 10,
      hp: 100 + this.perks.maxHp * 10,
      attackBonus: 1 + this.perks.attack * 0.08,
      pickupRadius: 106 + this.perks.pickup * 14,
      invuln: 0,
      coinsThisRun: 0,
    };

    this.weapons = {
      spark: { level: 1, evolved: false, cooldown: 0 },
      orbit: { level: 1, evolved: false, cooldown: 0, phase: 0 },
      burst: { level: 1, evolved: false, cooldown: 0 },
    };

    this.enemies = [];
    this.projectiles = [];
    this.waves = [];
    this.pickups = [];
    this.boss = null;
    this.bossSpawned = false;
    this.bossDefeated = false;
  }

  startRun() {
    if (this.status === 'choice') {
      return this.status;
    }

    if (this.status === 'idle' || this.status === 'victory' || this.status === 'defeat') {
      this.resetRun();
    }

    this.status = 'running';
    this.message = '전투 시작';
    return this.status;
  }

  pauseRun() {
    if (this.status === 'running') {
      this.status = 'paused';
      this.message = '일시정지';
    }

    return this.status;
  }

  togglePause() {
    if (this.status === 'running') {
      return this.pauseRun();
    }

    if (this.status === 'paused') {
      return this.startRun();
    }

    return this.status;
  }

  setDirection(directionName) {
    const direction = SNAKE_DIRECTIONS[directionName];
    if (!direction) {
      return false;
    }

    return this.setMovement(direction.x, direction.y);
  }

  setMovement(x, y) {
    const moveX = clamp(Number(x) || 0, -1, 1);
    const moveY = clamp(Number(y) || 0, -1, 1);
    if (this.status === 'idle' && (moveX !== 0 || moveY !== 0)) {
      this.startRun();
    }

    this.player.moveX = moveX;
    this.player.moveY = moveY;

    return true;
  }

  stopMovement() {
    this.player.moveX = 0;
    this.player.moveY = 0;
  }

  applyChoice(choiceId) {
    const choice = this.choices.find((item) => item.id === choiceId);
    if (!choice) {
      return false;
    }

    choice.apply(this);
    this.choices = [];
    this.choiceMode = null;
    if (this.status === 'choice') {
      this.status = 'running';
      this.message = '업그레이드 반영';
    }
    return true;
  }

  gainCoins(amount) {
    this.perks.coins += Math.max(0, amount);
    this.savePerks();
  }

  awardRunCoins(amount) {
    this.player.coinsThisRun += amount;
    this.gainCoins(amount);
  }

  levelUp() {
    this.level += 1;
    this.exp -= this.expToNext;
    this.expToNext = Math.floor(28 + this.level * 14);
    this.choiceMode = 'levelup';
    this.status = 'choice';
    this.message = '업그레이드 선택';
    this.choices = this.buildChoices();
  }

  buildChoices() {
    const pool = [
      {
        id: 'spark',
        label: '직선 투사체 강화',
        detail: '기본 투사체의 수와 피해를 늘립니다.',
        apply: (core) => {
          core.weapons.spark.level = Math.min(5, core.weapons.spark.level + 1);
          core.player.attackBonus += 0.05;
        },
      },
      {
        id: 'orbit',
        label: '회전 칼날 강화',
        detail: '주변 공격의 반경과 피해를 늘립니다.',
        apply: (core) => {
          core.weapons.orbit.level = Math.min(5, core.weapons.orbit.level + 1);
        },
      },
      {
        id: 'burst',
        label: '폭발 파동 강화',
        detail: '주기적 범위 공격의 폭을 넓힙니다.',
        apply: (core) => {
          core.weapons.burst.level = Math.min(5, core.weapons.burst.level + 1);
        },
      },
      {
        id: 'hp',
        label: '최대 체력 +12',
        detail: '현재 런의 생존력을 조금 더 높입니다.',
        apply: (core) => {
          core.player.maxHp += 12;
          core.player.hp = Math.min(core.player.maxHp, core.player.hp + 12);
        },
      },
      {
        id: 'speed',
        label: '이동 속도 +8%',
        detail: '회피와 위치 선정이 쉬워집니다.',
        apply: (core) => {
          core.player.speed *= 1.08;
        },
      },
      {
        id: 'pickup',
        label: '흡수 반경 +14',
        detail: '경험치를 더 넓게 끌어옵니다.',
        apply: (core) => {
          core.player.pickupRadius += 14;
        },
      },
    ];

    const evolutions = WEAPON_NAMES
      .filter((weaponName) => this.canEvolve(weaponName))
      .map((weaponName) => ({
        id: `evolve-${weaponName}`,
        label: `${this.weaponLabel(weaponName)} 진화`,
        detail: '최대 단계 무기를 한 번 진화시킵니다.',
        apply: (core) => {
          core.evolveWeapon(weaponName);
        },
      }));

    const upgradeablePool = pool.filter((choice) => (
      !WEAPON_NAMES.includes(choice.id) || this.weapons[choice.id].level < 5
    ));
    const available = shuffle([...upgradeablePool, ...evolutions], this.random);

    const selected = [];
    const used = new Set();

    for (const choice of available) {
      if (selected.length >= 3) {
        break;
      }

      if (used.has(choice.id)) {
        continue;
      }

      selected.push(choice);
      used.add(choice.id);
    }

    while (selected.length < 3) {
      const filler = pool.find((choice) => !used.has(choice.id));
      if (!filler) {
        break;
      }

      selected.push(filler);
      used.add(filler.id);
    }

    return selected.slice(0, 3);
  }

  weaponLabel(weaponName) {
    if (weaponName === 'spark') return '직선 투사체';
    if (weaponName === 'orbit') return '회전 칼날';
    return '폭발 파동';
  }

  canEvolve(weaponName) {
    const weapon = this.weapons[weaponName];
    return Boolean(weapon && weapon.level >= 5 && !weapon.evolved && this.evolutionsUsed < ELEVATION_LIMIT);
  }

  evolveWeapon(weaponName) {
    const weapon = this.weapons[weaponName];
    if (!weapon || weapon.evolved || weapon.level < 5 || this.evolutionsUsed >= ELEVATION_LIMIT) {
      return false;
    }

    weapon.evolved = true;
    this.evolutionsUsed += 1;
    this.message = `${this.weaponLabel(weaponName)} 진화`;
    return true;
  }

  update(dt) {
    if (this.status !== 'running') {
      return;
    }

    this.clock += dt;
    this.elapsed += dt;
    this.remainingTime = Math.max(0, 300 - this.elapsed);
    this.player.invuln = Math.max(0, this.player.invuln - dt);

    if (!this.bossSpawned && this.elapsed >= 270) {
      this.spawnBoss();
    }

    this.spawnTimer += dt;
    const spawnInterval = clamp(1.05 - this.elapsed / 360, 0.26, 1.05);
    while (this.spawnTimer >= spawnInterval) {
      this.spawnTimer -= spawnInterval;
      this.spawnEnemy();
    }

    this.updatePlayer(dt);
    this.updateWeapons(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateWaves(dt);
    this.collectPickups(dt);
    this.handleProgression();
  }

  updatePlayer(dt) {
    const length = Math.hypot(this.player.moveX, this.player.moveY) || 1;
    const dirX = this.player.moveX / length;
    const dirY = this.player.moveY / length;

    this.player.x += dirX * this.player.speed * dt;
    this.player.y += dirY * this.player.speed * dt;
    this.player.x = clamp(this.player.x, 48, this.world.width - 48);
    this.player.y = clamp(this.player.y, 48, this.world.height - 48);
  }

  updateWeapons(dt) {
    const spark = this.weapons.spark;
    const orbit = this.weapons.orbit;
    const burst = this.weapons.burst;

    spark.cooldown -= dt;
    orbit.cooldown -= dt;
    orbit.phase += dt * (1.6 + orbit.level * 0.08);
    burst.cooldown -= dt;

    const sparkDelay = spark.evolved ? 0.45 : Math.max(0.5, 1.0 - spark.level * 0.09);
    const orbitPulse = orbit.evolved ? 0.8 : Math.max(1.1, 2.2 - orbit.level * 0.15);
    const burstDelay = burst.evolved ? 3.0 : Math.max(3.2, 5.0 - burst.level * 0.32);

    if (spark.cooldown <= 0) {
      this.fireSpark();
      spark.cooldown = sparkDelay;
    }

    if (orbit.cooldown <= 0) {
      this.fireOrbit();
      orbit.cooldown = orbitPulse;
    }

    if (burst.cooldown <= 0) {
      this.fireBurst();
      burst.cooldown = burstDelay;
    }
  }

  targetVector() {
    const enemy = this.nearestEnemy();
    if (enemy) {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const length = Math.hypot(dx, dy) || 1;
      return { x: dx / length, y: dy / length };
    }

    const moveLength = Math.hypot(this.player.moveX, this.player.moveY);
    if (moveLength > 0) {
      return { x: this.player.moveX / moveLength, y: this.player.moveY / moveLength };
    }

    return { x: 0, y: -1 };
  }

  fireSpark() {
    const weapon = this.weapons.spark;
    const aim = this.targetVector();
    const baseDamage = (10 + weapon.level * 4) * this.player.attackBonus;
    const bulletSpeed = weapon.evolved ? 740 : 640;

    const angles = weapon.evolved ? [-0.16, 0, 0.16] : [0];
    for (const angle of angles) {
      if (this.projectiles.length >= SURVIVOR_LIMITS.projectiles) {
        break;
      }
      const vx = aim.x * Math.cos(angle) - aim.y * Math.sin(angle);
      const vy = aim.x * Math.sin(angle) + aim.y * Math.cos(angle);
      this.projectiles.push({
        id: `spark-${this.projectileCounter += 1}`,
        kind: 'spark',
        x: this.player.x,
        y: this.player.y,
        vx: vx * bulletSpeed,
        vy: vy * bulletSpeed,
        damage: baseDamage,
        radius: weapon.evolved ? 10 : 8,
        life: 2.4,
        pierce: weapon.evolved ? 1 : 0,
      });
    }
  }

  fireOrbit() {
    const weapon = this.weapons.orbit;
    const blades = weapon.evolved ? 6 : 3;
    const radius = weapon.evolved ? 118 : 88 + weapon.level * 7;
    const damage = (9 + weapon.level * 3) * this.player.attackBonus;

    for (let index = 0; index < blades; index += 1) {
      const angle = orbitAngle(this.clock, blades, index, weapon.phase);
      const bladeX = this.player.x + Math.cos(angle) * radius;
      const bladeY = this.player.y + Math.sin(angle) * radius;
      const targets = this.enemies.filter((enemy) => {
        if (enemy.dead) {
          return false;
        }

        const range = enemy.kind === 'boss' ? 52 : 26;
        return distance(enemy.x, enemy.y, bladeX, bladeY) <= range;
      });

      for (const target of targets) {
        this.damageEnemy(target, damage, 'orbit');
      }
    }
  }

  fireBurst() {
    const weapon = this.weapons.burst;
    if (this.waves.length >= SURVIVOR_LIMITS.waves) {
      return;
    }
    this.waves.push({
      id: `wave-${this.waveCounter += 1}`,
      radius: 18,
      maxRadius: weapon.evolved ? 240 + weapon.level * 8 : 180 + weapon.level * 10,
      speed: weapon.evolved ? 240 : 200,
      damage: (16 + weapon.level * 5) * this.player.attackBonus,
      kind: weapon.evolved ? 'evolved' : 'base',
    });
  }

  updateEnemies(dt) {
    for (const enemy of this.enemies) {
      if (enemy.dead) {
        continue;
      }

      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const length = Math.hypot(dx, dy) || 1;
      const speed = enemy.kind === 'boss' ? enemy.speed : enemy.speed + Math.min(24, this.elapsed / 20);
      enemy.x += (dx / length) * speed * dt;
      enemy.y += (dy / length) * speed * dt;

      if (enemy.kind === 'boss') {
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0) {
          enemy.fireTimer = 1.8;
          this.fireBossShot(enemy);
        }
      }

      const contactRadius = enemy.kind === 'boss' ? 70 : 24;
      const hitPlayer = distance(enemy.x, enemy.y, this.player.x, this.player.y) <= contactRadius + 26;
      if (hitPlayer && this.player.invuln <= 0) {
        const damage = enemy.kind === 'boss' ? 24 : 12;
        this.player.hp -= damage;
        this.player.invuln = enemy.kind === 'boss' ? 0.55 : 0.28;
        if (this.player.hp <= 0) {
          this.endRun('defeat', '체력이 바닥났습니다.');
          return;
        }
      }
    }

    this.enemies = this.enemies.filter((enemy) => !enemy.dead || enemy.kind === 'boss');
  }

  fireBossShot(enemy) {
    const shots = 6;
    for (let index = 0; index < shots; index += 1) {
      if (this.projectiles.length >= SURVIVOR_LIMITS.projectiles) {
        break;
      }
      const angle = (Math.PI * 2 * index) / shots;
      this.projectiles.push({
        id: `boss-${this.projectileCounter += 1}`,
        kind: 'boss-shot',
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 260,
        vy: Math.sin(angle) * 260,
        damage: 14,
        radius: 7,
        life: 3.5,
        pierce: 0,
      });
    }
  }

  updateProjectiles(dt) {
    for (const projectile of this.projectiles) {
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;

      if (
        projectile.x < -60 ||
        projectile.y < -60 ||
        projectile.x > this.world.width + 60 ||
        projectile.y > this.world.height + 60
      ) {
        projectile.life = 0;
      }

      if (projectile.kind === 'boss-shot') {
        const hitPlayer = distance(projectile.x, projectile.y, this.player.x, this.player.y) <= projectile.radius + 24;
        if (hitPlayer) {
          projectile.life = 0;
          if (this.player.invuln <= 0) {
            this.player.hp -= projectile.damage;
            this.player.invuln = 0.3;
            if (this.player.hp <= 0) {
              this.endRun('defeat', '체력이 바닥났습니다.');
            }
          }
        }
        continue;
      }

      const targets = this.enemies.filter((enemy) => {
        if (enemy.dead) {
          return false;
        }

        const hitRadius = enemy.kind === 'boss' ? 58 : 24;
        return distance(projectile.x, projectile.y, enemy.x, enemy.y) <= hitRadius + projectile.radius;
      });

      for (const enemy of targets) {
        if (this.damageEnemy(enemy, projectile.damage, 'spark')) {
          projectile.pierce -= 1;
        }

        if (projectile.pierce < 0) {
          projectile.life = 0;
          break;
        }
      }
    }

    this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0);
  }

  updateWaves(dt) {
    for (const wave of this.waves) {
      wave.radius += wave.speed * dt;
      const targets = this.enemies.filter((enemy) => {
        if (enemy.dead) {
          return false;
        }

        const distanceToPlayer = distance(enemy.x, enemy.y, this.player.x, this.player.y);
        const lower = wave.radius - 18;
        const upper = wave.radius + 24;
        return distanceToPlayer >= lower && distanceToPlayer <= upper;
      });

      for (const enemy of targets) {
        this.damageEnemy(enemy, wave.damage, 'burst');
      }
    }

    this.waves = this.waves.filter((wave) => wave.radius <= wave.maxRadius);
  }

  damageEnemy(enemy, amount, source) {
    if (enemy.dead) {
      return false;
    }

    if (!enemy.lastHit) {
      enemy.lastHit = {};
    }

    const cooldown = source === 'burst' ? 0.12 : 0.1;
    const lastHit = enemy.lastHit[source] ?? -Infinity;
    if (this.clock - lastHit < cooldown) {
      return false;
    }

    enemy.lastHit[source] = this.clock;
    enemy.hp -= amount;
    enemy.flash = 0.12;

    if (enemy.hp <= 0) {
      enemy.dead = true;
      if (enemy.kind === 'boss') {
        this.bossDefeated = true;
        this.awardRunCoins(enemy.coinValue);
        this.spawnPickup(enemy.x, enemy.y, enemy.xp);
        this.endRun('victory', '보스를 처치했습니다.');
      } else {
        this.awardRunCoins(enemy.coinValue);
        this.spawnPickup(enemy.x, enemy.y, enemy.xp);
      }

      return true;
    }

    return true;
  }

  spawnPickup(x, y, amount) {
    if (this.pickups.length >= SURVIVOR_LIMITS.pickups) {
      this.pickups.shift();
    }
    this.pickups.push({
      id: `xp-${this.pickupsCounter += 1}`,
      x,
      y,
      value: amount,
      radius: 10,
      life: 10,
    });
  }

  collectPickups(dt = 0.016) {
    for (const pickup of this.pickups) {
      pickup.life -= dt;
      const targetDistance = distance(pickup.x, pickup.y, this.player.x, this.player.y);
      if (targetDistance <= this.player.pickupRadius + pickup.radius) {
        const pull = clamp(1 - targetDistance / Math.max(1, this.player.pickupRadius), 0.2, 1);
        const dx = this.player.x - pickup.x;
        const dy = this.player.y - pickup.y;
        pickup.x += dx * 0.14 * pull;
        pickup.y += dy * 0.14 * pull;

        if (targetDistance <= this.player.pickupRadius * 0.42) {
          pickup.life = 0;
          this.exp += pickup.value;
        }
      }
    }

    this.pickups = this.pickups.filter((pickup) => pickup.life > 0);
  }

  handleProgression() {
    while (this.exp >= this.expToNext && this.status === 'running') {
      this.levelUp();
      break;
    }

    if (this.remainingTime <= 0 && !this.bossDefeated) {
      this.endRun('defeat', '시간 내 보스를 쓰러뜨리지 못했습니다.');
    }

    if (this.remainingTime <= 0 && this.bossDefeated) {
      this.endRun('victory', '5분 런을 완료했습니다.');
    }
  }

  spawnEnemy() {
    if ((this.bossSpawned && this.boss) || this.enemies.length >= SURVIVOR_LIMITS.enemies) {
      return;
    }

    const edge = randomInt(0, 3, this.random);
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = randomInt(0, this.world.width, this.random);
      y = -40;
    } else if (edge === 1) {
      x = this.world.width + 40;
      y = randomInt(0, this.world.height, this.random);
    } else if (edge === 2) {
      x = randomInt(0, this.world.width, this.random);
      y = this.world.height + 40;
    } else {
      x = -40;
      y = randomInt(0, this.world.height, this.random);
    }

    const difficulty = 1 + this.elapsed / 120;
    this.enemies.push({
      id: `enemy-${this.enemyCounter += 1}`,
      kind: this.elapsed < 120 ? 'grunt' : this.elapsed < 210 ? 'runner' : 'elite',
      x,
      y,
      hp: Math.floor(20 + difficulty * 8 + (this.elapsed > 180 ? 8 : 0)),
      speed: this.elapsed < 120 ? 90 : this.elapsed < 210 ? 110 : 128,
      xp: this.elapsed < 120 ? 8 : 12,
      coinValue: this.elapsed < 180 ? 1 : 2,
      dead: false,
      lastHit: {},
      flash: 0,
    });
  }

  spawnBoss() {
    this.bossSpawned = true;
    if (this.enemies.length >= SURVIVOR_LIMITS.enemies) {
      this.enemies.shift();
    }
    this.boss = {
      id: `boss-${this.bossCounter += 1}`,
      kind: 'boss',
      x: this.world.width - 140,
      y: this.world.height * 0.42,
      hp: 900 + this.perks.attack * 35,
      speed: 68,
      xp: 120,
      coinValue: 55,
      dead: false,
      fireTimer: 1.2,
      lastHit: {},
      flash: 0,
    };
    this.enemies.push(this.boss);
    this.message = '보스 등장';
  }

  nearestEnemy() {
    let best = null;
    let bestDistance = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.dead) {
        continue;
      }

      const currentDistance = distance(enemy.x, enemy.y, this.player.x, this.player.y);
      if (currentDistance < bestDistance) {
        bestDistance = currentDistance;
        best = enemy;
      }
    }

    return best;
  }

  endRun(status, message) {
    if (this.status === 'victory' || this.status === 'defeat') {
      return;
    }

    this.status = status;
    this.message = message;
    this.remainingTime = Math.max(0, this.remainingTime);
    this.player.hp = Math.max(0, this.player.hp);
    if (status === 'victory') {
      this.awardRunCoins(25);
    }
  }

  getSummary() {
    return {
      status: this.status,
      message: this.message,
      level: this.level,
      exp: this.exp,
      expToNext: this.expToNext,
      remainingTime: this.remainingTime,
      coins: this.perks.coins,
      playerHp: this.player.hp,
      playerMaxHp: this.player.maxHp,
      choices: this.choices.slice(),
    };
  }
}

function orbitAngle(clock, blades, index, phase) {
  const spread = (Math.PI * 2) / blades;
  return clock * 1.2 + phase + spread * index;
}
