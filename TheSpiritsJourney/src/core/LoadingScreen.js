const MINIMUM_DISPLAY_TIME = 600;
const FADE_DURATION = 800;

export class LoadingScreen
{
    constructor()
    {
        this.element = document.querySelector('[data-loading-screen]');
        this.progressElement = this.element.querySelector('[data-loading-progress]');
        this.fillElement = this.element.querySelector('[data-loading-fill]');
        this.startedAt = performance.now();
    }


    setProgress(progress)
    {
        const percentage = Math.round(progress * 100);
        this.fillElement.style.width = `${percentage}%`;
        this.progressElement.setAttribute('aria-valuenow', String(percentage));
    }


    async finish()
    {
        this.setProgress(1);

        const elapsedTime = performance.now() - this.startedAt;
        const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME - elapsedTime);
        if (remainingTime > 0) await this.#wait(remainingTime);

        this.element.classList.add('loading-screen--complete');
        await this.#wait(FADE_DURATION);
        this.element.remove();
    }


    showError()
    {
        this.element.querySelector('.loading-screen__text').textContent =
            'Loading failed. Please reload the page.';
    }


    #wait(duration)
    {
        return new Promise(resolve => window.setTimeout(resolve, duration));
    }
}
