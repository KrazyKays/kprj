import {
  COMPANIONS,
  GameProgression,
  MAX_COMPANION_LEVEL,
} from "../game/progression";
import type { CompanionId, ProgressionSnapshot } from "../game/progression";

export function bindProgressionUi(progression: GameProgression): () => void {
  const resourceCount = document.getElementById("resource-count");
  const summonButton = document.getElementById("summon-button");
  const summonPreview = document.getElementById("summon-preview");
  const summonResult = document.getElementById("summon-result");
  const companionList = document.getElementById("companion-list");

  if (
    !(resourceCount instanceof HTMLOutputElement) ||
    !(summonButton instanceof HTMLButtonElement) ||
    !(summonPreview instanceof HTMLElement) ||
    !(summonResult instanceof HTMLElement) ||
    !(companionList instanceof HTMLElement)
  ) {
    throw new Error("L’interface de progression est incomplète.");
  }

  const companionEntries = new Map<
    CompanionId,
    { level: HTMLOutputElement; bonuses: HTMLLIElement[] }
  >();
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

    const bonusLevels = document.createElement("ol");
    bonusLevels.className = "companion-bonus-levels";
    const bonuses = companion.bonusByLevel.map((bonus, index) => {
      const bonusLevel = document.createElement("li");
      bonusLevel.textContent = `Niv. ${index + 1} : ${bonus}`;
      bonusLevels.append(bonusLevel);
      return bonusLevel;
    });
    companionEntries.set(companion.id, { level, bonuses });

    item.append(name, passive, level, bonusLevels);
    companionList.append(item);
  }

  const render = (snapshot: ProgressionSnapshot): void => {
    resourceCount.value = String(snapshot.resources);

    let allMaxed = true;
    for (const companion of COMPANIONS) {
      const level = snapshot.companions[companion.id];
      const entry = companionEntries.get(companion.id);
      if (!entry) {
        throw new Error(`Le niveau de ${companion.name} ne peut pas être affiché.`);
      }

      entry.level.value =
        level === 0
          ? "Non obtenu"
          : level >= MAX_COMPANION_LEVEL
            ? `Niv. ${level} · Max`
            : `Niv. ${level}`;
      entry.bonuses.forEach((bonus, index) => {
        bonus.classList.toggle("is-unlocked", index < level);
        bonus.classList.toggle("is-next", index === level);
      });
      if (level < MAX_COMPANION_LEVEL) {
        allMaxed = false;
      }
    }

    summonButton.disabled = snapshot.affordableSummons === 0;
    summonButton.textContent = allMaxed
      ? "Tous les compagnons sont au niveau max"
      : snapshot.affordableSummons > 0
        ? `Invoquer tout · ${snapshot.affordableSummons} fois`
        : `Invoquer · ${snapshot.summonCost} ressources`;
    summonPreview.textContent = allMaxed
      ? "Tous les bonus ont été débloqués."
      : snapshot.affordableSummons > 0
        ? `Coût total : ${snapshot.affordableSummonCost} ressources.`
        : `Prochaine invocation : ${snapshot.summonCost} ressources.`;
  };

  const unsubscribe = progression.subscribe(render);
  const summon = (): void => {
    const result = progression.summonAll();

    switch (result.kind) {
      case "success":
        summonResult.textContent = `${result.summons.length} invocation${
          result.summons.length === 1 ? "" : "s"
        } : ${result.summons
          .map(({ companion, level }) => `${companion.name} niv. ${level}`)
          .join(" · ")}.`;
        break;
      case "insufficient-resources":
        summonResult.textContent = `Il faut ${progression.getSummonCost()} ressources pour invoquer.`;
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
