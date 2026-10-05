export const SUMMON_COST = 5;
export const SUMMON_COST_INCREMENT = 1;
export const MAX_COMPANION_LEVEL = 3;

export const COMPANIONS = [
  {
    id: "mosquito",
    name: "Moustique doré",
    passive: "+25 % au rayon de collecte par niveau.",
  },
  {
    id: "rabbit",
    name: "Lapin rapide",
    passive: "+15 % à la vitesse de déplacement par niveau.",
  },
  {
    id: "snail",
    name: "Escargot chanceux",
    passive: "Réduit de 15 % le délai de réapparition par niveau.",
  },
] as const;

export type CompanionId = (typeof COMPANIONS)[number]["id"];

export interface ProgressionSnapshot {
  resources: number;
  summonCost: number;
  companions: Readonly<Record<CompanionId, number>>;
}

export type SummonResult =
  | { kind: "success"; companion: (typeof COMPANIONS)[number]; level: number }
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
  private readonly listeners = new Set<ProgressionListener>();

  constructor(private readonly random: () => number = Math.random) {}

  getSnapshot(): ProgressionSnapshot {
    return {
      resources: this.resources,
      summonCost: this.getSummonCost(),
      companions: { ...this.companionLevels },
    };
  }

  getSummonCost(): number {
    return SUMMON_COST + this.successfulSummons * SUMMON_COST_INCREMENT;
  }

  subscribe(listener: ProgressionListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  collectResource(): void {
    this.resources += 1;
    this.notify();
  }

  summon(): SummonResult {
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
    this.notify();

    return { kind: "success", companion, level };
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

  private notify(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
