import type { GameProgression, ProgressionSnapshot } from "../game/progression";
import type { TutorialGuide } from "../game/tutorial";

function sumLevels(snapshot: ProgressionSnapshot): number {
  return Object.values(snapshot.companions).reduce(
    (total, level) => total + level,
    0,
  );
}

export function bindActionsUi(
  progression: GameProgression,
  tutorial: TutorialGuide,
): () => void {
  const fragmentCount = document.getElementById("fragment-count");
  const fragmentUnit = document.getElementById("fragment-unit");
  const wallRemovalButton = document.getElementById("wall-removal-button");
  const autoSummonButton = document.getElementById("auto-summon-button");
  const actionHint = document.getElementById("action-hint");

  if (
    !(fragmentCount instanceof HTMLOutputElement) ||
    !(fragmentUnit instanceof HTMLElement) ||
    !(wallRemovalButton instanceof HTMLButtonElement) ||
    !(autoSummonButton instanceof HTMLButtonElement) ||
    !(actionHint instanceof HTMLElement)
  ) {
    throw new Error("L’interface des actions est incomplète.");
  }

  let previousLevels: number | null = null;

  const render = (snapshot: ProgressionSnapshot): void => {
    fragmentCount.value = String(snapshot.fragments);
    fragmentUnit.textContent =
      snapshot.fragments > 1 ? "fragments disponibles" : "fragment disponible";

    const cost = snapshot.wallRemovalCost;
    const noWalls = snapshot.wallsRemaining === 0;
    const canRemoveWall = !noWalls && snapshot.fragments >= cost;

    wallRemovalButton.disabled = !canRemoveWall;
    wallRemovalButton.textContent = noWalls
      ? "Tous les murs sont supprimés"
      : `Supprimer un mur aléatoire · ${cost} fragments`;

    const unlocked = snapshot.autoSummonUnlocked;
    autoSummonButton.disabled =
      !unlocked && snapshot.fragments < snapshot.autoSummonCost;
    autoSummonButton.classList.toggle("fragment-action", !unlocked);
    autoSummonButton.classList.toggle("is-active", snapshot.autoSummonEnabled);
    if (unlocked) {
      autoSummonButton.setAttribute(
        "aria-pressed",
        String(snapshot.autoSummonEnabled),
      );
    } else {
      autoSummonButton.removeAttribute("aria-pressed");
    }
    autoSummonButton.textContent = !unlocked
      ? `Débloquer l’achat auto · ${snapshot.autoSummonCost} fragments`
      : snapshot.autoSummonEnabled
        ? "Achat auto d’invocations : activé"
        : "Achat auto d’invocations : désactivé";

    const missing: string[] = [];
    if (!unlocked && snapshot.fragments < snapshot.autoSummonCost) {
      missing.push(`${snapshot.autoSummonCost} fragments pour débloquer l’achat auto`);
    }
    if (!noWalls && !canRemoveWall) {
      missing.push(`${cost} fragments pour supprimer un mur`);
    }
    actionHint.textContent = missing.length
      ? `Il faut ${missing.join(" · ")}.`
      : "";
    // Les invocations automatiques doivent aussi faire avancer le tutoriel.
    const levels = sumLevels(snapshot);
    if (
      previousLevels !== null &&
      levels > previousLevels &&
      snapshot.autoSummonEnabled
    ) {
      tutorial.onCompanionSummoned();
    }
    previousLevels = levels;
  };

  const unsubscribe = progression.subscribe(render);
  const removeWall = (): void => {
    progression.removeRandomWall();
  };
  const toggleAutoSummon = (): void => {
    if (!progression.getSnapshot().autoSummonUnlocked) {
      progression.unlockAutoSummon();
      return;
    }
    progression.setAutoSummon(!progression.getSnapshot().autoSummonEnabled);
  };

  wallRemovalButton.addEventListener("click", removeWall);
  autoSummonButton.addEventListener("click", toggleAutoSummon);
  return () => {
    unsubscribe();
    wallRemovalButton.removeEventListener("click", removeWall);
    autoSummonButton.removeEventListener("click", toggleAutoSummon);
  };
}
