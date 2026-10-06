import { describe, expect, it } from "vitest";
import {
  getNearestResources,
  isResourceTouchingCollectionZone,
} from "../src/game/collection";

describe("getNearestResources", () => {
  it("returns up to three resources nearest to the token", () => {
    const resources = [
      { x: 20, y: 0, id: "far" },
      { x: 3, y: 0, id: "near" },
      { x: 12, y: 0, id: "middle" },
      { x: 6, y: 0, id: "second" },
    ];

    expect(
      getNearestResources({ x: 0, y: 0 }, resources, 3).map(({ id }) => id),
    ).toEqual(["near", "second", "middle"]);
  });

  it("returns all available resources when fewer than the requested limit exist", () => {
    const resources = [{ x: 8, y: 0 }, { x: 16, y: 0 }];

    expect(getNearestResources({ x: 0, y: 0 }, resources, 3)).toEqual(resources);
  });
});

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
