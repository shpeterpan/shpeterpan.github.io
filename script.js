import {
  SnakeCore,
  SurvivorCore,
  SNAKE_DIRECTIONS,
  clamp,
  formatClock,
} from './game-core.js';

const STORAGE_KEYS = {
  snakeHighScore: 'loop-engineer-snake-high-score',
};

function getStorage() {
  try {
    const probe = '__loop_engineer_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function readNumber(storage, key, fallback = 0) {
  if (!storage) {
    return fallback;
  }

  try {
    const value = Number(storage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(storage, key, value) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, String(value));
  } catch {
    // Ignore persistence failures.
  }
}

function roundRectPath(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }

  const ratio = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.round(rect.width * ratio);
  const height = Math.round(rect.height * ratio);

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return { ctx, width: rect.width, height: rect.height };
}

const storage = getStorage();

const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const pageCards = [...document.querySelectorAll('.page-card')];
const gameTabs = [...document.querySelectorAll('[data-game-tab]')];
const gamePanels = [...document.querySelectorAll('[data-game-panel]')];
const snakePanel = document.querySelector('[data-game-panel="snake"]');
const survivorPanel = document.querySelector('[data-game-panel="survivors"]');
const snakeCanvas = document.querySelector('#snake-canvas');
const survivorCanvas = document.querySelector('#survivor-canvas');
const snakeScore = document.querySelector('[data-snake-score]');
const snakeHighScore = document.querySelector('[data-snake-highscore]');
const snakeState = document.querySelector('[data-snake-state]');
const survivorTime = document.querySelector('[data-survivor-time]');
const survivorLevel = document.querySelector('[data-survivor-level]');
const survivorCoins = document.querySelector('[data-survivor-coins]');
const survivorCoinsInline = document.querySelector('[data-survivor-coins-inline]');
const survivorState = document.querySelector('[data-survivor-state]');
const survivorMessage = document.querySelector('[data-survivor-message]');
const survivorChoices = document.querySelector('[data-survivor-choices]');
const snakeActionButtons = [...document.querySelectorAll('[data-snake-action]')];
const survivorActionButtons = [...document.querySelectorAll('[data-survivor-action]')];
const perkBuyButtons = [...document.querySelectorAll('[data-perk-buy]')];
const perkResetButton = document.querySelector('[data-perk-reset]');
const snakeDirButtons = [...snakePanel.querySelectorAll('[data-dir]')];
const survivorDirButtons = [...survivorPanel.querySelectorAll('[data-dir]')];

const snake = new SnakeCore({ highScore: readNumber(storage, STORAGE_KEYS.snakeHighScore, 0) });
const survivor = new SurvivorCore({ storage });
snake.highScore = readNumber(storage, STORAGE_KEYS.snakeHighScore, snake.highScore);

let activeGame = 'snake';
let navOpen = false;
let pageScrollLock = false;
let snakeTimerId = null;
let snakeLastSpeed = snake.speedMs;
let survivorFrameId = 0;
let survivorLastTimestamp = 0;
let survivorChoiceSignature = null;
const pressedSurvivorKeys = new Set();
const survivorPointerDirections = new Map();

