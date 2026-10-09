import { DEFAULT_WALLS } from "./obstacles";

export const SUMMON_COST = 5;
export const SUMMON_COST_INCREMENT = 1;
export const MAX_COMPANION_LEVEL = 3;
export const MAX_RECENT_ACTIONS = 5;
export const WALL_REMOVAL_COST = 1;

export const COMPANION_RARITIES = [
  { id: "common", name: "Commun", weight: 70 },
  { id: "uncommon", name: "Peu commun", weight: 20 },
  { id: "rare", name: "Rare", weight: 8 },
] as const;

export type CompanionRarity = (typeof COMPANION_RARITIES)[number]["id"];

export const COMPANIONS = [
  {
    id: "mosquito",
    name: "Moustique magnétique",
    rarity: "common",
    passive: "+25 % au rayon de collecte par niveau.",
    bonusByLevel: [
      "+25 % au rayon de collecte",
      "+50 % au rayon de collecte",
      "+75 % au rayon de collecte",
    ],
  },
  {
    id: "rabbit",
    name: "Lapin rapide",
    rarity: "common",
    passive: "+15 % à la vitesse de déplacement par niveau.",
    bonusByLevel: [
      "+15 % à la vitesse de déplacement",
      "+30 % à la vitesse de déplacement",
      "+45 % à la vitesse de déplacement",
    ],
  },
  {
    id: "squirrel",
    name: "Écureuil prévoyant",
    rarity: "uncommon",
    passive: "Augmente le nombre maximal de pépites de base dans l’arène.",
    bonusByLevel: [
      "+2 pépites de base au maximum à l’écran",
      "+4 pépites de base au maximum à l’écran",
      "+6 pépites de base au maximum à l’écran",
    ],
  },
  {
    id: "snail",
    name: "Singe productif",
    rarity: "rare",
    passive: "Réduit de 15 % le délai de réapparition par niveau.",
    bonusByLevel: [
      "−15 % au délai de réapparition",
      "−30 % au délai de réapparition",
      "−45 % au délai de réapparition",
    ],
  },
  {
    id: "crab",
    name: "Crabe trou noir",
    rarity: "rare",
    passive:
      "Fait apparaître un jeton aspirant par niveau ; chaque jeton absorbe les trois pépites les plus proches.",
    bonusByLevel: [
      "1 jeton aspirant actif",
      "2 jetons aspirants actifs",
      "3 jetons aspirants actifs",
    ],
  },
  {
    id: "magpie",
    name: "Pie glaneuse",
    rarity: "rare",
    passive:
      "Fait apparaître 2 fragments par niveau dans l’arène ; chaque fragment ramassé rejoint votre réserve.",
    bonusByLevel: [
      "2 fragments à l’écran",
      "4 fragments à l’écran",
      "6 fragments à l’écran",
    ],
  },
] as const;

export type CompanionId = (typeof COMPANIONS)[number]["id"];

export interface ProgressionSnapshot {
  resources: number;
  fragments: number;
  wallRemovalCost: number;
  wallsRemaining: number;
  wallRemovalActive: boolean;
  autoSummonEnabled: boolean;
  summonCost: number;
  affordableSummons: number;
  affordableSummonCost: number;
  companions: Readonly<Record<CompanionId, number>>;
  companionChances: Readonly<Record<CompanionId, number>>;
  recentActions: readonly string[];
}

export type SummonResult =
  | { kind: "success"; companion: (typeof COMPANIONS)[number]; level: number }
  | { kind: "insufficient-resources" }
  | { kind: "all-maxed" };

export type SummonAllResult =
  | {
      kind: "success";
      summons: readonly {
        companion: (typeof COMPANIONS)[number];
        level: number;
      }[];
    }
  | { kind: "insufficient-resources" }
  | { kind: "all-maxed" };

type ProgressionListener = (snapshot: ProgressionSnapshot) => void;

export type WallRemovalStartResult =
  | "ready"
  | "insufficient-fragments"
  | "no-walls";

