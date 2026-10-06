export interface Point {
  x: number;
  y: number;
}

export function getNearestResources<T extends Point>(
  origin: Point,
  resources: readonly T[],
  limit: number,
): T[] {
  return [...resources]
    .sort((left, right) => {
      const leftX = left.x - origin.x;
      const leftY = left.y - origin.y;
      const rightX = right.x - origin.x;
      const rightY = right.y - origin.y;
      const leftDistanceSquared = leftX * leftX + leftY * leftY;
      const rightDistanceSquared = rightX * rightX + rightY * rightY;
      return leftDistanceSquared - rightDistanceSquared;
    })
    .slice(0, limit);
}

export function isResourceTouchingCollectionZone(
  player: Point,
  resource: Point,
  collectionZoneRadius: number,
  resourceRadius: number,
): boolean {
  return (
    Math.hypot(resource.x - player.x, resource.y - player.y) <=
    collectionZoneRadius + resourceRadius
  );
}
