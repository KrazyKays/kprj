import Phaser from "phaser";
import type { GameProgression } from "../progression";
import { RENDER_SCALE } from "../renderScale";

const ARENA = {
  left: 24 * RENDER_SCALE,
  top: 24 * RENDER_SCALE,
  right: 616 * RENDER_SCALE,
  bottom: 616 * RENDER_SCALE,
};
const PLAYER_RADIUS = 16 * RENDER_SCALE;
const PLAYER_SPEED = 240 * RENDER_SCALE;
const RESOURCE_RADIUS = 12 * RENDER_SCALE;
const RESOURCE_RESPAWN_DELAY = 3000;
const RESOURCE_RESPAWN_RETRY_DELAY = 1000;
const RESOURCE_SPAWN_SPACING = RESOURCE_RADIUS * 2 + 8 * RENDER_SCALE;
const RESOURCE_LOCATIONS = [
  { x: 112, y: 128 },
  { x: 520, y: 136 },
  { x: 160, y: 304 },
  { x: 504, y: 352 },
  { x: 120, y: 520 },
  { x: 488, y: 512 },
];

export class StartupScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private collectionZone!: Phaser.GameObjects.Arc;
  private destination: Phaser.Math.Vector2 | null = null;
  private destinationMarker!: Phaser.GameObjects.Arc;
  private resources: Phaser.GameObjects.Arc[] = [];

  constructor(private readonly progression: GameProgression) {
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
      y += 32 * RENDER_SCALE
    ) {
      arena.lineBetween(ARENA.left + RENDER_SCALE, y, ARENA.right - RENDER_SCALE, y);
    }

    this.collectionZone = this.add
      .circle(
        320 * RENDER_SCALE,
        320 * RENDER_SCALE,
        this.getCollectionDistance(),
        0x38bdf8,
        0.12,
      )
      .setStrokeStyle(2 * RENDER_SCALE, 0x7dd3fc, 0.8);

    this.resources = RESOURCE_LOCATIONS.map(({ x, y }) =>
      this.add
        .circle(x * RENDER_SCALE, y * RENDER_SCALE, RESOURCE_RADIUS, 0xfacc15)
        .setStrokeStyle(3 * RENDER_SCALE, 0xfef3c7),
    );

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
    if (this.destination) {
      const deltaX = this.destination.x - this.player.x;
      const deltaY = this.destination.y - this.player.y;
      const distance = Math.hypot(deltaX, deltaY);
      const step = this.progression.getMovementSpeed(PLAYER_SPEED) * (delta / 1000);

      if (distance <= step) {
        this.player.setPosition(this.destination.x, this.destination.y);
        this.destination = null;
        this.destinationMarker.setVisible(false);
      } else {
        this.player.x += (deltaX / distance) * step;
        this.player.y += (deltaY / distance) * step;
      }
    }

    this.collectionZone
      .setPosition(this.player.x, this.player.y)
      .setRadius(this.getCollectionDistance());
    this.collectResources();
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

  private collectResources(): void {
    const collectionDistance = this.getCollectionDistance();

    this.resources = this.resources.filter((resource) => {
      if (
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          resource.x,
          resource.y,
        ) > collectionDistance
      ) {
        return true;
      }

      resource.destroy();
      this.progression.collectResource();
      this.time.delayedCall(
        this.progression.getResourceRespawnDelay(RESOURCE_RESPAWN_DELAY),
        this.respawnResource,
        [],
        this,
      );
      return false;
    });
  }

  private getCollectionDistance(): number {
    return this.progression.getCollectionDistance(
      PLAYER_RADIUS + RESOURCE_RADIUS,
    );
  }

  private respawnResource(): void {
    const positions: Phaser.Math.Vector2[] = [];

    for (
      let y = ARENA.top + RESOURCE_RADIUS;
      y <= ARENA.bottom - RESOURCE_RADIUS;
      y += RESOURCE_SPAWN_SPACING
    ) {
      for (
        let x = ARENA.left + RESOURCE_RADIUS;
        x <= ARENA.right - RESOURCE_RADIUS;
        x += RESOURCE_SPAWN_SPACING
      ) {
        const playerClear =
          Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) >
          PLAYER_RADIUS + RESOURCE_RADIUS + 8 * RENDER_SCALE;
        const resourcesClear = this.resources.every(
          (resource) =>
            Phaser.Math.Distance.Between(x, y, resource.x, resource.y) >
            RESOURCE_SPAWN_SPACING,
        );

        if (playerClear && resourcesClear) {
          positions.push(new Phaser.Math.Vector2(x, y));
        }
      }
    }

    if (positions.length === 0) {
      this.time.delayedCall(RESOURCE_RESPAWN_RETRY_DELAY, this.respawnResource, [], this);
      return;
    }

    const position = Phaser.Utils.Array.GetRandom(positions);
    const resource = this.add
      .circle(position.x, position.y, RESOURCE_RADIUS, 0xfacc15)
      .setStrokeStyle(3 * RENDER_SCALE, 0xfef3c7);

    this.resources.push(resource);
  }
}