function syncNav(open) {
  navOpen = open;
  primaryNav.dataset.open = String(open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.textContent = open ? '닫기' : '메뉴';
}

function closeNav() {
  syncNav(false);
}

function showGame(gameName) {
  if (gameName !== 'survivors') {
    clearSurvivorMovement();
  }
  activeGame = gameName;
  gameTabs.forEach((button) => {
    const active = button.dataset.gameTab === gameName;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });

  gamePanels.forEach((panel) => {
    const active = panel.dataset.gamePanel === gameName;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });

  if (gameName === 'snake') {
    renderSnake();
  } else {
    renderSurvivor();
  }
}

function updateSnakeHud() {
  snakeScore.textContent = String(snake.score);
  snakeHighScore.textContent = String(snake.highScore);
  snakeState.textContent = snake.message;
}

function clearSnakeTimer() {
  if (snakeTimerId !== null) {
    window.clearInterval(snakeTimerId);
    snakeTimerId = null;
  }
}

function startSnakeTimer() {
  clearSnakeTimer();
  if (snake.status === 'running') {
    snakeLastSpeed = snake.speedMs;
    snakeTimerId = window.setInterval(() => {
      const beforeSpeed = snake.speedMs;
      const result = snake.step();
      if (snake.highScore < snake.score) {
        snake.highScore = snake.score;
        writeNumber(storage, STORAGE_KEYS.snakeHighScore, snake.highScore);
      }

      updateSnakeHud();
      renderSnake();

      if (result.ended || snake.status !== 'running') {
        clearSnakeTimer();
        return;
      }

      if (beforeSpeed !== snake.speedMs) {
        startSnakeTimer();
      }
    }, snake.speedMs);
  }
}

function handleSnakeAction(action) {
  if (action === 'start') {
    snake.start();
    startSnakeTimer();
  } else if (action === 'pause') {
    snake.togglePause();
    if (snake.status === 'running') {
      startSnakeTimer();
    } else {
      clearSnakeTimer();
    }
  } else if (action === 'restart') {
    snake.restart();
    startSnakeTimer();
  }

  updateSnakeHud();
  renderSnake();
}

function drawSnakeGrid(ctx, width, height, cellSize, offsetX, offsetY) {
  ctx.fillStyle = 'rgba(8, 16, 28, 0.92)';
  ctx.fillRect(0, 0, width, height);

  const boardWidth = cellSize * snake.cols;
  const boardHeight = cellSize * snake.rows;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.fillRect(offsetX, offsetY, boardWidth, boardHeight);

  ctx.strokeStyle = 'rgba(174, 186, 208, 0.08)';
  ctx.lineWidth = 1;
  for (let index = 0; index <= snake.cols; index += 1) {
    const x = offsetX + index * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + boardHeight);
    ctx.stroke();
  }

  for (let index = 0; index <= snake.rows; index += 1) {
    const y = offsetY + index * cellSize;
    ctx.beginPath();
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + boardWidth, y);
    ctx.stroke();
  }
}

function renderSnake() {
  const fit = fitCanvas(snakeCanvas);
  if (!fit) {
    return;
  }

  const { ctx, width, height } = fit;
  ctx.clearRect(0, 0, width, height);

  const cellSize = Math.floor(Math.min(width / snake.cols, height / snake.rows));
  const boardWidth = cellSize * snake.cols;
  const boardHeight = cellSize * snake.rows;
  const offsetX = Math.floor((width - boardWidth) / 2);
  const offsetY = Math.floor((height - boardHeight) / 2);

  drawSnakeGrid(ctx, width, height, cellSize, offsetX, offsetY);

  const foodX = offsetX + snake.food.x * cellSize;
  const foodY = offsetY + snake.food.y * cellSize;
  ctx.fillStyle = '#f4a261';
  ctx.beginPath();
  ctx.arc(foodX + cellSize / 2, foodY + cellSize / 2, cellSize * 0.33, 0, Math.PI * 2);
  ctx.fill();

  snake.snake.forEach((segment, index) => {
    const x = offsetX + segment.x * cellSize + 2;
    const y = offsetY + segment.y * cellSize + 2;
    const segmentSize = cellSize - 4;
    ctx.fillStyle = index === 0 ? '#d9f99d' : index === snake.snake.length - 1 ? '#0f6f7a' : '#7fcdff';
    roundRectPath(ctx, x, y, segmentSize, segmentSize, Math.max(4, segmentSize * 0.24));
    ctx.fill();
  });

  const overlayVisible = snake.status !== 'running';
  if (overlayVisible) {
    ctx.fillStyle = 'rgba(8, 16, 28, 0.52)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 28px "Avenir Next", "Noto Sans KR", sans-serif';
    ctx.fillText(snake.message, width / 2, height / 2 - 10);
    ctx.font = '500 16px "Avenir Next", "Noto Sans KR", sans-serif';
    const helper = snake.status === 'idle'
      ? '시작을 누르거나 방향키/WASD를 사용하세요.'
      : snake.status === 'paused'
        ? '일시정지 상태입니다.'
        : '재시작으로 다시 시작하세요.';
    ctx.fillText(helper, width / 2, height / 2 + 22);
  }
}

function renderChoiceOverlay() {
  if (!survivorChoices) {
    return;
  }

  const signature = `${survivor.choiceMode ?? 'none'}:${survivor.choices.map((choice) => choice.id).join(',')}`;
  if (signature === survivorChoiceSignature) {
    return;
  }
  survivorChoiceSignature = signature;

  survivorChoices.hidden = survivor.choices.length === 0;
  survivorChoices.innerHTML = '';

  if (!survivor.choices.length) {
    return;
  }

  const heading = document.createElement('p');
  heading.className = 'choice-title';
  heading.textContent = survivor.choiceMode === 'levelup' ? '레벨 업 선택' : '선택';
  survivorChoices.appendChild(heading);

  const list = document.createElement('div');
  list.className = 'choice-list';

  survivor.choices.forEach((choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-card';
    button.innerHTML = `<strong>${choice.label}</strong><span>${choice.detail}</span>`;
    button.addEventListener('click', () => {
      survivor.applyChoice(choice.id);
      renderChoiceOverlay();
      syncSurvivorHud();
      renderSurvivor();
    });
    list.appendChild(button);
  });

  survivorChoices.appendChild(list);
}

