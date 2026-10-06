import type { TutorialGuide, TutorialStep } from "../game/tutorial";

const TUTORIAL_STEPS = {
  move: {
    number: 1,
    title: "DÉPLACEMENT",
    message: "Cliquez ou touchez l’arène pour déplacer le joueur.",
  },
  collect: {
    number: 2,
    title: "COLLECTE",
    message:
      "Approchez une pépite : elle est ramassée dès que son bord touche le cercle rouge.",
  },
  summon: {
    number: 3,
    title: "INVOCATION",
    message:
      "Ramassez des pépites jusqu’au coût affiché, puis invoquez un compagnon seul ou en groupe.",
  },
} as const;

export function bindTutorialUi(tutorial: TutorialGuide): () => void {
  const hint = document.getElementById("tutorial-hint");
  const message = document.getElementById("tutorial-message");
  const dismissButton = document.getElementById("tutorial-dismiss");

  if (
    !(hint instanceof HTMLElement) ||
    !(message instanceof HTMLParagraphElement) ||
    !(dismissButton instanceof HTMLButtonElement)
  ) {
    throw new Error("L’interface du tutoriel est incomplète.");
  }

  const render = (step: TutorialStep): void => {
    if (step === "complete" || step === "dismissed") {
      hint.hidden = true;
      return;
    }

    const content = TUTORIAL_STEPS[step];
    const label = document.createElement("strong");
    label.textContent = `ÉTAPE ${content.number}/3 · ${content.title}`;
    message.replaceChildren(label, document.createTextNode(` ${content.message}`));
    hint.hidden = false;
  };

  const dismiss = (): void => tutorial.dismiss();
  const unsubscribe = tutorial.subscribe(render);
  dismissButton.addEventListener("click", dismiss);

  return () => {
    unsubscribe();
    dismissButton.removeEventListener("click", dismiss);
  };
}
