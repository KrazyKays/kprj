import Phaser from "phaser";
import { RESOURCE_COUNT_CHANGED } from "../game/events";

export function bindResourceCounter(game: Phaser.Game): () => void {
  const counter = document.getElementById("resource-count");
  if (!counter) {
    throw new Error("L’élément du compteur de ressources est introuvable.");
  }

  counter.textContent = "0";
  const updateCount = (count: number): void => {
    counter.textContent = String(count);
  };

  game.events.on(RESOURCE_COUNT_CHANGED, updateCount);
  return () => game.events.off(RESOURCE_COUNT_CHANGED, updateCount);
}
