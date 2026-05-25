import "./main.css";
import { Game } from "./game/game.js";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

async function start() {
  const canvas = document.getElementById("canvas1");
  if (!canvas) throw new Error("canvas1 element not found");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";

  const [playerImage, obstacleImage] = await Promise.all([
    loadImage("./bull.png").catch(() => null),
    loadImage("./obstacles.png").catch(() => null),
  ]);

  const game = new Game({
    width: canvas.width,
    height: canvas.height,
    images: { player: playerImage, obstacle: obstacleImage },
  });
  game.init();
  if (typeof window !== "undefined") window.__game = game;

  canvas.addEventListener("mousedown", (ev) => game.setMouse({ x: ev.offsetX, y: ev.offsetY, pressed: true }));
  canvas.addEventListener("mouseup", (ev) => game.setMouse({ x: ev.offsetX, y: ev.offsetY, pressed: false }));
  canvas.addEventListener("mousemove", (ev) => {
    if (game.mouse.pressed) game.setMouse({ x: ev.offsetX, y: ev.offsetY });
  });

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx);
    requestAnimationFrame(frame);
  }
  frame();
}

start().catch((err) => {
  console.error("game start failed:", err);
});
