import * as THREE from 'three';

export class AnimationController
{

    //############################################
    //                CONSTRUCTOR
    //############################################

    /**
     * creates one animation mixer and caches an action for every supplied clip.
     * @param {THREE.Object3D} root - object whose properties are animated.
     * @param {THREE.AnimationClip[]} clips - animation clips available to the object.
     */
    constructor(root, clips)
    {
        this.root = root;
        this.clips = clips;
        this.mixer = new THREE.AnimationMixer(this.root);
        this.actions = new Map();
        this.activeAction = null;

        this.mixer.addEventListener('finished', (e) => this.#onFinished(e));

        this.#createActions();
    }



    //############################################
    //               PUBLIC METHODS
    //############################################

    /**
     * advances the animation mixer by one frame.
     * @param {number} deltaTime - elapsed frame time in seconds.
     * @returns {void}
     */
    update(deltaTime)
    {
        this.mixer.update(deltaTime);
    }


    /**
     * starts a named animation once and holds its final pose.
     * @param {string} name - exact name of a cached animation clip.
     * @returns {THREE.AnimationAction} started animation action.
     * @throws {Error} when no action exists for the supplied name.
     */
    playOnce(name)
    {
        const action = this.actions.get(name);

        if (!action) throw new Error("No action with name: " + name);
        if (this.activeAction && this.activeAction !== action) this.activeAction.stop();

        action.reset();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.play();

        this.activeAction = action;

        return action;
    }


    /**
     * starts a named animation in an endless loop.
     * @param {string} name - exact name of a cached animation clip.
     * @returns {THREE.AnimationAction} started animation action.
     * @throws {Error} when no action exists for the supplied name.
     */
    playLoop(name)
    {
        const action = this.actions.get(name);

        if (!action) throw new Error("No action with name: " + name);
        if (this.activeAction && this.activeAction !== action) this.activeAction.stop();

        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        action.play();

        this.activeAction = action;

        return action;
    }


    /**
     * fades from the active animation to a named one-shot animation.
     * @param {string} name - exact name of a cached animation clip.
     * @param {number} [duration=0.2] - fade duration in seconds.
     * @returns {THREE.AnimationAction} target animation action.
     * @throws {Error} when no action exists for the supplied name.
     */
    fadeToOnce(name, duration = 0.2)
    {
        return this.#fadeTo(name, duration, false);
    }


    /**
     * fades from the active animation to a named looping animation.
     * @param {string} name - exact name of a cached animation clip.
     * @param {number} [duration=0.2] - fade duration in seconds.
     * @returns {THREE.AnimationAction} target animation action.
     * @throws {Error} when no action exists for the supplied name.
     */
    fadeToLoop(name, duration = 0.2)
    {
        return this.#fadeTo(name, duration, true);
    }


    /**
     * stops a named animation if it exists.
     * @param {string} name - exact name of a cached animation clip.
     * @returns {void}
     */
    stop(name)
    {
        const action = this.actions.get(name);
        if (!action) return;

        action.stop();

        if (action === this.activeAction) this.activeAction = null;
    }


    /**
     * stops every action controlled by this mixer.
     * @returns {void}
     */
    stopAll()
    {
        this.mixer.stopAllAction();
        this.activeAction = null;
    }


    /**
     * returns a cached action without starting it.
     * @param {string} name - exact name of a cached animation clip.
     * @returns {THREE.AnimationAction|undefined} matching action when available.
     */
    getAction(name)
    {
        return this.actions.get(name);
    }


    /**
     * stops all actions and releases mixer references owned by this controller.
     * @returns {void}
     */
    dispose()
    {
        this.stopAll();
        this.mixer.uncacheRoot(this.root);
        this.actions.clear();
    }



    //############################################
    //              PRIVATE METHODS
    //############################################

    /**
     * creates and caches mixer actions by clip name.
     * @returns {void}
     */
    #createActions()
    {
        for (const clip of this.clips)
        {
            const action = this.mixer.clipAction(clip);
            this.actions.set(clip.name, action);
        }
    }


    /**
     * configures and starts a crossfade to another cached action.
     * @param {string} name - exact name of a cached animation clip.
     * @param {number} duration - fade duration in seconds.
     * @param {boolean} loop - whether the target action repeats indefinitely.
     * @returns {THREE.AnimationAction} target animation action.
     * @throws {Error} when no action exists for the supplied name.
     */
    #fadeTo(name, duration, loop)
    {
        const nextAction = this.actions.get(name);
        const previousAction = this.activeAction;

        if (!nextAction) throw new Error("Next action not found: " + name);
        if (nextAction === this.activeAction) return nextAction;

        if (loop)
        {
            nextAction.setLoop(THREE.LoopRepeat, Infinity);
            nextAction.clampWhenFinished = false;
        }
        else
        {
            nextAction.setLoop(THREE.LoopOnce, 1);
            nextAction.clampWhenFinished = true;
        }

        nextAction.reset();
        nextAction.setEffectiveTimeScale(1);
        nextAction.setEffectiveWeight(1);
        nextAction.fadeIn(duration);
        nextAction.play();

        if (previousAction) previousAction.fadeOut(duration);

        this.activeAction = nextAction;

        return nextAction;
    }


    /**
     * clears the active action reference after mixer playback finishes.
     * @param {object} event - mixer event containing the finished animation action.
     * @returns {void}
     */
    #onFinished(event)
    {
        this.activeAction = null;
    }


}
