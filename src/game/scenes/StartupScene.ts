import Phaser from "phaser";
import { RENDER_SCALE } from "../renderScale";

const ARENA = {
  left: 24 * RENDER_SCALE,
  top: 24 * RENDER_SCALE,
  right: 616 * RENDER_SCALE,
  bottom: 616 * RENDER_SCALE,
};
const PLAYER_RADIUS = 16 * RENDER_SCALE;
const PLAYER_SPEED = 240 * RENDER_SCALE;

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
      12 * RENDER_SCALE,
    );
    arena.lineStyle(2 * RENDER_SCALE, 0x3b4b67, 1);
    arena.strokeRoundedRect(
      ARENA.left,
      ARENA.top,
      ARENA.right - ARENA.left,
      ARENA.bottom - ARENA.top,
      12 * RENDER_SCALE,
    );
    arena.lineStyle(RENDER_SCALE, 0x26334a, 0.75);
    for (
      let x = ARENA.left + 32 * RENDER_SCALE;
      x < ARENA.right;
      x += 32 * RENDER_SCALE
    ) {
      arena.lineBetween(
        x,
        ARENA.top + RENDER_SCALE,
        x,
        ARENA.bottom - RENDER_SCALE,
      );
    }
    for (
      let y = ARENA.top + 32 * RENDER_SCALE;
      y < ARENA.bottom;
      y +=       32 * RENDER_SCALE
    ) {
      arena.lineBetween(ARENA.left + RENDER_SCALE, y, ARENA.right - RENDER_SCALE, y);
    }

    this.player = this.add
      .circle(320 * RENDER_SCALE, 320 * RENDER_SCALE, PLAYER_RADIUS, 0x38bdf8)
      .setStrokeStyle(3 * RENDER_SCALE, 0xe0f2fe);

    this.destinationMarker = this.add
      .circle(320 * RENDER_SCALE, 320 * RENDER_SCALE, 8 * RENDER_SCALE)
      .setStrokeStyle(2 * RENDER_SCALE, 0xfacc15)
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
