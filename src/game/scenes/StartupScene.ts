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
  private destination: Phaser.Math.Vector2 | null = null;
  private destinationMarker!: Phaser.GameObjects.Arc;

  constructor() {
    super("startup");
  }

  create(): void {
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
      .text(480, 518, "Cliquez ou touchez l'arène pour vous déplacer", {
        color: "#cbd5e1",
        fontFamily: "sans-serif",
        fontSize: "16px",
      })
      .setOrigin(0.5);

    this.player = this.add
      .circle(480, 282, PLAYER_RADIUS, 0x38bdf8)
      .setStrokeStyle(3, 0xe0f2fe);

    this.destinationMarker = this.add
      .circle(480, 282, 8)
      .setStrokeStyle(2, 0xfacc15)
      .setVisible(false);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.setDestination, this);
  }

  update(_time: number, delta: number): void {
    if (!this.destination) {
      return;
    }

    const deltaX = this.destination.x - this.player.x;
    const deltaY = this.destination.y - this.player.y;
    const distance = Math.hypot(deltaX, deltaY);
    const step = PLAYER_SPEED * (delta / 1000);

    if (distance <= step) {
      this.player.setPosition(this.destination.x, this.destination.y);
      this.destination = null;
      this.destinationMarker.setVisible(false);
      return;
    }

    this.player.x += (deltaX / distance) * step;
    this.player.y += (deltaY / distance) * step;
  }

  private setDestination(pointer: Phaser.Input.Pointer): void {
    if (
      pointer.x < ARENA.left ||
      pointer.x > ARENA.right ||
      pointer.y < ARENA.top ||
      pointer.y > ARENA.bottom
    ) {
      return;
    }

    const destinationX = Phaser.Math.Clamp(
      pointer.x,
      ARENA.left + PLAYER_RADIUS,
      ARENA.right - PLAYER_RADIUS,
    );
    const destinationY = Phaser.Math.Clamp(
      pointer.y,
      ARENA.top + PLAYER_RADIUS,
      ARENA.bottom - PLAYER_RADIUS,
    );

    this.destination = new Phaser.Math.Vector2(destinationX, destinationY);
    this.destinationMarker.setPosition(destinationX, destinationY).setVisible(true);
  }
}
