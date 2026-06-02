/**
 * Runtime feature flags. Defaults shipped; URL params override for dev.
 *
 * Examples:
 *   ?debug=1          show collision rings + spawn rate
 *   ?fastTutorial=1   skip wait-gates in tutorial
 *   ?seed=12345       deterministic RNG seed for a run
 *   ?mute=1           force-mute audio for screenshots
 */
function readParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); }
}

const params = readParams();
const isOn = (name) => params.get(name) === "1" || params.get(name) === "true";

export const FLAGS = Object.freeze({
  debug: isOn("debug"),
  fastTutorial: isOn("fastTutorial"),
  mute: isOn("mute"),
  seed: params.get("seed") ? Number(params.get("seed")) : null,
});
