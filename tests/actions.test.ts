// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { findObstacleIndexAt } from "../src/game/obstacles";
import {
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
    <p id="action-hint"></p>
  `;
  unsubscribe = bindActionsUi(progression, tutorial);
}

afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
  document.body.replaceChildren();
});

describe("fragments and wall removal", () => {
  it("starts without fragments and refuses to arm the action", () => {
    const progression = new GameProgression();

    expect(progression.getSnapshot().fragments).toBe(0);
    expect(progression.startWallRemoval()).toBe("insufficient-fragments");
    expect(progression.confirmWallRemoval()).toBe(false);
    expect(progression.getSnapshot().wallRemovalActive).toBe(false);
  });

  it("spends fragments to remove one wall at a time and logs the action", () => {
    const progression = new GameProgression();
    const initialWalls = progression.getSnapshot().wallsRemaining;
    progression.collectFragment(WALL_REMOVAL_COST * 2);

    expect(progression.startWallRemoval()).toBe("ready");
    expect(progression.confirmWallRemoval()).toBe(true);
    expect(progression.getSnapshot()).toMatchObject({
      fragments: WALL_REMOVAL_COST,
      wallsRemaining: initialWalls - 1,
      wallRemovalActive: false,
    });
    expect(progression.getSnapshot().recentActions[0]).toContain("Mur supprimé");
    expect(progression.confirmWallRemoval()).toBe(false);
  });

  it("does not charge when the removal is cancelled", () => {
    const progression = new GameProgression();
    progression.collectFragment(WALL_REMOVAL_COST);
    progression.startWallRemoval();
    progression.cancelWallRemoval();

    expect(progression.confirmWallRemoval()).toBe(false);
    expect(progression.getSnapshot().fragments).toBe(WALL_REMOVAL_COST);
  });

  it("stops offering the action when no wall remains", () => {
    const progression = new GameProgression();
    const walls = progression.getSnapshot().wallsRemaining;
    progression.collectFragment(walls + 1);

    for (let i = 0; i < walls; i += 1) {
      progression.startWallRemoval();
      progression.confirmWallRemoval();
    }

    expect(progression.startWallRemoval()).toBe("no-walls");
  });

  it("finds the wall under a point", () => {
    const walls = [{ x: 10, y: 10, width: 20, height: 20 }];

    expect(findObstacleIndexAt(15, 15, walls)).toBe(0);
    expect(findObstacleIndexAt(5, 15, walls)).toBe(-1);
  });

  it("drives the actions panel", () => {
    const progression = new GameProgression();
    mountUi(progression);
    const button = document.getElementById(
      "wall-removal-button",
    ) as HTMLButtonElement;

    expect(document.getElementById("fragment-count")?.textContent).toBe("0");
    expect(button.disabled).toBe(true);
    expect(document.getElementById("action-hint")?.textContent).toContain(
      "fragment",
    );

    progression.collectFragment();
    expect(document.getElementById("fragment-unit")?.textContent).toBe(
      "fragment disponible",
    );
    expect(button.disabled).toBe(false);

    button.click();
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.textContent).toBe("Annuler la suppression");

    button.click();
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(progression.getSnapshot().fragments).toBe(1);
  });

  it("toggles automatic summoning and advances the tutorial when it buys", () => {
    const progression = new GameProgression(() => 0);
    const tutorial = new TutorialGuide();
    tutorial.onMoveCommand();
    tutorial.onResourceCollected();
    mountUi(progression, tutorial);
    const button = document.getElementById(
      "auto-summon-button",
    ) as HTMLButtonElement;

    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.textContent).toContain("désactivé");

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
