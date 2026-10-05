import Phaser from "phaser";
import { RENDER_SCALE } from "./renderScale";
import type { GameProgression } from "./progression";
import { StartupScene } from "./scenes/StartupScene";

const GAME_SIZE = 640;

export function createGameConfig(
  progression: GameProgression,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: "game",
    width: GAME_SIZE * RENDER_SCALE,
    height: GAME_SIZE * RENDER_SCALE,
    backgroundColor: "#111827",
    input: {
      keyboard: false,
      touch: true,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new StartupScene(progression)],
  };
}
