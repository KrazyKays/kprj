export const SUMMON_COST = 5;
export const SUMMON_COST_INCREMENT = 1;
export const MAX_COMPANION_LEVEL = 3;
export const MAX_RECENT_ACTIONS = 5;

export const COMPANIONS = [
  {
    id: "mosquito",
    name: "Moustique doré",
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
    passive: "+15 % à la vitesse de déplacement par niveau.",
    bonusByLevel: [
      "+15 % à la vitesse de déplacement",
      "+30 % à la vitesse de déplacement",
      "+45 % à la vitesse de déplacement",
    ],
  },
  {
    id: "snail",
    name: "Escargot chanceux",
    passive: "Réduit de 15 % le délai de réapparition par niveau.",
    bonusByLevel: [
      "−15 % au délai de réapparition",
      "−30 % au délai de réapparition",
      "−45 % au délai de réapparition",
    ],
  },
] as const;

export type CompanionId = (typeof COMPANIONS)[number]["id"];

export interface ProgressionSnapshot {
  resources: number;
  summonCost: number;
  affordableSummons: number;
  affordableSummonCost: number;
  companions: Readonly<Record<CompanionId, number>>;
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

export class GameProgression {
  private resources = 0;
  private successfulSummons = 0;
  private readonly companionLevels: Record<CompanionId, number> = {
    mosquito: 0,
    rabbit: 0,
    snail: 0,
  };
  private readonly recentActions: string[] = [];
  private readonly listeners = new Set<ProgressionListener>();

  constructor(private readonly random: () => number = Math.random) {}

  getSnapshot(): ProgressionSnapshot {
    const affordableSummons = this.getAffordableSummons();
    return {
      resources: this.resources,
      summonCost: this.getSummonCost(),
      affordableSummons: affordableSummons.count,
      affordableSummonCost: affordableSummons.cost,
      companions: { ...this.companionLevels },
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
    this.recordAction("Ressource ordinaire récupérée (+1).");
    this.notify();
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

  private hasAvailableCompanions(): boolean {
    return COMPANIONS.some(
      ({ id }) => this.companionLevels[id] < MAX_COMPANION_LEVEL,
    );
  }

  private recordSummonAction(
    companion: (typeof COMPANIONS)[number],
    level: number,
  ): void {
    this.recordAction(`${companion.name} invoqué · niveau ${level}.`);
  }

  private recordAction(action: string): void {
    this.recentActions.unshift(action);
    this.recentActions.length = Math.min(
      this.recentActions.length,
      MAX_RECENT_ACTIONS,
    );
  }

  private summonOne(): SummonResult {
    const availableCompanions = COMPANIONS.filter(
      ({ id }) => this.companionLevels[id] < MAX_COMPANION_LEVEL,
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
    const randomIndex = Math.min(
      Math.floor(this.random() * availableCompanions.length),
      availableCompanions.length - 1,
    );
    const companion = availableCompanions[randomIndex];
    const level = ++this.companionLevels[companion.id];

    return { kind: "success", companion, level };
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
