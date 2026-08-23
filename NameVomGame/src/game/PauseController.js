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
}