function updatePerkButtons() {
  const perkLabels = {
    maxHp: '체력 강화',
    attack: '공격 강화',
    pickup: '흡수 강화',
  };

  perkBuyButtons.forEach((button) => {
    const perkName = button.dataset.perkBuy;
    const level = survivor.perks[perkName];
    const costTable = { maxHp: [20, 35, 50, 70, 95], attack: [20, 35, 50, 70, 95], pickup: [15, 30, 45, 65, 85] };
    const cost = costTable[perkName][level] ?? null;
    const maxed = level >= 5;
    button.disabled = maxed || !survivor.canAffordPerk(perkName);
    button.textContent = maxed ? `${perkLabels[perkName]} MAX` : `${perkLabels[perkName]} Lv.${level + 1} (${cost})`;
  });
}

function syncSurvivorHud() {
  const summary = survivor.getSummary();
  survivorTime.textContent = formatClock(summary.remainingTime);
  survivorLevel.textContent = String(summary.level);
  survivorCoins.textContent = String(summary.coins);
  survivorCoinsInline.textContent = String(summary.coins);
  survivorState.textContent = summary.status === 'running'
    ? '진행 중'
    : summary.status === 'choice'
      ? '선택 대기'
      : summary.status === 'paused'
        ? '일시정지'
        : summary.status === 'victory'
          ? '승리'
          : summary.status === 'defeat'
            ? '패배'
            : '대기';
  survivorMessage.textContent = summary.message;
  updatePerkButtons();
}

