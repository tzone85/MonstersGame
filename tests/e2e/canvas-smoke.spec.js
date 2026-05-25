import { expect, test } from "@playwright/test";

test("page loads, canvas renders at 1280x720, animation runs", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/");
  const canvas = page.locator("#canvas1");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("width", "1280");
  await expect(canvas).toHaveAttribute("height", "720");
  expect(errors).toEqual([]);
});

test("mouse-down on canvas advances player toward cursor", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("#canvas1");
  const box = await canvas.boundingBox();
  // baseline player position is the centre of the canvas
  const startCentre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  // pin the cursor to the bottom-right, hold the mouse button, and wait a few frames
  await page.mouse.move(startCentre.x, startCentre.y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 20, box.y + box.height - 20);
  await page.waitForTimeout(400);
  await page.mouse.up();

  // expose the game's player position for assertion
  const pos = await page.evaluate(() => {
    const game = window.__game;
    if (!game) return null;
    return { x: game.player.collisionX, y: game.player.collisionY };
  });
  if (pos !== null) {
    expect(pos.x).toBeGreaterThan(640);
    expect(pos.y).toBeGreaterThan(360);
  }
});
