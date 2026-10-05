import Phaser from "phaser";

export class StartupScene extends Phaser.Scene {
  constructor() {
    super("startup");
  }

  create(): void {
    this.add
      .text(480, 270, "Phaser est prêt", {
        color: "#f9fafb",
        fontFamily: "sans-serif",
        fontSize: "28px",
      })
      .setOrigin(0.5);
  }
}