function renderSurvivor() {
  const fit = fitCanvas(survivorCanvas);
  if (!fit) {
    return;
  }

  const { ctx, width, height } = fit;
  ctx.clearRect(0, 0, width, height);

  const scale = Math.min(width / survivor.world.width, height / survivor.world.height);
  const drawWidth = survivor.world.width * scale;
  const drawHeight = survivor.world.height * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#09111b';
  ctx.fillRect(0, 0, survivor.world.width, survivor.world.height);

  const gridSpacing = 100;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1 / scale;
  for (let x = 0; x <= survivor.world.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, survivor.world.height);
    ctx.stroke();
  }
  for (let y = 0; y <= survivor.world.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(survivor.world.width, y);
    ctx.stroke();
  }

  survivor.waves.forEach((wave) => {
    ctx.strokeStyle = wave.kind === 'evolved' ? 'rgba(173, 255, 214, 0.62)' : 'rgba(127, 205, 255, 0.5)';
    ctx.lineWidth = 8 / scale;
    ctx.beginPath();
    ctx.arc(survivor.player.x, survivor.player.y, wave.radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  survivor.pickups.forEach((pickup) => {
    ctx.fillStyle = '#f7d774';
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  survivor.projectiles.forEach((projectile) => {
    ctx.fillStyle = projectile.kind === 'boss-shot' ? '#ff8fab' : '#d9f99d';
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  survivor.enemies.forEach((enemy) => {
    if (enemy.dead) {
      return;
    }

    const radius = enemy.kind === 'boss' ? 58 : enemy.kind === 'elite' ? 22 : 16;
    ctx.fillStyle = enemy.kind === 'boss' ? '#8b5cf6' : enemy.kind === 'elite' ? '#ef4444' : '#f97316';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.kind === 'boss') {
      const barWidth = 180;
      const barHeight = 14;
      const hpRatio = clamp(enemy.hp / (900 + survivor.perks.attack * 35), 0, 1);
      ctx.fillStyle = 'rgba(8, 16, 28, 0.72)';
      ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 84, barWidth, barHeight);
      ctx.fillStyle = '#d9f99d';
      ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 84, barWidth * hpRatio, barHeight);
    }
  });

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(survivor.player.x, survivor.player.y, 24, 0, Math.PI * 2);
  ctx.fill();

  const orbitCount = survivor.weapons.orbit.evolved ? 6 : 3;
  const orbitRadius = survivor.weapons.orbit.evolved ? 118 : 88 + survivor.weapons.orbit.level * 7;
  const orbitPhase = survivor.weapons.orbit.phase;
  for (let index = 0; index < orbitCount; index += 1) {
    const angle = (Math.PI * 2 * index) / orbitCount + orbitPhase * 1.2;
    const x = survivor.player.x + Math.cos(angle) * orbitRadius;
    const y = survivor.player.y + Math.sin(angle) * orbitRadius;
    ctx.fillStyle = '#7fcdff';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  const overlay = survivor.status === 'running' || survivor.status === 'choice' ? null : survivor.message;
  if (overlay) {
    ctx.fillStyle = 'rgba(8, 16, 28, 0.44)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 26px "Avenir Next", "Noto Sans KR", sans-serif';
    ctx.fillText(overlay, width / 2, height / 2 - 8);
    ctx.font = '500 16px "Avenir Next", "Noto Sans KR", sans-serif';
    const helper = survivor.status === 'choice'
      ? '아래 선택지에서 하나를 고르세요.'
      : survivor.status === 'victory'
        ? '재시작하면 다시 5분 런을 시작합니다.'
        : survivor.status === 'defeat'
          ? '재시작으로 다시 도전할 수 있습니다.'
          : '시작을 눌러 전투를 시작하세요.';
    ctx.fillText(helper, width / 2, height / 2 + 24);
  }
}

function handleSurvivorAction(action) {
  if (action === 'start') {
    survivor.startRun();
  } else if (action === 'pause') {
    survivor.togglePause();
  } else if (action === 'restart') {
    survivor.resetRun();
    survivor.startRun();
  }

  syncSurvivorHud();
  renderChoiceOverlay();
  renderSurvivor();
}

function handleDirection(directionName) {
  if (activeGame === 'snake') {
    snake.setDirection(directionName);
    if (snake.status === 'running' && snakeTimerId === null) {
      startSnakeTimer();
    }
    updateSnakeHud();
    renderSnake();
    return;
  }

  survivor.setDirection(directionName);
  syncSurvivorHud();
  renderSurvivor();
}

function syncSurvivorMovement() {
  const activeDirections = new Set(survivorPointerDirections.values());
  const keyDirections = {
    up: pressedSurvivorKeys.has('arrowup') || pressedSurvivorKeys.has('w'),
    down: pressedSurvivorKeys.has('arrowdown') || pressedSurvivorKeys.has('s'),
    left: pressedSurvivorKeys.has('arrowleft') || pressedSurvivorKeys.has('a'),
    right: pressedSurvivorKeys.has('arrowright') || pressedSurvivorKeys.has('d'),
  };

  const x = Number(keyDirections.right || activeDirections.has('right')) - Number(keyDirections.left || activeDirections.has('left'));
  const y = Number(keyDirections.down || activeDirections.has('down')) - Number(keyDirections.up || activeDirections.has('up'));
  survivor.setMovement(x, y);
}

function clearSurvivorMovement() {
  pressedSurvivorKeys.clear();
  survivorPointerDirections.clear();
  survivor.stopMovement();
}

function isEditableTarget(target) {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || target instanceof HTMLButtonElement
    || target instanceof HTMLAnchorElement
    || target instanceof HTMLElement && target.isContentEditable;
}

function getPageCardIndexFromScroll() {
  const offset = window.scrollY + 140;
  let index = 0;

  pageCards.forEach((card, candidateIndex) => {
    const top = card.offsetTop;
    if (offset >= top - 2) {
      index = candidateIndex;
    }
  });

  return index;
}

function scrollToPageCard(index) {
  if (!pageCards.length) {
    return;
  }

  const clampedIndex = clamp(index, 0, pageCards.length - 1);
  pageCards[clampedIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function moveOneCard(direction) {
  if (pageScrollLock || pageCards.length === 0) {
    return;
  }

  const currentIndex = getPageCardIndexFromScroll();
  const nextIndex = clamp(currentIndex + direction, 0, pageCards.length - 1);
  if (nextIndex === currentIndex) {
    return;
  }

  pageScrollLock = true;
  scrollToPageCard(nextIndex);
  window.setTimeout(() => {
    pageScrollLock = false;
  }, 750);
}

function handlePageScrollIntent(direction) {
  moveOneCard(direction);
}

function handleKeydown(event) {
  if (isEditableTarget(event.target)) {
    return;
  }

  const key = event.key.toLowerCase();
  const directionMap = {
    arrowup: 'up',
    w: 'up',
    arrowdown: 'down',
    s: 'down',
    arrowleft: 'left',
    a: 'left',
    arrowright: 'right',
    d: 'right',
  };

  if (directionMap[key]) {
    event.preventDefault();
    if (activeGame === 'snake') {
      handleDirection(directionMap[key]);
    } else {
      pressedSurvivorKeys.add(key);
      syncSurvivorMovement();
    }
    return;
  }

  if (key === ' ' || key === 'spacebar') {
    event.preventDefault();
    if (activeGame === 'snake') {
      handleSnakeAction('pause');
    } else {
      handleSurvivorAction('pause');
    }
    return;
  }

  if (key === 'escape') {
    closeNav();
    return;
  }

  if (key === 'pagedown' || key === ' ' || key === 'spacebar') {
    event.preventDefault();
    handlePageScrollIntent(1);
    return;
  }

  if (key === 'pageup') {
    event.preventDefault();
    handlePageScrollIntent(-1);
  }
}

function handleKeyup(event) {
  const key = event.key.toLowerCase();
  if (!pressedSurvivorKeys.delete(key)) {
    return;
  }

  if (activeGame === 'survivors') {
    event.preventDefault();
    syncSurvivorMovement();
  }
}

function attachGamePanelListeners(panel, gameName) {
  panel.querySelectorAll('[data-dir]').forEach((button) => {
    if (gameName === 'snake') {
      button.addEventListener('click', () => handleDirection(button.dataset.dir));
      return;
    }

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      survivorPointerDirections.set(event.pointerId, button.dataset.dir);
      syncSurvivorMovement();
    });

    const releaseDirection = (event) => {
      survivorPointerDirections.delete(event.pointerId);
      syncSurvivorMovement();
    };
    button.addEventListener('pointerup', releaseDirection);
    button.addEventListener('pointercancel', releaseDirection);
    button.addEventListener('pointerleave', releaseDirection);
  });

  panel.querySelectorAll(`[data-${gameName}-action]`).forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset[`${gameName}Action`];
      if (gameName === 'snake') {
        handleSnakeAction(action);
      } else {
        handleSurvivorAction(action);
      }
    });
  });
}

