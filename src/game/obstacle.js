export class Obstacle {
  constructor(game, { rng = Math.random, image = null, collisionRadius = 55, spriteSize = 250 } = {}) {
    this.game = game;
    this.image = image;
    this.collisionRadius = collisionRadius;
    this.collisionX = rng() * game.width;
    this.collisionY = rng() * game.height;
    this.spriteWidth = spriteSize;
    this.spriteHeight = spriteSize;
    this.width = spriteSize;
    this.height = spriteSize;
    this.spriteX = this.collisionX - this.width * 0.5;
    this.spriteY = this.collisionY - this.height * 0.5 - 70;
    this.frameX = Math.floor(rng() * 4);
    this.frameY = Math.floor(rng() * 3);
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
    ctx.beginPath();
    ctx.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.restore();
    ctx.stroke();
  }
}
