import * as THREE from "three";
import { Player } from "./Player.js";
import { AssetId } from "../core/constants/AssetId";
import { InputAction } from "../core/constants/InputAction.js";
import { AnimationController } from "../core/animation/AnimationController.js";
import { SceneId } from "../core/constants/SceneId.js";
import { Level_01 } from "./scenes/Level_01.js";
import { TitleScene } from "./scenes/TitleScene.js";

export class Game
{
    /**
     * Constructor
     */

    constructor(inputManager, updateManager, assetManager, sceneManager)
    {
        this.inputManager = inputManager;
        this.updateManager = updateManager;
        this.assetManager = assetManager;
        this.sceneManager = sceneManager;

        this.#init();
    }



    /**
     * Private Setup Methods
     */

    #init()
    {
        this.#setupInput();
        this.#setupScenes();
    }

    #setupInput()
    {
        this.inputManager.addAction(InputAction.MOVE_FORWARD, ['KeyW', 'ArrowUp']);
        this.inputManager.addAction(InputAction.MOVE_BACKWARD, ['KeyS', 'ArrowDown']);
        this.inputManager.addAction(InputAction.MOVE_LEFT, ['KeyA', 'ArrowLeft']);
        this.inputManager.addAction(InputAction.MOVE_RIGHT, ['KeyD', 'ArrowRight']);
        this.inputManager.addAction(InputAction.ACTION, ['Space']);
    }

    #setupScenes()
    {
        this.updateManager.add(this.sceneManager);

        this.sceneManager.registerScene(SceneId.TITLE, () =>
            new TitleScene(this.inputManager, this.updateManager, this.sceneManager));

        this.sceneManager.registerScene(SceneId.LEVEL_01, () =>
            new Level_01(this.inputManager, this.updateManager, this.sceneManager, this.assetManager));
        this.sceneManager.changeScene(SceneId.LEVEL_01);
    }

}
