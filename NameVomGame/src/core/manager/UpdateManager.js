export class UpdateManager
{
    //############################################
    //                CONSTRUCTOR
    //############################################

    /**
     * creates one collection for every supported update phase.
     */
    constructor()
    {
        this.preUpdateables = new Set();
        this.fixedUpdateables = new Set();
        this.updateables = new Set();
        this.lateUpdateables = new Set();
    }



    //############################################
    //               PUBLIC METHODS
    //############################################

    /**
     * registers an object in every update phase it implements.
     * @param {object} object - object containing one or more supported update methods.
     * @returns {void}
     */
    add(object)
    {
        if (typeof object.preUpdate === 'function') this.preUpdateables.add(object);
        if (typeof object.fixedUpdate === 'function') this.fixedUpdateables.add(object);
        if (typeof object.update === 'function') this.updateables.add(object);
        if (typeof object.lateUpdate === 'function') this.lateUpdateables.add(object);
    }


    /**
     * removes an object from every update phase.
     * @param {object} object - previously registered updateable object.
     * @returns {void}
     */
    remove(object)
    {
        this.preUpdateables.delete(object);
        this.fixedUpdateables.delete(object);
        this.updateables.delete(object);
        this.lateUpdateables.delete(object);
    }


    /**
     * runs preparation logic before fixed and frame-based updates.
     * @param {number} deltaTime - elapsed frame time in seconds.
     * @returns {void}
     */
    preUpdate(deltaTime)
    {
        for (const object of this.preUpdateables)
        {
            object.preUpdate(deltaTime);
        }
    }


    /**
     * runs deterministic simulation logic using a fixed time step.
     * @param {number} fixedDeltaTime - fixed simulation step in seconds.
     * @returns {void}
     */
    fixedUpdate(fixedDeltaTime)
    {
        for (const object of this.fixedUpdateables)
        {
            object.fixedUpdate(fixedDeltaTime);
        }
    }


    /**
     * runs frame-based game logic once per rendered frame.
     * @param {number} deltaTime - elapsed frame time in seconds.
     * @returns {void}
     */
    update(deltaTime)
    {
        for (const object of this.updateables)
        {
            object.update(deltaTime);
        }
    }


    /**
     * runs follow-up logic after all regular updates have completed.
     * @param {number} deltaTime - elapsed frame time in seconds.
     * @param {number} interpolationAlpha - remaining fraction between fixed simulation steps.
     * @returns {void}
     */
    lateUpdate(deltaTime, interpolationAlpha)
    {
        for (const object of this.lateUpdateables)
        {
            object.lateUpdate(deltaTime, interpolationAlpha);
        }
    }


}
