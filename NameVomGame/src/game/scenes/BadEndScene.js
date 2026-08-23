import * as THREE from 'three';
import { AudioId } from '../../core/constants/AudioId.js';
import { SceneId } from '../../core/constants/SceneId.js';
import endSceneOverlay from '../ui/EndSceneOverlay.html?raw';
import { BaseScene } from './BaseScene.js';

export class BadEndScene extends BaseScene
{
    constructor(updateManager, sceneManager, audioManager)
    {
        super(updateManager);

        this.sceneManager = sceneManager;
        this.audioManager = audioManager;
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.scene.background = new THREE.Color(0x000000);
        this.overlay = null;
        this.isReturning = false;
    }


    enter()
    {
        this.#createOverlay();
        this.audioManager.playMusic(AudioId.DEATH_MUSIC);
    }


    exit()
    {
        this.audioManager.stopMusic();
        this.overlay?.remove();
        this.overlay = null;
        this.isReturning = false;
    }


    #createOverlay()
    {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'end-screen end-screen--bad';
        this.overlay.innerHTML = endSceneOverlay;
        document.body.append(this.overlay);

        const titleButton = this.overlay.querySelector('[data-action="title"]');
        titleButton.addEventListener('mouseenter', () => this.audioManager.playSfx(AudioId.MENU_HOVER));
        titleButton.addEventListener('click', () => this.audioManager.playSfx(AudioId.MENU_CLICK));
        titleButton.addEventListener('click', () => this.#returnToTitle());
    }


    #returnToTitle()
    {
        if (this.isReturning) return;
        this.isReturning = true;
        this.sceneManager.changeScene(SceneId.TITLE);
    }
}
