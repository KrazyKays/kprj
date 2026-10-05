import Phaser from "phaser";
import { StartupScene } from "./scenes/StartupScene";

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: "game",
    width: 960,
    height: 540,
    backgroundColor: "#111827",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [StartupScene],
  };
}
