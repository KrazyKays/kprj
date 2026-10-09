import type { GameProgression, ProgressionSnapshot } from "../game/progression";

export function bindActionsUi(progression: GameProgression): () => void {
  const fragmentCount = document.getElementById("fragment-count");
  const fragmentUnit = document.getElementById("fragment-unit");
  const wallRemovalButton = document.getElementById("wall-removal-button");
  const actionHint = document.getElementById("action-hint");

  if (
    !(fragmentCount instanceof HTMLOutputElement) ||
    !(fragmentUnit instanceof HTMLElement) ||
    !(wallRemovalButton instanceof HTMLButtonElement) ||
    !(actionHint instanceof HTMLElement)
  ) {
    throw new Error("L’interface des actions est incomplète.");
  }

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

    actionHint.textContent = snapshot.wallRemovalActive
      ? "Cliquez sur un mur de l’arène pour le supprimer."
      : !noWalls && !affordable
        ? `Il faut ${cost} fragment pour supprimer un mur.`
        : "";
  };

  const unsubscribe = progression.subscribe(render);
  const toggle = (): void => {
    if (progression.isWallRemovalActive()) {
      progression.cancelWallRemoval();
    } else {
      progression.startWallRemoval();
    }
  };

  wallRemovalButton.addEventListener("click", toggle);
  return () => {
    unsubscribe();
    wallRemovalButton.removeEventListener("click", toggle);
  };
}
