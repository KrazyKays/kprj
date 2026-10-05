import {
  COMPANIONS,
  GameProgression,
  MAX_COMPANION_LEVEL,
  SUMMON_COST,
} from "../game/progression";
import type { CompanionId, ProgressionSnapshot } from "../game/progression";

export function bindProgressionUi(progression: GameProgression): () => void {
  const resourceCount = document.getElementById("resource-count");
  const summonButton = document.getElementById("summon-button");
  const summonResult = document.getElementById("summon-result");
  const companionList = document.getElementById("companion-list");

  if (
    !(resourceCount instanceof HTMLOutputElement) ||
    !(summonButton instanceof HTMLButtonElement) ||
    !(summonResult instanceof HTMLElement) ||
    !(companionList instanceof HTMLElement)
  ) {
    throw new Error("L’interface de progression est incomplète.");
  }

  const companionLevels = new Map<CompanionId, HTMLOutputElement>();
  for (const companion of COMPANIONS) {
    const item = document.createElement("li");
    item.className = "companion-entry";

    const name = document.createElement("strong");
    name.textContent = companion.name;

    const passive = document.createElement("span");
    passive.textContent = companion.passive;

    const level = document.createElement("output");
    level.className = "companion-level";
    level.setAttribute("aria-label", `Niveau de ${companion.name}`);
    companionLevels.set(companion.id, level);

    item.append(name, passive, level);
    companionList.append(item);
  }

  const render = (snapshot: ProgressionSnapshot): void => {
    resourceCount.value = String(snapshot.resources);

    let allMaxed = true;
    for (const companion of COMPANIONS) {
      const level = snapshot.companions[companion.id];
      const levelOutput = companionLevels.get(companion.id);
      if (!levelOutput) {
        throw new Error(`Le niveau de ${companion.name} ne peut pas être affiché.`);
      }

      levelOutput.value =
        level === 0
          ? "Non obtenu"
          : level >= MAX_COMPANION_LEVEL
            ? `Niv. ${level} · Max`
            : `Niv. ${level}`;
      if (level < MAX_COMPANION_LEVEL) {
        allMaxed = false;
      }
    }

    summonButton.disabled = snapshot.resources < SUMMON_COST || allMaxed;
    summonButton.textContent = allMaxed
      ? "Tous les compagnons sont au niveau max"
      : `Invoquer · ${SUMMON_COST} ressources`;
  };

  const unsubscribe = progression.subscribe(render);
  const summon = (): void => {
    const result = progression.summon();

    switch (result.kind) {
      case "success":
        summonResult.textContent =
          result.level === 1
            ? `Nouveau compagnon : ${result.companion.name} !`
            : `${result.companion.name} passe au niveau ${result.level}.`;
        break;
      case "insufficient-resources":
        summonResult.textContent = `Il faut ${SUMMON_COST} ressources pour invoquer.`;
        break;
      case "all-maxed":
        summonResult.textContent = "Tous les compagnons ont atteint leur niveau maximal.";
        break;
    }
  };

  summonButton.addEventListener("click", summon);
  return () => {
    unsubscribe();
    summonButton.removeEventListener("click", summon);
  };
}
