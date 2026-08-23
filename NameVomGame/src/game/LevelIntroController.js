import { AudioId } from '../core/constants/AudioId.js';
import levelIntroOverlay from './ui/LevelIntroOverlay.html?raw';
import './ui/LevelIntroOverlay.css';

const IntroState = Object.freeze({
    WAITING: 'waiting',
    SHOWING_CONTROLS: 'showingControls',
    FADING_IN: 'fadingIn',
    HOLDING: 'holding',
    FADING_OUT: 'fadingOut',
    COMPLETE: 'complete'
});

const FADE_IN_DURATION = 1.25;
const HOLD_DURATION = 1.5;
const FADE_OUT_DURATION = 1;

export class LevelIntroController
{
    constructor(levelTitle, audioManager, showControls = false)
    {
        this.audioManager = audioManager;
        this.showControls = showControls;
        this.state = IntroState.WAITING;
        this.stateTime = 0;
        this.scribblePlaybackId = null;

        this.overlay = document.createElement('div');
        this.overlay.innerHTML = levelIntroOverlay;
        document.body.append(this.overlay);

        this.intro = this.overlay.querySelector('[data-level-intro]');
        this.title = this.overlay.querySelector('[data-level-intro-title]');
        this.controls = this.overlay.querySelector('[data-level-controls]');
        this.continueButton = this.overlay.querySelector('[data-level-controls-continue]');
        this.title.textContent = levelTitle;

        this.onContinue = () => this.#startTitleIntro();
        this.continueButton.addEventListener('click', this.onContinue);
    }


    start()
    {
        if (this.state !== IntroState.WAITING) return;

        if (this.showControls)
        {
            this.state = IntroState.SHOWING_CONTROLS;
            this.controls.hidden = false;
            this.continueButton.focus();
            return;
        }

        this.#startTitleIntro();
    }


    #startTitleIntro()
    {
        if (this.state !== IntroState.WAITING && this.state !== IntroState.SHOWING_CONTROLS) return;

        this.controls.hidden = true;
        this.state = IntroState.FADING_IN;
        this.stateTime = 0;
        this.intro.hidden = false;
        this.scribblePlaybackId = this.audioManager.playSfx(AudioId.LEVEL_TITLE_SCRIBBLE);
    }


    update(deltaTime)
    {
        if (
            this.state === IntroState.WAITING ||
            this.state === IntroState.SHOWING_CONTROLS ||
            this.state === IntroState.COMPLETE
        ) return;

        this.stateTime += deltaTime;

        if (this.state === IntroState.FADING_IN)
        {
            this.title.style.opacity = Math.min(this.stateTime / FADE_IN_DURATION, 1);

            if (this.stateTime >= FADE_IN_DURATION)
            {
                this.#stopScribble();
                this.state = IntroState.HOLDING;
                this.stateTime = 0;
            }
            return;
        }

        if (this.state === IntroState.HOLDING)
        {
            if (this.stateTime >= HOLD_DURATION)
            {
                this.state = IntroState.FADING_OUT;
                this.stateTime = 0;
            }
            return;
        }

        this.title.style.opacity = Math.max(1 - this.stateTime / FADE_OUT_DURATION, 0);
        if (this.stateTime >= FADE_OUT_DURATION)
        {
            this.state = IntroState.COMPLETE;
            this.intro.hidden = true;
        }
    }


    dispose()
    {
        this.#stopScribble();
        this.continueButton?.removeEventListener('click', this.onContinue);
        this.overlay?.remove();
        this.overlay = null;
    }


    get isComplete()
    {
        return this.state === IntroState.COMPLETE;
    }


    #stopScribble()
    {
        if (this.scribblePlaybackId === null) return;

        this.audioManager.stopSfx(AudioId.LEVEL_TITLE_SCRIBBLE, this.scribblePlaybackId);
        this.scribblePlaybackId = null;
    }
}
