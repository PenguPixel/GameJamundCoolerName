import { InputAction } from "../core/constants/InputAction.js";
import { SceneId } from "../core/constants/SceneId.js";
import { EndScene } from "./scenes/EndScene.js";
import { Level_01 } from "./scenes/Level_01.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { Level_00 } from "./scenes/Level_00.js";
import { Level_05 } from "./scenes/Level_05.js";

export class Game
{
    /**
     * Constructor
     */

    constructor(inputManager, updateManager, assetManager, sceneManager, audioManager)
    {
        this.inputManager = inputManager;
        this.updateManager = updateManager;
        this.assetManager = assetManager;
        this.sceneManager = sceneManager;
        this.audioManager = audioManager;

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
        this.inputManager.addAction(InputAction.SWAP_CHARACTER, ['KeyR']);
        this.inputManager.addAction(InputAction.ACTION, ['Space']);
    }

    #setupScenes()
    {
        this.updateManager.add(this.sceneManager);

        this.sceneManager.registerScene(SceneId.TITLE, () =>
            new TitleScene(
                this.updateManager,
                this.sceneManager,
                this.audioManager,
                this.assetManager
            ));

        this.sceneManager.registerScene(SceneId.LEVEL_00, () =>
            new Level_00(
                this.inputManager,
                this.updateManager,
                this.sceneManager,
                this.assetManager,
                this.audioManager
            ));

        this.sceneManager.registerScene(SceneId.LEVEL_01, () =>
            new Level_01(
                this.inputManager,
                this.updateManager,
                this.sceneManager,
                this.assetManager,
                this.audioManager
            ));

        this.sceneManager.registerScene(SceneId.LEVEL_05, () =>
            new Level_05(
                this.inputManager,
                this.updateManager,
                this.sceneManager,
                this.assetManager,
                this.audioManager
            ));

        //copy this block, uncomment it, and replace the scene id and level scene class
        /*
        this.sceneManager.registerScene(SceneId.LEVEL_TEMPLATE, () =>
            new LevelSceneTemplate(
                this.inputManager,
                this.updateManager,
                this.sceneManager,
                this.assetManager,
                this.audioManager
            ));
        */

        this.sceneManager.registerScene(SceneId.END, () =>
            new EndScene(
                this.updateManager,
                this.sceneManager,
                this.audioManager
            ));

        this.sceneManager.changeScene(SceneId.TITLE);
    }

}
