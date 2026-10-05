import { describe, expect, it } from "vitest";
import { isResourceTouchingCollectionZone } from "../src/game/collection";

describe("isResourceTouchingCollectionZone", () => {
  const player = { x: 0, y: 0 };
  const resourceRadius = 12;

  it("collects a resource as soon as its edge touches the zone", () => {
    expect(
      isResourceTouchingCollectionZone(player, { x: 28, y: 0 }, 16, resourceRadius),
    ).toBe(true);
  });

  it("does not collect while there is still a gap", () => {
    expect(
      isResourceTouchingCollectionZone(player, { x: 28.01, y: 0 }, 16, resourceRadius),
    ).toBe(false);
  });

  it("collects resources already overlapping the zone", () => {
    expect(
      isResourceTouchingCollectionZone(player, { x: 20, y: 0 }, 16, resourceRadius),
    ).toBe(true);
  });
});
