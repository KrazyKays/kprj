export interface Point {
  x: number;
  y: number;
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
