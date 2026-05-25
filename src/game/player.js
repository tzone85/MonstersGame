import { angleToFrameY, checkCircleCollision, resolveCollision, velocityToward } from "./collision.js";

export class Player {
  constructor(game, { image, speedModifier = 2, collisionRadius = 30, spriteSize = 255 } = {}) {
    this.game = game;
    this.image = image;
    this.collisionX = game.width * 0.5;
    this.collisionY = game.height * 0.5;
    this.collisionRadius = collisionRadius;
    this.spriteWidth = spriteSize;
    this.spriteHeight = spriteSize;
    this.width = spriteSize;
    this.height = spriteSize;
    this.spriteX = this.collisionX - this.width * 0.5;
    this.spriteY = this.collisionY - this.height * 0.5 - 100;
    this.frameX = 0;
    this.frameY = 0;
    this.speedModifier = speedModifier;
    this.speedX = 0;
    this.speedY = 0;
  }

  update() {
    const dx = this.game.mouse.x - this.collisionX;
    const dy = this.game.mouse.y - this.collisionY;
    this.frameY = angleToFrameY(Math.atan2(dy, dx));

    const v = velocityToward(dx, dy, this.speedModifier);
    this.speedX = v.vx;
    this.speedY = v.vy;
    this.collisionX += this.speedX * this.speedModifier;
    this.collisionY += this.speedY * this.speedModifier;

    for (const obstacle of this.game.obstacles) {
      const cr = checkCircleCollision(this, obstacle);
      if (cr.collision) {
        const pos = resolveCollision(this, obstacle, cr);
        this.collisionX = pos.x;
        this.collisionY = pos.y;
      }
    }

    this.spriteX = this.collisionX - this.width * 0.5;
    this.spriteY = this.collisionY - this.height * 0.5 - 100;
  }

  draw(ctx) {
    if (!ctx) return;
    if (this.image) {
      ctx.drawImage(
        this.image,
        this.frameX * this.spriteWidth, this.frameY * this.spriteHeight,
        this.spriteWidth, this.spriteHeight,
        this.spriteX, this.spriteY,
        this.width, this.height,
      );
    }
    this._drawDebugCircle(ctx);
    this._drawMouseLine(ctx);
  }

  _drawDebugCircle(ctx) {
    ctx.beginPath();
    ctx.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.restore();
    ctx.stroke();
  }

  _drawMouseLine(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.collisionX, this.collisionY);
    ctx.lineTo(this.game.mouse.x, this.game.mouse.y);
    ctx.stroke();
  }
}
