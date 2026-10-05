import Phaser from "phaser";
import { createGameConfig } from "./game/config";
import { GameProgression } from "./game/progression";
import { bindProgressionUi } from "./ui/ProgressionUi";
import "./style.css";

const progression = new GameProgression();
new Phaser.Game(createGameConfig(progression));
bindProgressionUi(progression);
