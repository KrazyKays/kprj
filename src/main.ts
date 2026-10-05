import Phaser from "phaser";
import { createGameConfig } from "./game/config";
import { bindResourceCounter } from "./ui/ResourceCounter";
import "./style.css";

const game = new Phaser.Game(createGameConfig());
bindResourceCounter(game);
