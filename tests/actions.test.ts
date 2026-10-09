// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  AUTO_SUMMON_COST,
  GameProgression,
  SUMMON_COST,
  WALL_REMOVAL_COST,
} from "../src/game/progression";
import { TutorialGuide } from "../src/game/tutorial";
import { bindActionsUi } from "../src/ui/ActionsUi";

let unsubscribe: (() => void) | undefined;

function mountUi(progression: GameProgression, tutorial = new TutorialGuide()): void {
  document.body.innerHTML = `
    <output id="fragment-count"></output>
    <span id="fragment-unit"></span>
    <button id="wall-removal-button" type="button"></button>
    <button id="auto-summon-button" type="button"></button>
  `;
  unsubscribe = bindActionsUi(progression, tutorial);
}

afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
  document.body.replaceChildren();
});

describe("fragments and wall removal", () => {
  it("costs 10 fragments and refuses without enough", () => {
    const progression = new GameProgression();
    expect(WALL_REMOVAL_COST).toBe(10);
    progression.collectFragment(WALL_REMOVAL_COST - 1);

    expect(progression.removeRandomWall()).toBe("insufficient-fragments");
    expect(progression.getSnapshot().fragments).toBe(WALL_REMOVAL_COST - 1);
  });

  it("removes a random wall and reports which one", () => {
    const progression = new GameProgression(() => 0.99);
    const initialWalls = progression.getSnapshot().wallsRemaining;
    progression.collectFragment(WALL_REMOVAL_COST * 2);

    expect(progression.removeRandomWall()).toBe("removed");
    expect(progression.getSnapshot()).toMatchObject({
      fragments: WALL_REMOVAL_COST,
      wallsRemaining: initialWalls - 1,
      lastRemovedWallIndex: initialWalls - 1,
    });
    expect(progression.getSnapshot().recentActions[0]).toContain("Mur");

    const first = new GameProgression(() => 0);
    first.collectFragment(WALL_REMOVAL_COST);
    first.removeRandomWall();
    expect(first.getSnapshot().lastRemovedWallIndex).toBe(0);
  });

  it("stops offering the action when no wall remains", () => {
    const progression = new GameProgression();
    const walls = progression.getSnapshot().wallsRemaining;
    progression.collectFragment(WALL_REMOVAL_COST * (walls + 1));

    for (let i = 0; i < walls; i += 1) {
      expect(progression.removeRandomWall()).toBe("removed");
    }

    expect(progression.removeRandomWall()).toBe("no-walls");
  });

  it("drives the wall removal button", () => {
    const progression = new GameProgression();
    mountUi(progression);
    const button = document.getElementById(
      "wall-removal-button",
    ) as HTMLButtonElement;

    expect(document.getElementById("fragment-count")?.textContent).toBe("0");
    expect(button.disabled).toBe(true);

    progression.collectFragment(WALL_REMOVAL_COST);
    expect(button.disabled).toBe(false);

    const walls = progression.getSnapshot().wallsRemaining;
    button.click();
    expect(progression.getSnapshot().wallsRemaining).toBe(walls - 1);
    expect(button.disabled).toBe(true);
  });
});

describe("automatic summoning", () => {
  it("must be bought with fragments before it can be toggled", () => {
    const progression = new GameProgression();
    mountUi(progression);
    const button = document.getElementById(
      "auto-summon-button",
    ) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain(`${AUTO_SUMMON_COST} fragments`);
    expect(button.classList.contains("fragment-action")).toBe(true);

    progression.collectFragment(AUTO_SUMMON_COST - 1);
    expect(button.disabled).toBe(true);
    progression.collectFragment();
    expect(button.disabled).toBe(false);

    button.click();
    expect(progression.getSnapshot()).toMatchObject({
      fragments: 0,
      autoSummonUnlocked: true,
      autoSummonEnabled: false,
    });
    expect(button.classList.contains("fragment-action")).toBe(false);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("toggles once unlocked and advances the tutorial when it buys", () => {
    const progression = new GameProgression(() => 0);
    const tutorial = new TutorialGuide();
    tutorial.onMoveCommand();
    tutorial.onResourceCollected();
    progression.collectFragment(AUTO_SUMMON_COST);
    mountUi(progression, tutorial);
    const button = document.getElementById(
      "auto-summon-button",
    ) as HTMLButtonElement;

    button.click();
    button.click();
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.textContent).toContain("activé");

    for (let i = 0; i < SUMMON_COST; i += 1) {
      progression.collectResource();
    }
    expect(progression.getSnapshot().companions.mosquito).toBe(1);
    expect(tutorial.getStep()).toBe("complete");

    button.click();
    expect(progression.getSnapshot().autoSummonEnabled).toBe(false);
    expect(button.textContent).toContain("désactivé");
  });
});
