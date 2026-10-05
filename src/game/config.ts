import Phaser from "phaser";
import { RENDER_SCALE } from "./renderScale";
import { StartupScene } from "./scenes/StartupScene";

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: "game",
    width: 960 * RENDER_SCALE,
    height: 540 * RENDER_SCALE,
    backgroundColor: "#111827",
    input: {
      keyboard: false,
      touch: true,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [StartupScene],
  };
}
