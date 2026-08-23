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
        const titleButton = this.overlay.querySelector('[data-pause-action="title"]');

        resumeButton.addEventListener('click', () =>
        {
            this.audioManager.playSfx(AudioId.MENU_CLICK);
            onResume();
        });
        titleButton.addEventListener('click', () =>
        {
            this.audioManager.playSfx(AudioId.MENU_CLICK);
            onBackToTitle();
        });

        for (const button of [resumeButton, titleButton])
        {
            button.addEventListener('mouseenter', () =>
                this.audioManager.playSfx(AudioId.MENU_HOVER)
            );
        }

        this.#setupVolumeControls();
    }


    show()
    {
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
