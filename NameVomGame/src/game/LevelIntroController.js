import { AudioId } from '../core/constants/AudioId.js';
import levelIntroOverlay from './ui/LevelIntroOverlay.html?raw';
import './ui/LevelIntroOverlay.css';

const IntroState = Object.freeze({
    WAITING: 'waiting',
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
    constructor(levelTitle, audioManager)
    {
        this.audioManager = audioManager;
        this.state = IntroState.WAITING;
        this.stateTime = 0;
        this.scribblePlaybackId = null;

        this.overlay = document.createElement('div');
        this.overlay.innerHTML = levelIntroOverlay;
        document.body.append(this.overlay);

        this.intro = this.overlay.querySelector('[data-level-intro]');
        this.title = this.overlay.querySelector('[data-level-intro-title]');
        this.title.textContent = levelTitle;
    }


    start()
    {
        if (this.state !== IntroState.WAITING) return;

        this.state = IntroState.FADING_IN;
        this.stateTime = 0;
        this.intro.hidden = false;
        this.scribblePlaybackId = this.audioManager.playSfx(AudioId.LEVEL_TITLE_SCRIBBLE);
    }


    update(deltaTime)
    {
        if (this.state === IntroState.WAITING || this.state === IntroState.COMPLETE) return;

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
