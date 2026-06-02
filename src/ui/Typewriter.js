import { PALETTE_HEX } from "../config/game.js";
import { playSfx } from "../audio/index.js";

/**
 * Render text one character at a time. Click/key advances to instant.
 */
export function typewriter(scene, { x, y, text, charDelay = 24, sfxEvery = 2, fontSize = 18, wrapWidth = 700 } = {}) {
  const t = scene.add.text(x, y, "", {
    fontFamily: "monospace",
    fontSize: `${fontSize}px`,
    color: PALETTE_HEX.parchment,
    wordWrap: { width: wrapWidth },
  });
  let i = 0;
  let done = false;
  const tick = scene.time.addEvent({
    delay: charDelay,
    loop: true,
    callback: () => {
      if (done) return;
      i++;
      t.setText(text.slice(0, i));
      if (i % sfxEvery === 0 && i < text.length) playSfx("uiHover");
      if (i >= text.length) {
        done = true;
        tick.remove();
      }
    },
  });
  t.skip = () => {
    done = true;
    tick.remove();
    t.setText(text);
  };
  t.isDone = () => done;
  return t;
}
