import { describe, expect, it } from "vitest";
import {
  COMPANIONS,
  GameProgression,
  MAX_RECENT_ACTIONS,
  MAX_COMPANION_LEVEL,
  SUMMON_COST,
  SUMMON_COST_INCREMENT,
} from "../src/game/progression";

function collect(progression: GameProgression, amount: number): void {
  for (let i = 0; i < amount; i += 1) {
    progression.collectResource();
  }
}

describe("GameProgression", () => {
  it("increases the summon cost by one after each successful summon", () => {
    const progression = new GameProgression(() => 0);

    expect(progression.summon()).toEqual({ kind: "insufficient-resources" });
    expect(progression.getSnapshot().summonCost).toBe(SUMMON_COST);

    collect(progression, SUMMON_COST + SUMMON_COST_INCREMENT);
    expect(progression.summon()).toMatchObject({
      kind: "success",
      companion: { id: "mosquito" },
      level: 1,
    });
    expect(progression.getSnapshot()).toMatchObject({
      resources: SUMMON_COST_INCREMENT,
      summonCost: SUMMON_COST + SUMMON_COST_INCREMENT,
    });

    expect(progression.summon()).toEqual({ kind: "insufficient-resources" });
    expect(progression.getSnapshot().summonCost).toBe(
      SUMMON_COST + SUMMON_COST_INCREMENT,
    );
  });

  it("upgrades duplicate companions and does not charge after they are all maxed", () => {
    const progression = new GameProgression(() => 0);
    const summonCount = MAX_COMPANION_LEVEL * COMPANIONS.length;
    const totalCost =
      (summonCount *
        (2 * SUMMON_COST + (summonCount - 1) * SUMMON_COST_INCREMENT)) /
      2;
    collect(
      progression,
      totalCost + SUMMON_COST + summonCount * SUMMON_COST_INCREMENT,
    );

    for (
      let i = 0;
      i < MAX_COMPANION_LEVEL * COMPANIONS.length;
      i += 1
    ) {
      expect(progression.summon()).toMatchObject({ kind: "success" });
    }

    expect(progression.summon()).toEqual({ kind: "all-maxed" });
    expect(progression.getSnapshot().resources).toBe(
      SUMMON_COST + summonCount * SUMMON_COST_INCREMENT,
    );
    expect(Object.values(progression.getSnapshot().companions)).toEqual([
      MAX_COMPANION_LEVEL,
      MAX_COMPANION_LEVEL,
      MAX_COMPANION_LEVEL,
      MAX_COMPANION_LEVEL,
    ]);
  });

  it("reports the number and total cost of affordable summons", () => {
    const progression = new GameProgression(() => 0);
    collect(progression, 12);

    expect(progression.getSnapshot()).toMatchObject({
      resources: 12,
      summonCost: SUMMON_COST,
      affordableSummons: 2,
      affordableSummonCost:
        SUMMON_COST + (SUMMON_COST + SUMMON_COST_INCREMENT),
    });
  });

  it("summons repeatedly with increasing costs and notifies once", () => {
    const progression = new GameProgression(() => 0);
    collect(progression, 12);
    const snapshots: number[] = [];
    progression.subscribe(({ resources }) => snapshots.push(resources));

    expect(progression.summonAll()).toMatchObject({
      kind: "success",
      summons: [
        { companion: { id: "mosquito" }, level: 1 },
        { companion: { id: "mosquito" }, level: 2 },
      ],
    });
    expect(progression.getSnapshot()).toMatchObject({
      resources: 1,
      summonCost: SUMMON_COST + 2 * SUMMON_COST_INCREMENT,
      affordableSummons: 0,
      companions: { mosquito: 2 },
    });
    expect(snapshots).toEqual([12, 1]);
  });

  it("does not add resource collections to the action history", () => {
    const progression = new GameProgression(() => 0);
    collect(progression, 11);

    expect(progression.getSnapshot().recentActions).toEqual([]);
  });

  it("keeps only the five most recent summon actions", () => {
    const progression = new GameProgression(() => 0);
    const summonCount = 6;
    const totalCost =
      (summonCount *
        (2 * SUMMON_COST + (summonCount - 1) * SUMMON_COST_INCREMENT)) /
      2;
    collect(progression, totalCost);

    for (let i = 0; i < summonCount; i += 1) {
      progression.summon();
    }

    const { recentActions } = progression.getSnapshot();
    expect(recentActions).toHaveLength(MAX_RECENT_ACTIONS);
    expect(recentActions).toEqual([
      "Lapin rapide invoqué · niveau 3.",
      "Lapin rapide invoqué · niveau 2.",
      "Lapin rapide invoqué · niveau 1.",
      "Moustique doré invoqué · niveau 3.",
      "Moustique doré invoqué · niveau 2.",
    ]);
  });

  it("limits batch summons to remaining companion levels", () => {
    const progression = new GameProgression(() => 0);
    const summonCount = MAX_COMPANION_LEVEL * COMPANIONS.length;
    const totalCost =
      (summonCount *
        (2 * SUMMON_COST + (summonCount - 1) * SUMMON_COST_INCREMENT)) /
      2;
    collect(progression, totalCost + 100);

    for (let i = 0; i < MAX_COMPANION_LEVEL; i += 1) {
      progression.summon();
    }
    expect(progression.getSnapshot().companions.mosquito).toBe(MAX_COMPANION_LEVEL);
    expect(progression.getAffordableSummonCount()).toBe(
      MAX_COMPANION_LEVEL * (COMPANIONS.length - 1),
    );

    const result = progression.summonAll();
    expect(result.kind).toBe("success");
    if (result.kind !== "success") {
      throw new Error("Les compagnons encore améliorable auraient dû être invoqués.");
    }
    expect(result.summons).toHaveLength(
      MAX_COMPANION_LEVEL * (COMPANIONS.length - 1),
    );
    expect(progression.getSnapshot().companions).toEqual({
      mosquito: MAX_COMPANION_LEVEL,
      rabbit: MAX_COMPANION_LEVEL,
      snail: MAX_COMPANION_LEVEL,
      crab: MAX_COMPANION_LEVEL,
    });
    expect(progression.getAffordableSummonCount()).toBe(0);
  });

  it("applies each companion's passive bonus per level", () => {
    const mosquito = new GameProgression(() => 0);
    const rabbit = new GameProgression(() => 0.4);
    const snail = new GameProgression(() => 0.6);
    const crab = new GameProgression(() => 0.9);

    for (const progression of [mosquito, rabbit, snail, crab]) {
      collect(
        progression,
        SUMMON_COST + (SUMMON_COST + SUMMON_COST_INCREMENT),
      );
      progression.summon();
      progression.summon();
    }

    expect(mosquito.getCollectionDistance(28)).toBe(42);
    expect(rabbit.getMovementSpeed(240)).toBe(312);
    expect(snail.getResourceRespawnDelay(3000)).toBe(2100);
    expect(crab.getCompanionLevel("crab")).toBe(2);
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
