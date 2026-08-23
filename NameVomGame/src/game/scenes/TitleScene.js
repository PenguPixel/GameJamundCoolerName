import * as THREE from 'three';
import { AudioId } from '../../core/constants/AudioId.js';
import { SceneId } from '../../core/constants/SceneId.js';
import titleSceneOverlay from '../ui/TitleSceneOverlay.html?raw';
import { BaseScene } from './BaseScene.js';
import { isLevelEditorEnabled, openLevelEditor } from 'virtual:level-editor-launcher';

export class TitleScene extends BaseScene
{
    constructor(updateManager, sceneManager, audioManager, assetManager, gameState)
    {
        super(updateManager);

        this.sceneManager = sceneManager;
        this.audioManager = audioManager;
        this.assetManager = assetManager;
        this.gameState = gameState;

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);

        this.scene.background = new THREE.Color(0x000000);
        this.overlay = null;
        this.isStarting = false;
    }

    enter()
    {
        this.#createOverlay();
        this.audioManager.playMusic(AudioId.TITLE_MUSIC);
        this.audioManager.playAmbient(AudioId.TITLE_AMBIENT);
    }

    exit()
    {
        this.audioManager.stopMusic();
        this.audioManager.stopAmbient();
        this.overlay?.remove();
        this.overlay = null;
        this.isStarting = false;
    }

    #createOverlay()
    {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'title-scene';
        this.overlay.innerHTML = titleSceneOverlay;

        let editorButton = null;

        if (isLevelEditorEnabled)
        {
            editorButton = document.createElement('button');
            editorButton.className = 'title-menu__button';
            editorButton.type = 'button';
            editorButton.dataset.action = 'editor';
            editorButton.textContent = 'level editor';
            this.overlay.querySelector('.title-menu__actions').append(editorButton);
        }

        document.body.append(this.overlay);
        this.#setupMenuSounds();

        this.overlay.querySelector('[data-action="start"]')
            .addEventListener('click', () => this.#startGame());

        this.overlay.querySelector('[data-action="options"]')
            .addEventListener('click', () => this.#showPanel('options'));

        this.overlay.querySelector('[data-action="credits"]')
            .addEventListener('click', () => this.#showPanel('credits'));

        if (isLevelEditorEnabled)
        {
            editorButton.addEventListener('click', () => this.#openLevelEditor());
        }

        for (const button of this.overlay.querySelectorAll('[data-action="back"]'))
        {
            button.addEventListener('click', () => this.#showPanel('menu'));
        }

        this.#setupVolumeControls();
    }

    #startGame()
    {
        if (this.isStarting || this.sceneManager.isTransitioning) return;
        this.isStarting = true;
        this.gameState.reset();

        this.sceneManager.changeScene(SceneId.LEVEL_01);
    }


    async #openLevelEditor()
    {
        if (this.isStarting) return;
        this.isStarting = true;

        try
        {
            await openLevelEditor(
                this.updateManager,
                this.sceneManager,
                this.assetManager
            );
        }
        catch (error)
        {
            this.isStarting = false;
            console.error(error);
        }
    }

    #showPanel(panelName)
    {
        for (const panel of this.overlay.querySelectorAll('[data-panel]'))
        {
            panel.hidden = panel.dataset.panel !== panelName;
        }
    }

    #setupMenuSounds()
    {
        for (const button of this.overlay.querySelectorAll('.title-menu__button'))
        {
            button.addEventListener('mouseenter', () =>
                this.audioManager.playSfx(AudioId.MENU_HOVER));

            button.addEventListener('click', () =>
                this.audioManager.playSfx(AudioId.MENU_CLICK));
        }
    }

    #setupVolumeControls()
    {
        const controls = [
            ['master', this.audioManager.masterVolume, value => this.audioManager.setMasterVolume(value)],
            ['music', this.audioManager.musicVolume, value => this.audioManager.setMusicVolume(value)],
            ['ambient', this.audioManager.ambientVolume, value => this.audioManager.setAmbientVolume(value)],
            ['sfx', this.audioManager.sfxVolume, value => this.audioManager.setSfxVolume(value)]
        ];

        for (const [name, initialValue, setVolume] of controls)
        {
            const input = this.overlay.querySelector(`[data-volume="${name}"]`);
            const output = this.overlay.querySelector(`[data-volume-output="${name}"]`);

            const updateVolume = () =>
            {
                const volume = Number(input.value);
                setVolume(volume);
                output.textContent = `${Math.round(volume * 100)}%`;
            };

            input.value = initialValue;
            output.textContent = `${Math.round(initialValue * 100)}%`;
            input.addEventListener('input', updateVolume);
            input.addEventListener('change', () =>
                this.audioManager.playSfx(AudioId.MENU_CLICK));
        }
    }
}
