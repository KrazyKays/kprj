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
    arena.fillStyle(0xeee4ce);
    arena.fillRect(
      ARENA.left,
      ARENA.top,
      ARENA.right - ARENA.left,
      ARENA.bottom - ARENA.top,
    );
    arena.lineStyle(3 * RENDER_SCALE, 0x191815, 1);
    arena.strokeRect(
      ARENA.left,
      ARENA.top,
      ARENA.right - ARENA.left,
      ARENA.bottom - ARENA.top,
    );
    arena.fillStyle(0x8a7962, 0.28);
    for (let y = ARENA.top + 10 * RENDER_SCALE; y < ARENA.bottom; y += 16 * RENDER_SCALE) {
      for (let x = ARENA.left + 10 * RENDER_SCALE; x < ARENA.right; x += 16 * RENDER_SCALE) {
        if (((x / RENDER_SCALE + y / RENDER_SCALE) / 16) % 3 !== 0) {
          arena.fillCircle(x, y, RENDER_SCALE);
        }
      }
    }

    this.collectionZone = this.add
      .circle(
        320 * RENDER_SCALE,
        320 * RENDER_SCALE,
        this.getCollectionDistance(),
        0xc93324,
        0.08,
      )
      .setStrokeStyle(2 * RENDER_SCALE, 0xc93324, 1);

    this.resources = RESOURCE_LOCATIONS.map(({ x, y }) =>
      this.add
        .circle(x * RENDER_SCALE, y * RENDER_SCALE, RESOURCE_RADIUS, 0xe2a82e)
        .setStrokeStyle(3 * RENDER_SCALE, 0x191815),
    );

    this.player = this.add
      .circle(320 * RENDER_SCALE, 320 * RENDER_SCALE, PLAYER_RADIUS, 0xc93324)
      .setStrokeStyle(3 * RENDER_SCALE, 0x191815);

    this.destinationMarker = this.add
      .circle(320 * RENDER_SCALE, 320 * RENDER_SCALE, 8 * RENDER_SCALE)
      .setStrokeStyle(2 * RENDER_SCALE, 0x191815)
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

    const collectionDistance = this.getCollectionDistance();
    this.collectionZone
      .setPosition(this.player.x, this.player.y)
      .setRadius(collectionDistance);
    this.collectResources(collectionDistance);
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

  private collectResources(collectionDistance: number): void {
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
      .circle(position.x, position.y, RESOURCE_RADIUS, 0xe2a82e)
      .setStrokeStyle(3 * RENDER_SCALE, 0x191815);

    this.resources.push(resource);
  }
}
