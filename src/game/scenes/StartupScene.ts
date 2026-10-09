import Phaser from "phaser";
import {
  getNearestResources,
  isResourceTouchingCollectionZone,
} from "../collection";
import type { GameProgression } from "../progression";
import { RENDER_SCALE } from "../renderScale";
import type { TutorialGuide } from "../tutorial";
import {
  DEFAULT_WALLS,
  isCircleCollidingWithAnyObstacle,
  moveCircleWithObstacles,
  resolveCirclePosition,
  scaleObstacles,
  type ObstacleRect,
} from "../obstacles";

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
const SPECIAL_TOKEN_RESPAWN_DELAY = 6000;
const FRAGMENT_RESPAWN_DELAY = 8000;
const SPECIAL_TOKEN_ABSORBED_RESOURCE_COUNT = 3;
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
  private wallsGraphics!: Phaser.GameObjects.Graphics;
  private resources: Phaser.GameObjects.Arc[] = [];
  private observedResourceCapacity = RESOURCE_LOCATIONS.length;
  private specialTokens: Phaser.GameObjects.Star[] = [];
  private pendingSpecialTokenSpawns = 0;
  private fragments: Phaser.GameObjects.Rectangle[] = [];
  private pendingFragmentSpawns = 0;
  private readonly walls: ObstacleRect[] = scaleObstacles(
    DEFAULT_WALLS,
    RENDER_SCALE,
  );

  constructor(
    private readonly progression: GameProgression,
    private readonly tutorial: TutorialGuide,
  ) {
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

    this.wallsGraphics = this.add.graphics().setDepth(2);
    this.drawWalls();
    this.progression.subscribe(({ wallsRemaining, lastRemovedWallIndex }) => {
      if (this.walls.length > wallsRemaining && lastRemovedWallIndex !== null) {
        this.walls.splice(lastRemovedWallIndex, 1);
        this.drawWalls();
      }
    });

    this.collectionZone = this.add
      .circle(
        320 * RENDER_SCALE,
        320 * RENDER_SCALE,
        this.getCollectionZoneRadius(),
        0xc93324,
        0.08,
      )
      .setStrokeStyle(2 * RENDER_SCALE, 0xc93324, 1)
      .setDepth(1);

    this.resources = RESOURCE_LOCATIONS.map(({ x, y }) =>
      this.add
        .circle(x * RENDER_SCALE, y * RENDER_SCALE, RESOURCE_RADIUS, 0xe2a82e)
        .setStrokeStyle(3 * RENDER_SCALE, 0x191815)
        .setDepth(3),
    );

    this.player = this.add
      .circle(320 * RENDER_SCALE, 320 * RENDER_SCALE, PLAYER_RADIUS, 0xc93324)
      .setStrokeStyle(3 * RENDER_SCALE, 0x191815)
      .setDepth(4);

    this.destinationMarker = this.add
      .circle(320 * RENDER_SCALE, 320 * RENDER_SCALE, 8 * RENDER_SCALE)
      .setStrokeStyle(2 * RENDER_SCALE, 0x191815)
      .setDepth(4)
      .setVisible(false);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.setDestination, this);
  }

  update(_time: number, delta: number): void {
    if (this.destination) {
      const step =
        this.progression.getMovementSpeed(PLAYER_SPEED) * (delta / 1000);
      const result = moveCircleWithObstacles(
        { x: this.player.x, y: this.player.y },
        this.destination,
        step,
        PLAYER_RADIUS,
        this.walls,
        ARENA,
      );

      this.player.setPosition(result.position.x, result.position.y);

      if (result.reached) {
        this.destination = null;
        this.destinationMarker.setVisible(false);
      }
    }

    const collectionZoneRadius = this.getCollectionZoneRadius();
    this.collectionZone
      .setPosition(this.player.x, this.player.y)
      .setRadius(collectionZoneRadius);
    this.collectResources(collectionZoneRadius);
    this.ensureResourceCapacity();
    this.ensureSpecialTokens();
    this.collectSpecialTokens(collectionZoneRadius);
    this.ensureFragments();
    this.collectFragments(collectionZoneRadius);
  }

  private ensureFragments(): void {
    const missingCount =
      this.progression.getFragmentCapacity() -
      this.fragments.length -
      this.pendingFragmentSpawns;

    for (let i = 0; i < missingCount; i += 1) {
      this.scheduleFragmentSpawn(0);
    }
  }

  private collectFragments(collectionZoneRadius: number): void {
    this.fragments = this.fragments.filter((fragment) => {
      if (
        !isResourceTouchingCollectionZone(
          this.player,
          fragment,
          collectionZoneRadius,
          RESOURCE_RADIUS,
        )
      ) {
        return true;
      }

      const feedback = this.add
        .text(fragment.x, fragment.y - 20 * RENDER_SCALE, "+1 FRAGMENT", {
          fontFamily: "Impact, Arial, sans-serif",
          fontSize: `${16 * RENDER_SCALE}px`,
          fontStyle: "bold",
          color: "#23766b",
          stroke: "#f4eddf",
          strokeThickness: 3 * RENDER_SCALE,
        })
        .setOrigin(0.5)
        .setDepth(10);

      this.tweens.add({
        targets: feedback,
        y: feedback.y - 24 * RENDER_SCALE,
        alpha: 0,
        scale: 1.1,
        duration: 1000,
        ease: "Cubic.Out",
        onComplete: () => feedback.destroy(),
      });

      fragment.destroy();
      this.progression.collectFragment();
      this.scheduleFragmentSpawn(FRAGMENT_RESPAWN_DELAY);
      return false;
    });
  }

  private scheduleFragmentSpawn(delay: number): void {
    this.pendingFragmentSpawns += 1;
    this.time.delayedCall(delay, this.spawnPendingFragment, [], this);
  }

  private spawnPendingFragment(): void {
    const position = this.findAvailableResourcePosition();
    if (!position) {
      this.time.delayedCall(
        RESOURCE_RESPAWN_RETRY_DELAY,
        this.spawnPendingFragment,
        [],
        this,
      );
      return;
    }

    this.pendingFragmentSpawns -= 1;
    this.fragments.push(
      this.add
        .rectangle(
          position.x,
          position.y,
          RESOURCE_RADIUS * 1.4,
          RESOURCE_RADIUS * 1.4,
          0x2f9e8f,
        )
        .setAngle(45)
        .setStrokeStyle(3 * RENDER_SCALE, 0x191815)
        .setDepth(3),
    );
  }

  private drawWalls(): void {
    this.wallsGraphics.clear();
    for (const wall of this.walls) {
      // Solid dark ink fill
      this.wallsGraphics.fillStyle(0x231f1c, 1);
      this.wallsGraphics.fillRect(wall.x, wall.y, wall.width, wall.height);

      // Inner subtle border for printed relief effect
      this.wallsGraphics.lineStyle(RENDER_SCALE, 0x473e35, 0.85);
      this.wallsGraphics.strokeRect(
        wall.x + 2 * RENDER_SCALE,
        wall.y + 2 * RENDER_SCALE,
        wall.width - 4 * RENDER_SCALE,
        wall.height - 4 * RENDER_SCALE,
      );

      // Black outline matching arena borders and entities
      this.wallsGraphics.lineStyle(
        3 * RENDER_SCALE,
        0x191815,
        1,
      );
      this.wallsGraphics.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }
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

    const resolved = resolveCirclePosition(
      destinationX,
      destinationY,
      PLAYER_RADIUS,
      this.walls,
      ARENA,
    );

    this.destination = new Phaser.Math.Vector2(resolved.x, resolved.y);
    this.destinationMarker
      .setPosition(resolved.x, resolved.y)
      .setVisible(true);
    this.tutorial.onMoveCommand();
  }

  private collectResources(collectionZoneRadius: number): void {
    this.resources = this.resources.filter((resource) => {
      if (
        !isResourceTouchingCollectionZone(
          this.player,
          resource,
          collectionZoneRadius,
          RESOURCE_RADIUS,
        )
      ) {
        return true;
      }

      const pickupFeedback = this.add
        .text(resource.x, resource.y - 20 * RENDER_SCALE, "+1 PÉPITE", {
          fontFamily: "Impact, Arial, sans-serif",
          fontSize: `${16 * RENDER_SCALE}px`,
          fontStyle: "bold",
          color: "#c93324",
          stroke: "#f4eddf",
          strokeThickness: 3 * RENDER_SCALE,
        })
        .setOrigin(0.5)
        .setDepth(10);

      this.tweens.add({
        targets: pickupFeedback,
        y: pickupFeedback.y - 24 * RENDER_SCALE,
        alpha: 0,
        scale: 1.1,
        duration: 1000,
        ease: "Cubic.Out",
        onComplete: () => pickupFeedback.destroy(),
      });

      resource.destroy();
      this.progression.collectResource();
      this.tutorial.onResourceCollected();
      this.scheduleResourceSpawn(
        this.progression.getResourceRespawnDelay(RESOURCE_RESPAWN_DELAY),
      );
      return false;
    });
  }

  private getCollectionZoneRadius(): number {
    return this.progression.getCollectionDistance(
      PLAYER_RADIUS + RESOURCE_RADIUS,
    ) - RESOURCE_RADIUS;
  }

  private ensureResourceCapacity(): void {
    const capacity = this.progression.getBaseResourceCapacity(
      RESOURCE_LOCATIONS.length,
    );
    const additionalCapacity = capacity - this.observedResourceCapacity;
    this.observedResourceCapacity = capacity;

    for (let i = 0; i < additionalCapacity; i += 1) {
      this.scheduleResourceSpawn(0);
    }
  }

  private ensureSpecialTokens(): void {
    const desiredCount = this.progression.getCompanionLevel("crab");
    const missingCount =
      desiredCount - this.specialTokens.length - this.pendingSpecialTokenSpawns;

    for (let i = 0; i < missingCount; i += 1) {
      this.scheduleSpecialTokenSpawn(0);
    }
  }

  private collectSpecialTokens(collectionZoneRadius: number): void {
    this.specialTokens = this.specialTokens.filter((token) => {
      if (
        !isResourceTouchingCollectionZone(
          this.player,
          token,
          collectionZoneRadius,
          RESOURCE_RADIUS,
        )
      ) {
        return true;
      }

      const absorbedResources = getNearestResources(
        token,
        this.resources,
        SPECIAL_TOKEN_ABSORBED_RESOURCE_COUNT,
      );
      const absorbedSet = new Set(absorbedResources);
      this.resources = this.resources.filter((resource) => {
        if (!absorbedSet.has(resource)) {
          return true;
        }

        resource.destroy();
        this.progression.collectResource();
        this.tutorial.onResourceCollected();
        this.scheduleResourceSpawn(
          this.progression.getResourceRespawnDelay(RESOURCE_RESPAWN_DELAY),
        );
        return false;
      });

      const feedback = this.add
        .text(
          token.x,
          token.y - 20 * RENDER_SCALE,
          `+${absorbedResources.length} PÉPITE${absorbedResources.length === 1 ? "" : "S"} ASPIRÉE${absorbedResources.length === 1 ? "" : "S"}`,
          {
            fontFamily: "Impact, Arial, sans-serif",
            fontSize: `${16 * RENDER_SCALE}px`,
            fontStyle: "bold",
            color: "#7157a5",
            stroke: "#f4eddf",
            strokeThickness: 3 * RENDER_SCALE,
          },
        )
        .setOrigin(0.5)
        .setDepth(10);

      this.tweens.add({
        targets: feedback,
        y: feedback.y - 24 * RENDER_SCALE,
        alpha: 0,
        scale: 1.1,
        duration: 1000,
        ease: "Cubic.Out",
        onComplete: () => feedback.destroy(),
      });

      token.destroy();
      this.scheduleSpecialTokenSpawn(SPECIAL_TOKEN_RESPAWN_DELAY);
      return false;
    });
  }

  private scheduleSpecialTokenSpawn(delay: number): void {
    this.pendingSpecialTokenSpawns += 1;
    this.time.delayedCall(delay, this.spawnPendingSpecialToken, [], this);
  }

  private spawnPendingSpecialToken(): void {
    const position = this.findAvailableResourcePosition();
    if (!position) {
      this.time.delayedCall(
        RESOURCE_RESPAWN_RETRY_DELAY,
        this.spawnPendingSpecialToken,
        [],
        this,
      );
      return;
    }

    this.pendingSpecialTokenSpawns -= 1;
    this.specialTokens.push(
      this.add
        .star(
          position.x,
          position.y,
          4,
          RESOURCE_RADIUS * 0.55,
          RESOURCE_RADIUS,
          0x7157a5,
        )
        .setStrokeStyle(3 * RENDER_SCALE, 0x191815)
        .setDepth(3),
    );
  }

  private scheduleResourceSpawn(delay: number): void {
    this.time.delayedCall(delay, this.spawnPendingResource, [], this);
  }

  private spawnPendingResource(): void {
    const capacity = this.progression.getBaseResourceCapacity(
      RESOURCE_LOCATIONS.length,
    );
    if (this.resources.length >= capacity) {
      return;
    }

    const position = this.findAvailableResourcePosition();
    if (!position) {
      this.time.delayedCall(
        RESOURCE_RESPAWN_RETRY_DELAY,
        this.spawnPendingResource,
        [],
        this,
      );
      return;
    }

    const resource = this.add
      .circle(position.x, position.y, RESOURCE_RADIUS, 0xe2a82e)
      .setStrokeStyle(3 * RENDER_SCALE, 0x191815)
      .setDepth(3);

    this.resources.push(resource);
  }

  private findAvailableResourcePosition(): Phaser.Math.Vector2 | null {
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
        const resourcesClear = [
          ...this.resources,
          ...this.specialTokens,
          ...this.fragments,
        ].every(
          (resource) =>
            Phaser.Math.Distance.Between(x, y, resource.x, resource.y) >
            RESOURCE_SPAWN_SPACING,
        );
        const wallsClear = !isCircleCollidingWithAnyObstacle(
          x,
          y,
          RESOURCE_RADIUS + 4 * RENDER_SCALE,
          this.walls,
        );

        if (playerClear && resourcesClear && wallsClear) {
          positions.push(new Phaser.Math.Vector2(x, y));
        }
      }
    }

    return positions.length > 0 ? Phaser.Utils.Array.GetRandom(positions) : null;
  }
}
