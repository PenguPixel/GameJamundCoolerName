export class Time
{
    //############################################
    //                CONSTRUCTOR
    //############################################

    /**
     * creates frame timing state and fixed-step configuration.
     */
    constructor()
    {
        this.deltaTime = 0;
        this.fixedDeltaTime = 1 / 60;
        this.maxDeltaTime = 0.1;
        this.elapsedTime = 0; 
        this.previousTime = performance.now();
        this.accumulator = 0;
    }



    //############################################
    //               PUBLIC METHODS
    //############################################

    /**
     * measures the current frame duration and advances all time counters.
     * @returns {void}
     */
    update()
    {
        const currentTime = performance.now();
        const rawDeltaTime = (currentTime - this.previousTime) / 1000;

        this.deltaTime = Math.min(rawDeltaTime, this.maxDeltaTime);

        this.elapsedTime += this.deltaTime;
        this.accumulator += this.deltaTime;

        this.previousTime = currentTime;
    }


}