export class GameProgression {
  private resources = 0;
  private fragments = 0;
  private wallsRemaining = DEFAULT_WALLS.length;
  private wallRemovalActive = false;
  private autoSummonEnabled = false;
  private successfulSummons = 0;
  private readonly companionLevels: Record<CompanionId, number> = {
    mosquito: 0,
    rabbit: 0,
    snail: 0,
    crab: 0,
    squirrel: 0,
    magpie: 0,
  };
  private readonly recentActions: string[] = [];
  private readonly listeners = new Set<ProgressionListener>();

  constructor(private readonly random: () => number = Math.random) {}

  getSnapshot(): ProgressionSnapshot {
    const affordableSummons = this.getAffordableSummons();
    return {
      resources: this.resources,
      fragments: this.fragments,
      wallRemovalCost: WALL_REMOVAL_COST,
      wallsRemaining: this.wallsRemaining,
      wallRemovalActive: this.wallRemovalActive,
      autoSummonEnabled: this.autoSummonEnabled,
      summonCost: this.getSummonCost(),
      affordableSummons: affordableSummons.count,
      affordableSummonCost: affordableSummons.cost,
      companions: { ...this.companionLevels },
      companionChances: this.getCompanionChances(),
      recentActions: [...this.recentActions],
    };
  }

  getSummonCost(): number {
    return SUMMON_COST + this.successfulSummons * SUMMON_COST_INCREMENT;
  }

  getAffordableSummonCount(): number {
    return this.getAffordableSummons().count;
  }

  private getAffordableSummons(): { count: number; cost: number } {
    let resources = this.resources;
    let summonCost = this.getSummonCost();
    let remainingSummons = COMPANIONS.reduce(
      (total, { id }) => total + MAX_COMPANION_LEVEL - this.companionLevels[id],
      0,
    );
    let count = 0;
    let cost = 0;

    while (remainingSummons > 0 && resources >= summonCost) {
      resources -= summonCost;
      cost += summonCost;
      summonCost += SUMMON_COST_INCREMENT;
      remainingSummons -= 1;
      count += 1;
    }

    return { count, cost };
  }

