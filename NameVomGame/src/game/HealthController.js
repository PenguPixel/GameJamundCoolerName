import healthOverlay from './ui/HealthOverlay.html?raw';
import './ui/HealthOverlay.css';
import { GameState } from './GameState.js';

const DAMAGE_INVULNERABILITY_DURATION = 0.4;

export class HealthController
{
    constructor(gameState = new GameState())
    {
        this.gameState = gameState;
        this.invulnerabilityRemaining = 0;

        this.overlay = document.createElement('div');
        this.overlay.innerHTML = healthOverlay;
        document.body.append(this.overlay);

        const healthElement = this.overlay.querySelector('[data-health]');
        this.hitFeedback = this.overlay.querySelector('[data-hit-feedback]');
        for (let index = 0; index < this.gameState.maxHealth; index++)
        {
            const heart = document.createElement('span');
            heart.className = 'health-overlay__heart';
            heart.textContent = '\u2665';
            healthElement.append(heart);
        }

        this.hearts = [...healthElement.children];
        this.#updateOverlay();
    }


    update(deltaTime)
    {
        this.invulnerabilityRemaining = Math.max(0, this.invulnerabilityRemaining - deltaTime);
    }


    takeDamage(amount = 1)
    {
        if (this.gameState.isDead || amount <= 0 || this.invulnerabilityRemaining > 0) return false;

        const previousHealth = this.gameState.health;
        this.gameState.takeDamage(amount);
        if (this.gameState.health >= previousHealth) return false;

        this.invulnerabilityRemaining = DAMAGE_INVULNERABILITY_DURATION;
        this.#playHitFeedback();
        this.#updateOverlay();
        return true;
    }


    kill()
    {
        const wasAlive = !this.gameState.isDead;
        this.gameState.kill();
        if (wasAlive) this.#playHitFeedback();
        this.#updateOverlay();
    }


    dispose()
    {
        this.overlay?.remove();
        this.overlay = null;
    }


    get isDead()
    {
        return this.gameState.isDead;
    }


    #updateOverlay()
    {
        for (let index = 0; index < this.hearts.length; index++)
        {
            this.hearts[index].classList.toggle(
                'health-overlay__heart--lost',
                index >= this.gameState.health
            );
        }

        this.overlay.querySelector('[data-health]').ariaLabel =
            `${this.gameState.health} of ${this.gameState.maxHealth} health remaining`;
    }


    #playHitFeedback()
    {
        this.hitFeedback.classList.remove('health-overlay__hit-flash--active');
        void this.hitFeedback.offsetWidth;
        this.hitFeedback.classList.add('health-overlay__hit-flash--active');
    }
}
