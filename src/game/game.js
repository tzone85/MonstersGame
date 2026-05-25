import { Obstacle } from "./obstacle.js";
import { Player } from "./player.js";
import { overlapsAny, withinPlayfield } from "./collision.js";

const DEFAULT_OPTS = {
  width: 1280,
  height: 720,
  topMargin: 260,
  numberOfObstacles: 4,
  maxPlacementAttempts: 500,
  distanceBuffer: 145,
};

export class Game {
  constructor({ width, height, images = {}, opts = {}, rng = Math.random } = {}) {
    Object.assign(this, { ...DEFAULT_OPTS, ...opts });
    if (width) this.width = width;
    if (height) this.height = height;
    this._rng = rng;
    this.images = images;
    this.obstacles = [];
    this.player = new Player(this, { image: images.player });
    this.mouse = { x: this.width * 0.5, y: this.height * 0.5, pressed: false };
  }

  /**
   * Place obstacles via deterministic-with-rng circle packing.
   * Returns the number of obstacles actually placed.
   */
  init() {
    let attempts = 0;
    while (this.obstacles.length < this.numberOfObstacles && attempts < this.maxPlacementAttempts) {
      const candidate = new Obstacle(this, { rng: this._rng, image: this.images.obstacle });
      if (
        !overlapsAny(candidate, this.obstacles, this.distanceBuffer) &&
        withinPlayfield(candidate, this)
      ) {
        this.obstacles.push(candidate);
      }
      attempts++;
    }
    return this.obstacles.length;
  }

  setMouse({ x, y, pressed }) {
    this.mouse.x = x;
    this.mouse.y = y;
    if (pressed !== undefined) this.mouse.pressed = pressed;
  }

  step() {
    this.player.update();
  }

  render(ctx) {
    for (const o of this.obstacles) o.draw(ctx);
    this.player.draw(ctx);
    this.player.update();
  }
}
