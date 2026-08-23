import healthOverlay from './ui/HealthOverlay.html?raw';
import './ui/HealthOverlay.css';
import { GameState } from './GameState.js';

export class HealthController
{
    constructor(gameState = new GameState())
    {
        this.gameState = gameState;

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


    takeDamage(amount = 1)
    {
        const previousHealth = this.gameState.health;
        this.gameState.takeDamage(amount);
        if (this.gameState.health < previousHealth) this.#playHitFeedback();
        this.#updateOverlay();
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
