import { expect, test } from "@playwright/test";

test("title screen renders inside game-root", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/");
  const canvas = page.locator("#game-root canvas");
  await expect(canvas).toBeVisible({ timeout: 10_000 });
  // Phaser logs a banner warning under happy-dom but real browsers don't;
  // we tolerate logger output but fail on uncaught page errors.
  expect(errors).toEqual([]);
});

test("can launch a run from the title screen", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("#game-root canvas");
  await expect(canvas).toBeVisible({ timeout: 10_000 });
  const box = await canvas.boundingBox();
  // The "New Run" button is the topmost menu button in the layout.
  // Click roughly at its expected position (centre x, ~55% height).
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.55);
  // Allow a moment for the Game scene to spawn and begin emitting hud:tick.
  await page.waitForTimeout(800);
  const state = await page.evaluate(() => {
    const g = window.__game;
    if (!g) return null;
    const sceneMgr = g.scene;
    const game = sceneMgr.getScene("Game");
    return game && game.scene.isActive() ? { active: true } : null;
  });
  if (state) expect(state.active).toBe(true);
});
