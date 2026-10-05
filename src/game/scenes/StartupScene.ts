import Phaser from "phaser";

const ARENA = {
  left: 32,
  top: 72,
  right: 928,
  bottom: 492,
};
const PLAYER_RADIUS = 16;
const PLAYER_SPEED = 240;

export class StartupScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    z: Phaser.Input.Keyboard.Key;
    q: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super("startup");
  }

  create(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Le plugin clavier Phaser est indisponible.");
    }

    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      z: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      q: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    };

    const arena = this.add.graphics();
    arena.fillStyle(0x172033);
    arena.fillRoundedRect(
      ARENA.left,
      ARENA.top,
      ARENA.right - ARENA.left,
      ARENA.bottom - ARENA.top,
      12,
    );
    arena.lineStyle(2, 0x3b4b67, 1);
    arena.strokeRoundedRect(
      ARENA.left,
      ARENA.top,
      ARENA.right - ARENA.left,
      ARENA.bottom - ARENA.top,
      12,
    );
    arena.lineStyle(1, 0x26334a, 0.75);
    for (let x = ARENA.left + 32; x < ARENA.right; x += 32) {
      arena.lineBetween(x, ARENA.top + 1, x, ARENA.bottom - 1);
    }
    for (let y = ARENA.top + 32; y < ARENA.bottom; y += 32) {
      arena.lineBetween(ARENA.left + 1, y, ARENA.right - 1, y);
    }

    this.add
      .text(480, 30, "ARÈNE", {
        color: "#f9fafb",
        fontFamily: "sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(480, 518, "Déplacement : ZQSD / WASD ou flèches", {
        color: "#cbd5e1",
        fontFamily: "sans-serif",
        fontSize: "16px",
      })
      .setOrigin(0.5);

    this.player = this.add
      .circle(480, 282, PLAYER_RADIUS, 0x38bdf8)
      .setStrokeStyle(3, 0xe0f2fe);
  }

  update(_time: number, delta: number): void {
    let directionX =
      Number(this.keys.right.isDown || this.keys.d.isDown) -
      Number(this.keys.left.isDown || this.keys.a.isDown || this.keys.q.isDown);
    let directionY =
      Number(this.keys.down.isDown || this.keys.s.isDown) -
      Number(this.keys.up.isDown || this.keys.w.isDown || this.keys.z.isDown);

    const directionLength = Math.hypot(directionX, directionY);
    if (directionLength > 0) {
      directionX /= directionLength;
      directionY /= directionLength;

      this.player.x = Phaser.Math.Clamp(
        this.player.x + directionX * PLAYER_SPEED * (delta / 1000),
        ARENA.left + PLAYER_RADIUS,
        ARENA.right - PLAYER_RADIUS,
      );
      this.player.y = Phaser.Math.Clamp(
        this.player.y + directionY * PLAYER_SPEED * (delta / 1000),
        ARENA.top + PLAYER_RADIUS,
        ARENA.bottom - PLAYER_RADIUS,
      );
    }
  }
}
