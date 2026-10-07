export interface ObstacleRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArenaBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Default configuration of 4 scattered walls in the arena.
 * Specified in unscaled arena coordinates.
 */
export const DEFAULT_WALLS: readonly ObstacleRect[] = [
  { x: 184, y: 180, width: 88, height: 24 }, // Top-left horizontal wall
  { x: 416, y: 176, width: 24, height: 88 }, // Top-right vertical wall
  { x: 200, y: 376, width: 24, height: 88 }, // Bottom-left vertical wall
  { x: 368, y: 436, width: 88, height: 24 }, // Bottom-right horizontal wall
];

export function scaleObstacle(
  obstacle: ObstacleRect,
  scale: number,
): ObstacleRect {
  return {
    x: obstacle.x * scale,
    y: obstacle.y * scale,
    width: obstacle.width * scale,
    height: obstacle.height * scale,
  };
}

export function scaleObstacles(
  obstacles: readonly ObstacleRect[],
  scale: number,
): ObstacleRect[] {
  return obstacles.map((obstacle) => scaleObstacle(obstacle, scale));
}

export function isCircleCollidingWithRect(
  circleX: number,
  circleY: number,
  radius: number,
  rect: ObstacleRect,
): boolean {
  const closestX = Math.max(rect.x, Math.min(rect.x + rect.width, circleX));
  const closestY = Math.max(rect.y, Math.min(rect.y + rect.height, circleY));
  const dx = circleX - closestX;
  const dy = circleY - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function isCircleCollidingWithAnyObstacle(
  circleX: number,
  circleY: number,
  radius: number,
  obstacles: readonly ObstacleRect[],
): boolean {
  return obstacles.some((obstacle) =>
    isCircleCollidingWithRect(circleX, circleY, radius, obstacle),
  );
}

export function resolveCircleRectCollision(
  circleX: number,
  circleY: number,
  radius: number,
  rect: ObstacleRect,
): { x: number; y: number; collided: boolean } {
  const closestX = Math.max(rect.x, Math.min(rect.x + rect.width, circleX));
  const closestY = Math.max(rect.y, Math.min(rect.y + rect.height, circleY));
  const dx = circleX - closestX;
  const dy = circleY - closestY;
  const distanceSquared = dx * dx + dy * dy;

  if (distanceSquared > 1e-9) {
    if (distanceSquared >= radius * radius) {
      return { x: circleX, y: circleY, collided: false };
    }
    const dist = Math.sqrt(distanceSquared);
    const penetration = radius - dist;
    return {
      x: circleX + (dx / dist) * penetration,
      y: circleY + (dy / dist) * penetration,
      collided: true,
    };
  }

  // Circle center is inside or on the edge of the rectangle
  const distLeft = circleX - rect.x;
  const distRight = rect.x + rect.width - circleX;
  const distTop = circleY - rect.y;
  const distBottom = rect.y + rect.height - circleY;
  const minDist = Math.min(distLeft, distRight, distTop, distBottom);

  if (minDist === distLeft) {
    return { x: rect.x - radius, y: circleY, collided: true };
  }
  if (minDist === distRight) {
    return { x: rect.x + rect.width + radius, y: circleY, collided: true };
  }
  if (minDist === distTop) {
    return { x: circleX, y: rect.y - radius, collided: true };
  }
  return { x: circleX, y: rect.y + rect.height + radius, collided: true };
}

export function clampCircleToBounds(
  circleX: number,
  circleY: number,
  radius: number,
  bounds: ArenaBounds,
): { x: number; y: number } {
  return {
    x: Math.max(bounds.left + radius, Math.min(bounds.right - radius, circleX)),
    y: Math.max(bounds.top + radius, Math.min(bounds.bottom - radius, circleY)),
  };
}

export function resolveCirclePosition(
  circleX: number,
  circleY: number,
  radius: number,
  obstacles: readonly ObstacleRect[],
  bounds: ArenaBounds,
  iterations = 3,
): { x: number; y: number } {
  let currentX = circleX;
  let currentY = circleY;

  for (let i = 0; i < iterations; i += 1) {
    const bounded = clampCircleToBounds(currentX, currentY, radius, bounds);
    currentX = bounded.x;
    currentY = bounded.y;

    let anyCollided = false;
    for (const obstacle of obstacles) {
      const resolved = resolveCircleRectCollision(
        currentX,
        currentY,
        radius,
        obstacle,
      );
      if (resolved.collided) {
        currentX = resolved.x;
        currentY = resolved.y;
        anyCollided = true;
      }
    }

    if (!anyCollided) {
      break;
    }
  }

  const finalBounded = clampCircleToBounds(currentX, currentY, radius, bounds);
  return { x: finalBounded.x, y: finalBounded.y };
}

export function moveCircleWithObstacles(
  current: { x: number; y: number },
  destination: { x: number; y: number },
  step: number,
  radius: number,
  obstacles: readonly ObstacleRect[],
  bounds: ArenaBounds,
): { position: { x: number; y: number }; reached: boolean } {
  const deltaX = destination.x - current.x;
  const deltaY = destination.y - current.y;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance <= 0.5) {
    const resolvedDest = resolveCirclePosition(
      destination.x,
      destination.y,
      radius,
      obstacles,
      bounds,
    );
    return {
      position: resolvedDest,
      reached: true,
    };
  }

  const effectiveStep = Math.min(step, distance);
  const moveX = (deltaX / distance) * effectiveStep;
  const moveY = (deltaY / distance) * effectiveStep;

  // 1. Move along X
  let candX = current.x + moveX;
  candX = Math.max(bounds.left + radius, Math.min(bounds.right - radius, candX));
  for (const obstacle of obstacles) {
    if (isCircleCollidingWithRect(candX, current.y, radius, obstacle)) {
      if (moveX > 0 && current.x <= obstacle.x) {
        candX = obstacle.x - radius;
      } else if (
        moveX < 0 &&
        current.x >= obstacle.x + obstacle.width
      ) {
        candX = obstacle.x + obstacle.width + radius;
      } else {
        candX = current.x;
      }
    }
  }

  // 2. Move along Y from candX
  let candY = current.y + moveY;
  candY = Math.max(bounds.top + radius, Math.min(bounds.bottom - radius, candY));
  for (const obstacle of obstacles) {
    if (isCircleCollidingWithRect(candX, candY, radius, obstacle)) {
      if (moveY > 0 && current.y <= obstacle.y) {
        candY = obstacle.y - radius;
      } else if (
        moveY < 0 &&
        current.y >= obstacle.y + obstacle.height
      ) {
        candY = obstacle.y + obstacle.height + radius;
      } else {
        candY = current.y;
      }
    }
  }

  // 3. Final safety resolution
  const finalPos = resolveCirclePosition(
    candX,
    candY,
    radius,
    obstacles,
    bounds,
  );

  const remainingDist = Math.hypot(
    destination.x - finalPos.x,
    destination.y - finalPos.y,
  );
  const reached = remainingDist <= 1;

  return {
    position: finalPos,
    reached,
  };
}