  subscribe(listener: ProgressionListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  collectResource(): void {
    this.resources += 1;
    if (this.autoSummonEnabled) {
      this.autoSummon();
    }
    this.notify();
  }

  collectFragment(amount = 1): void {
    this.fragments += amount;
    this.notify();
  }

  setAutoSummon(enabled: boolean): void {
    if (this.autoSummonEnabled === enabled) {
      return;
    }

    this.autoSummonEnabled = enabled;
    if (enabled) {
      this.autoSummon();
    }
    this.notify();
  }

  getFragmentCapacity(): number {
    return this.companionLevels.magpie * 2;
  }

  startWallRemoval(): WallRemovalStartResult {
    if (this.wallsRemaining === 0) {
      return "no-walls";
    }
    if (this.fragments < WALL_REMOVAL_COST) {
      return "insufficient-fragments";
    }

    this.wallRemovalActive = true;
    this.notify();
    return "ready";
  }

  cancelWallRemoval(): void {
    if (!this.wallRemovalActive) {
      return;
    }

    this.wallRemovalActive = false;
    this.notify();
  }

  isWallRemovalActive(): boolean {
    return this.wallRemovalActive;
  }

  confirmWallRemoval(): boolean {
    if (
      !this.wallRemovalActive ||
      this.wallsRemaining === 0 ||
      this.fragments < WALL_REMOVAL_COST
    ) {
      return false;
    }

    this.fragments -= WALL_REMOVAL_COST;
    this.wallsRemaining -= 1;
    this.wallRemovalActive = false;
    this.recordAction(
      `Mur supprimé · ${WALL_REMOVAL_COST} fragment dépensé.`,
    );
    this.notify();
    return true;
  }

  summon(): SummonResult {
    const result = this.summonOne();
    if (result.kind === "success") {
      this.recordSummonAction(result.companion, result.level);
      this.notify();
    }
    return result;
  }

  summonAll(): SummonAllResult {
    if (this.getAffordableSummonCount() === 0) {
      return this.hasAvailableCompanions()
        ? { kind: "insufficient-resources" }
        : { kind: "all-maxed" };
    }

    const summons: { companion: (typeof COMPANIONS)[number]; level: number }[] = [];
    let result = this.summonOne();
    while (result.kind === "success") {
      summons.push({ companion: result.companion, level: result.level });
      this.recordSummonAction(result.companion, result.level);
      if (this.getAffordableSummonCount() === 0) {
        break;
      }
      result = this.summonOne();
    }

    this.notify();
    return { kind: "success", summons };
  }

  getMovementSpeed(baseSpeed: number): number {
    return baseSpeed * (1 + this.companionLevels.rabbit * 0.15);
  }

  getCollectionDistance(baseDistance: number): number {
    return baseDistance * (1 + this.companionLevels.mosquito * 0.25);
  }

  getResourceRespawnDelay(baseDelay: number): number {
    return Math.max(500, baseDelay * (1 - this.companionLevels.snail * 0.15));
  }

  getBaseResourceCapacity(baseCapacity: number): number {
    return baseCapacity + this.companionLevels.squirrel * 2;
  }

  getCompanionLevel(id: CompanionId): number {
    return this.companionLevels[id];
  }

  private hasAvailableCompanions(): boolean {
    return COMPANIONS.some(
      ({ id }) => this.companionLevels[id] < MAX_COMPANION_LEVEL,
    );
  }

  private getCompanionChances(): Record<CompanionId, number> {
    const chances: Record<CompanionId, number> = {
      mosquito: 0,
      rabbit: 0,
      snail: 0,
      crab: 0,
      squirrel: 0,
      magpie: 0,
    };
    const availableByRarity = COMPANION_RARITIES.map((rarity) => ({
      ...rarity,
      companions: COMPANIONS.filter(
        ({ id, rarity: companionRarity }) =>
          companionRarity === rarity.id &&
          this.companionLevels[id] < MAX_COMPANION_LEVEL,
      ),
    })).filter(({ companions }) => companions.length > 0);
    const totalWeight = availableByRarity.reduce(
      (total, rarity) => total + rarity.weight,
      0,
    );

    for (const rarity of availableByRarity) {
      const chancePerCompanion =
        (rarity.weight / totalWeight / rarity.companions.length) * 100;
      for (const companion of rarity.companions) {
        chances[companion.id] = chancePerCompanion;
      }
    }

    return chances;
  }

  private recordSummonAction(
    companion: (typeof COMPANIONS)[number],
    level: number,
    automatic = false,
  ): void {
    this.recordAction(
      `${companion.name} invoqué${automatic ? " automatiquement" : ""} · niveau ${level}.`,
    );
  }

  private autoSummon(): void {
    while (this.getAffordableSummonCount() > 0) {
      const result = this.summonOne();
      if (result.kind !== "success") {
        return;
      }
      this.recordSummonAction(result.companion, result.level, true);
    }
  }

  private recordAction(action: string): void {
    this.recentActions.unshift(action);
    this.recentActions.length = Math.min(
      this.recentActions.length,
      MAX_RECENT_ACTIONS,
    );
  }

  private summonOne(): SummonResult {
    const availableCompanions = COMPANION_RARITIES.flatMap(({ id: rarity }) =>
      COMPANIONS.filter(
        (companion) =>
          companion.rarity === rarity &&
          this.companionLevels[companion.id] < MAX_COMPANION_LEVEL,
      ),
    );
    if (availableCompanions.length === 0) {
      return { kind: "all-maxed" };
    }

    const summonCost = this.getSummonCost();
    if (this.resources < summonCost) {
      return { kind: "insufficient-resources" };
    }

    this.resources -= summonCost;
    this.successfulSummons += 1;
    const chances = this.getCompanionChances();
    let roll = this.random() * 100;
    let companion = availableCompanions[availableCompanions.length - 1];
    for (const candidate of availableCompanions) {
      roll -= chances[candidate.id];
      if (roll < 0) {
        companion = candidate;
        break;
      }
    }
    const level = ++this.companionLevels[companion.id];

    return { kind: "success", companion, level };
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
