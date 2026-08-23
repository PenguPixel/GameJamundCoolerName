import { AudioId } from '../core/constants/AudioId.js';
import pauseOverlay from './ui/PauseOverlay.html?raw';
import './ui/PauseOverlay.css';

export class PauseController
{
    constructor(audioManager, onResume, onBackToTitle)
    {
        this.audioManager = audioManager;
        this.overlay = document.createElement('div');
        this.overlay.innerHTML = pauseOverlay;
        document.body.append(this.overlay);

        this.menu = this.overlay.querySelector('[data-pause-menu]');
        const resumeButton = this.overlay.querySelector('[data-pause-action="resume"]');
        const optionsButton = this.overlay.querySelector('[data-pause-action="options"]');
        const backButton = this.overlay.querySelector('[data-pause-action="back"]');
        const titleButton = this.overlay.querySelector('[data-pause-action="title"]');

        resumeButton.addEventListener('click', onResume);
        optionsButton.addEventListener('click', () => this.#showPanel('options'));
        backButton.addEventListener('click', () => this.#showPanel('menu'));
        titleButton.addEventListener('click', onBackToTitle);

        for (const button of this.overlay.querySelectorAll('.title-menu__button'))
        {
            button.addEventListener('mouseenter', () =>
                this.audioManager.playSfx(AudioId.MENU_HOVER)
            );
            button.addEventListener('click', () =>
                this.audioManager.playSfx(AudioId.MENU_CLICK)
            );
        }

        this.#setupVolumeControls();
    }


    show()
    {
        this.#showPanel('menu');
        this.menu.hidden = false;
    }


    hide()
    {
        this.menu.hidden = true;
    }


    dispose()
    {
        this.overlay?.remove();
        this.overlay = null;
        this.menu = null;
    }


    #showPanel(panelName)
    {
        for (const panel of this.overlay.querySelectorAll('[data-pause-panel]'))
        {
            panel.hidden = panel.dataset.pausePanel !== panelName;
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
            const input = this.overlay.querySelector(`[data-pause-volume="${name}"]`);
            const output = this.overlay.querySelector(`[data-pause-volume-output="${name}"]`);

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
