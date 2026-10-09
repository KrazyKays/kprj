import Phaser from "phaser";
import { createGameConfig } from "./game/config";
import { GameProgression } from "./game/progression";
import { TutorialGuide } from "./game/tutorial";
import { bindActionsUi } from "./ui/ActionsUi";
import { bindProgressionUi } from "./ui/ProgressionUi";
import { bindTutorialUi } from "./ui/TutorialUi";
import "./style.css";

const progression = new GameProgression();
const tutorial = new TutorialGuide();
new Phaser.Game(createGameConfig(progression, tutorial));
bindProgressionUi(progression, tutorial);
bindActionsUi(progression);
bindTutorialUi(tutorial);
