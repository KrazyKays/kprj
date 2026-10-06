// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { TutorialGuide } from "../src/game/tutorial";
import { bindTutorialUi } from "../src/ui/TutorialUi";

let unsubscribe: (() => void) | undefined;

function mountTutorialUi(tutorial: TutorialGuide): void {
  document.body.innerHTML = `
    <div id="tutorial-hint">
      <p id="tutorial-message" role="status" aria-live="polite"></p>
      <button id="tutorial-dismiss" type="button">Masquer</button>
    </div>
  `;
  unsubscribe = bindTutorialUi(tutorial);
}

afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
  document.body.replaceChildren();
});

describe("TutorialGuide", () => {
  it("progresses through movement, collection and the first summon", () => {
    const tutorial = new TutorialGuide();
    const steps: string[] = [];
    tutorial.subscribe((step) => steps.push(step));

    tutorial.onResourceCollected();
    expect(tutorial.getStep()).toBe("move");

    tutorial.onMoveCommand();
    expect(tutorial.getStep()).toBe("collect");

    tutorial.onCompanionSummoned();
    expect(tutorial.getStep()).toBe("collect");

    tutorial.onResourceCollected();
    expect(tutorial.getStep()).toBe("summon");

    tutorial.onCompanionSummoned();
    expect(tutorial.getStep()).toBe("complete");
    expect(steps).toEqual(["move", "collect", "summon", "complete"]);
  });

  it("updates the accessible hint and hides it after completing the tutorial", () => {
    const tutorial = new TutorialGuide();
    mountTutorialUi(tutorial);
    const hint = document.getElementById("tutorial-hint") as HTMLElement;
    const message = document.getElementById("tutorial-message");

    expect(hint.hidden).toBe(false);
    expect(message?.textContent).toContain("ÉTAPE 1/3");

    tutorial.onMoveCommand();
    expect(message?.textContent).toContain("ÉTAPE 2/3");

    tutorial.onResourceCollected();
    expect(message?.textContent).toContain("ÉTAPE 3/3");

    tutorial.onCompanionSummoned();
    expect(hint.hidden).toBe(true);
  });

  it("allows the player to dismiss the tutorial at any step", () => {
    const tutorial = new TutorialGuide();
    mountTutorialUi(tutorial);

    (document.getElementById("tutorial-dismiss") as HTMLButtonElement).click();

    expect(tutorial.getStep()).toBe("dismissed");
    expect((document.getElementById("tutorial-hint") as HTMLElement).hidden).toBe(
      true,
    );
  });
});
