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
    const affordable = snapshot.fragments >= cost;

    wallRemovalButton.setAttribute(
      "aria-pressed",
      String(snapshot.wallRemovalActive),
    );
    wallRemovalButton.disabled =
      !snapshot.wallRemovalActive && (noWalls || !affordable);
    wallRemovalButton.textContent = snapshot.wallRemovalActive
      ? "Annuler la suppression"
      : noWalls
        ? "Tous les murs sont supprimés"
        : `Supprimer un mur · ${cost} fragment`;

    autoSummonButton.setAttribute(
      "aria-pressed",
      String(snapshot.autoSummonEnabled),
    );
    autoSummonButton.classList.toggle("is-active", snapshot.autoSummonEnabled);
    autoSummonButton.textContent = snapshot.autoSummonEnabled
      ? "Achat auto d’invocations : activé"
      : "Achat auto d’invocations : désactivé";

    actionHint.textContent = snapshot.wallRemovalActive
      ? "Cliquez sur un mur de l’arène pour le supprimer."
      : !noWalls && !affordable
        ? `Il faut ${cost} fragment pour supprimer un mur.`
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
  const toggleWallRemoval = (): void => {
    if (progression.isWallRemovalActive()) {
      progression.cancelWallRemoval();
    } else {
      progression.startWallRemoval();
    }
  };
  const toggleAutoSummon = (): void => {
    progression.setAutoSummon(!progression.getSnapshot().autoSummonEnabled);
  };

  wallRemovalButton.addEventListener("click", toggleWallRemoval);
  autoSummonButton.addEventListener("click", toggleAutoSummon);
  return () => {
    unsubscribe();
    wallRemovalButton.removeEventListener("click", toggleWallRemoval);
    autoSummonButton.removeEventListener("click", toggleAutoSummon);
  };
}
