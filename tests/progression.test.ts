import { describe, expect, it } from "vitest";
import {
  GameProgression,
  MAX_COMPANION_LEVEL,
  SUMMON_COST,
} from "../src/game/progression";

function collect(progression: GameProgression, amount: number): void {
  for (let i = 0; i < amount; i += 1) {
    progression.collectResource();
  }
}

describe("GameProgression", () => {
  it("requires and spends the fixed summon cost", () => {
    const progression = new GameProgression(() => 0);

    expect(progression.summon()).toEqual({ kind: "insufficient-resources" });

    collect(progression, SUMMON_COST);
    expect(progression.summon()).toMatchObject({
      kind: "success",
      companion: { id: "mosquito" },
      level: 1,
    });
    expect(progression.getSnapshot().resources).toBe(0);
  });

  it("upgrades duplicate companions and does not charge after they are all maxed", () => {
    const progression = new GameProgression(() => 0);
    collect(progression, SUMMON_COST * (MAX_COMPANION_LEVEL * 3 + 1));

    for (let i = 0; i < MAX_COMPANION_LEVEL * 3; i += 1) {
      expect(progression.summon()).toMatchObject({ kind: "success" });
    }

    expect(progression.summon()).toEqual({ kind: "all-maxed" });
    expect(progression.getSnapshot().resources).toBe(SUMMON_COST);
    expect(Object.values(progression.getSnapshot().companions)).toEqual([
      MAX_COMPANION_LEVEL,
      MAX_COMPANION_LEVEL,
      MAX_COMPANION_LEVEL,
    ]);
  });

  it("applies each companion's passive bonus per level", () => {
    const mosquito = new GameProgression(() => 0);
    const rabbit = new GameProgression(() => 0.4);
    const snail = new GameProgression(() => 0.9);

    for (const progression of [mosquito, rabbit, snail]) {
      collect(progression, SUMMON_COST * 2);
      progression.summon();
      progression.summon();
    }

    expect(mosquito.getCollectionDistance(28)).toBe(42);
    expect(rabbit.getMovementSpeed(240)).toBe(312);
    expect(snail.getResourceRespawnDelay(3000)).toBe(2100);
  });

  it("publishes progression snapshots and supports unsubscribing", () => {
    const progression = new GameProgression();
    const resources: number[] = [];
    const unsubscribe = progression.subscribe(({ resources: count }) => {
      resources.push(count);
    });

    progression.collectResource();
    unsubscribe();
    progression.collectResource();

    expect(resources).toEqual([0, 1]);
  });
});
