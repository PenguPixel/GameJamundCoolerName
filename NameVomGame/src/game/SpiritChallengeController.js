import { AudioId } from '../core/constants/AudioId.js';
import spiritTimerOverlay from './ui/SpiritTimerOverlay.html?raw';
import './ui/SpiritTimerOverlay.css';

const TIMER_DURATION = 33;

export class SpiritChallengeController
{
    constructor(characterController, audioManager, sceneManager, platforms, nextSceneId)
    {
        this.characterController = characterController;
        this.audioManager = audioManager;
        this.sceneManager = sceneManager;
        this.startPlatform = platforms.find(platform => platform.platformType === 'start');
        this.endPlatform = platforms.find(platform => platform.platformType === 'end');
        this.checkpointPlatforms = platforms.filter(platform =>
            platform.platformType === 'start' || platform.platformType === 'save'
        );
        this.respawnPlatform = this.startPlatform;
        this.nextSceneId = nextSceneId;
        this.remainingTime = TIMER_DURATION;
        this.isArmed = false;
        this.isRunning = false;
        this.isComplete = false;
        this.timerPlaybackId = null;

        this.#createOverlay();
        this.#resetSpirit(false);
    }


    update(deltaTime)
    {
        const spirit = this.characterController.spiritCharacter;
        const checkpoint = this.checkpointPlatforms.find(platform => platform.containsCharacter(spirit));
        const isOnEndPlatform = this.endPlatform?.containsCharacter(spirit) ?? false;

        if (isOnEndPlatform && this.#bothCharactersReachedEnd())
        {
            this.#completeLevel();
            return true;
        }

        if (checkpoint || isOnEndPlatform)
        {
            if (checkpoint) this.respawnPlatform = checkpoint;
            this.#resetTimer();
            this.isArmed = true;
            return false;
        }

        if (this.isArmed && !this.isRunning)
        {
            this.#startTimer();
        }

        if (!this.isRunning) return false;

        this.remainingTime = Math.max(0, this.remainingTime - deltaTime);
        this.#updateOverlay();

        if (this.remainingTime === 0)
        {
            this.characterController.takeDamage(1);
            this.#resetSpirit();
        }

        return false;
    }


    dispose()
    {
        this.#stopTimerSound();
        if (!this.isComplete) this.characterController.setChallengeAudioActive(false);
        this.overlay?.remove();
        this.overlay = null;
    }


    pauseAudio()
    {
        if (this.timerPlaybackId === null) return;
        this.audioManager.pauseSfx(AudioId.SPIRIT_TIMER, this.timerPlaybackId);
    }


    resumeAudio()
    {
        if (this.timerPlaybackId === null) return;
        this.audioManager.resumeSfx(AudioId.SPIRIT_TIMER, this.timerPlaybackId);
    }


    #createOverlay()
    {
        this.overlay = document.createElement('div');
        this.overlay.innerHTML = spiritTimerOverlay;
        document.body.append(this.overlay);

        this.timer = this.overlay.querySelector('[data-spirit-timer]');
        this.timerFill = this.overlay.querySelector('[data-spirit-timer-fill]');
        this.#updateOverlay();
    }


    #startTimer()
    {
        this.isRunning = true;
        this.timer.hidden = false;
        this.characterController.setChallengeAudioActive(true);
        this.timerPlaybackId = this.audioManager.playSfx(AudioId.SPIRIT_TIMER);
    }


    #resetSpirit(restoreAudio = true)
    {
        this.#resetTimer(restoreAudio);
        this.characterController.resetSpirit(this.respawnPlatform.getSpawnPosition());
        this.isArmed = false;
    }


    #resetTimer(restoreAudio = true)
    {
        const wasRunning = this.isRunning;

        this.#stopTimerSound();
        if (restoreAudio && wasRunning) this.characterController.setChallengeAudioActive(false);

        this.remainingTime = TIMER_DURATION;
        this.isRunning = false;
        if (this.timer) this.timer.hidden = true;
        this.#updateOverlay();
    }


    #bothCharactersReachedEnd()
    {
        return this.endPlatform?.containsCharacter(this.characterController.bodyCharacter) &&
            this.endPlatform.containsCharacter(this.characterController.spiritCharacter);
    }


    #completeLevel()
    {
        this.isComplete = true;
        this.isRunning = false;
        this.#stopTimerSound();
        this.audioManager.playSfx(AudioId.LEVEL_SUCCESS);
        this.timer.hidden = true;
        this.sceneManager.changeScene(this.nextSceneId);
    }


    #stopTimerSound()
    {
        if (this.timerPlaybackId === null) return;

        this.audioManager.stopSfx(AudioId.SPIRIT_TIMER, this.timerPlaybackId);
        this.timerPlaybackId = null;
    }


    #updateOverlay()
    {
        const progress = this.remainingTime / TIMER_DURATION;
        this.timerFill.style.transform = `scaleX(${progress})`;
    }
}