function onResize() {
  renderSnake();
  renderSurvivor();
}

menuToggle.addEventListener('click', () => {
  syncNav(!navOpen);
});

primaryNav.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof HTMLAnchorElement) {
    closeNav();
  }
});

window.addEventListener('keydown', handleKeydown);
window.addEventListener('keyup', handleKeyup);
window.addEventListener('wheel', (event) => {
  if (Math.abs(event.deltaY) < 24 || event.ctrlKey || event.metaKey || pageScrollLock) {
    return;
  }

  if (isEditableTarget(event.target)) {
    return;
  }

  event.preventDefault();
  handlePageScrollIntent(event.deltaY > 0 ? 1 : -1);
}, { passive: false });
window.addEventListener('blur', clearSurvivorMovement);
window.addEventListener('resize', () => {
  if (!window.matchMedia('(max-width: 720px)').matches) {
    closeNav();
  }
  onResize();
});

gameTabs.forEach((button) => {
  button.addEventListener('click', () => {
    showGame(button.dataset.gameTab);
  });
});

attachGamePanelListeners(snakePanel, 'snake');
attachGamePanelListeners(survivorPanel, 'survivor');

perkBuyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const perkName = button.dataset.perkBuy;
    const result = survivor.buyPerk(perkName);
    if (result.bought) {
      syncSurvivorHud();
      renderSurvivor();
    }
  });
});

perkResetButton.addEventListener('click', () => {
  survivor.resetPerks();
  syncSurvivorHud();
});

if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(() => {
    onResize();
  });

  observer.observe(snakePanel);
  observer.observe(survivorPanel);
}

function survivorLoop(timestamp) {
  if (!survivorLastTimestamp) {
    survivorLastTimestamp = timestamp;
  }

  const dt = clamp((timestamp - survivorLastTimestamp) / 1000, 0, 0.05);
  survivorLastTimestamp = timestamp;

  survivor.update(dt);
  if (survivor.status === 'choice' || survivor.status === 'victory' || survivor.status === 'defeat' || survivor.status === 'paused' || survivor.status === 'idle') {
    renderChoiceOverlay();
  }
  syncSurvivorHud();
  renderSurvivor();
  survivorFrameId = window.requestAnimationFrame(survivorLoop);
}

function init() {
  syncNav(false);
  showGame(activeGame);
  updateSnakeHud();
  syncSurvivorHud();
  renderChoiceOverlay();
  renderSnake();
  renderSurvivor();
  startSnakeTimer();
  survivorFrameId = window.requestAnimationFrame(survivorLoop);
}

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
  window.__loopEngineer = {
    snake,
    survivor,
    get activeGame() {
      return activeGame;
    },
    get snakeTimerActive() {
      return snakeTimerId !== null;
    },
    get snakeTimerId() {
      return snakeTimerId;
    },
  };
}

init();
