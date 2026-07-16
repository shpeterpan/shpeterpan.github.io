import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SnakeCore, SurvivorCore } from '../game-core.js';

function testCorruptStorageFallback() {
  const storage = {
    getItem() {
      return 'null';
    },
    setItem() {},
  };
  const core = new SurvivorCore({ storage });
  assert.deepEqual(core.perks, { maxHp: 0, attack: 0, pickup: 0, coins: 0 });
}

function testMaxedWeaponsAreNotNoopChoices() {
  const core = new SurvivorCore({ random: () => 0 });
  core.weapons.spark.level = 5;
  core.weapons.orbit.level = 5;
  core.weapons.burst.level = 5;
  const choices = core.buildChoices();
  assert.equal(choices.some(({ id }) => ['spark', 'orbit', 'burst'].includes(id)), false);
}

function testEnemyLimit() {
  const core = new SurvivorCore({ random: () => 0.5 });
  core.startRun();
  core.updateWeapons = () => {};
  core.player.hp = 1e9;
  for (let index = 0; index < 5400; index += 1) {
    core.update(0.05);
  }
  assert.ok(core.enemies.length <= 240, `enemy count exceeded cap: ${core.enemies.length}`);
}

function testSnakeCoreRegression() {
  const snake = new SnakeCore({ cols: 8, rows: 8 });
  snake.start();
  assert.equal(snake.setDirection('left'), false);
  snake.food = { x: snake.snake[0].x + 1, y: snake.snake[0].y };
  const result = snake.step();
  assert.equal(result.ateFood, true);
  assert.equal(snake.score, 10);
  assert.equal(snake.highScore, 10);
}

function testUiRegressionMarkers() {
  const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(script, /snake\.highScore > previousHighScore/);
  assert.match(script, /directionMap\[key\] && isGamesSectionVisible\(\)/);
  assert.match(script, /viewportBottom < cardBottom - 24/);
  assert.match(styles, /scroll-snap-type:\s*y proximity/);
}

testCorruptStorageFallback();
testMaxedWeaponsAreNotNoopChoices();
testEnemyLimit();
testSnakeCoreRegression();
testUiRegressionMarkers();

console.log('PASS regression: 5 checks');
