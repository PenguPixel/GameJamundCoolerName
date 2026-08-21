import * as THREE from 'three';
import { InputAction } from '../../core/constants/InputAction.js';
import { SceneId } from '../../core/constants/SceneId.js';
import { BaseScene } from './BaseScene.js';

export class TitleScene extends BaseScene
{
    constructor(inputManager, updateManager, sceneManager)
    {
        super(updateManager);

        this.inputManager = inputManager;
        this.sceneManager = sceneManager;

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);

        this.scene.background = new THREE.Color(0x000000);
        this.overlay = null;
    }

    enter()
    {
        this.#createOverlay();
    }

    update()
    {
        if (!this.inputManager.justPressed(InputAction.ACTION)) return;
        this.sceneManager.changeScene(SceneId.LEVEL_01);
    }

    exit()
    {
        this.overlay?.remove();
        this.overlay = null;
    }

    #createOverlay()
    {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'title-scene';
        this.overlay.textContent = 'Press Space to Begin';

        document.body.append(this.overlay);
    }
}
