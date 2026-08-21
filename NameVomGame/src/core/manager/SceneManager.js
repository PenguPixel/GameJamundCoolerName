export class SceneManager
{

    //############################################
    //                CONSTRUCTOR
    //############################################

    /**
     * creates the scene registry and active-scene state.
     */
    constructor()
    {
        this.scenes = new Map();
        this.activeScene = null;
        this.activeSceneId = null;
    }




    //############################################
    //               PUBLIC METHODS
    //############################################

    /**
     * updates the active scene when it provides an update method.
     * @param {number} deltaTime - elapsed frame time in seconds.
     * @returns {void}
     */
    update(deltaTime)
    {
        this.activeScene?.update?.(deltaTime);
    }


    /**
     * registers a factory that creates a scene for a stable identifier.
     * @param {string} id - identifier used to select the scene.
     * @param {Function} sceneFunction - factory returning a new scene controller.
     * @returns {void}
     */
    registerScene(id, sceneFunction)
    {
        this.scenes.set(id, sceneFunction);
    }


    /**
     * exits the active scene and enters a newly created registered scene.
     * @param {string} id - identifier of the scene to activate.
     * @returns {void}
     */
    changeScene(id)
    {
        const sceneFunction = this.scenes.get(id);

        //allows the previous scene to release scene-specific state

        if (this.activeScene) this.activeScene.exit?.();

        //creates and enters a fresh scene controller

        this.activeScene = sceneFunction();
        this.activeSceneId = id;

        this.activeScene.enter();
    }


    /**
     * renders the active scene with its own camera.
     * @param {import('three').WebGLRenderer} renderer - renderer owned by the engine.
     * @returns {void}
     */
    render(renderer)
    {
        if (!this.activeScene) return;
        renderer.render(this.activeScene.scene, this.activeScene.camera);
    }


    /**
     * forwards browser dimensions to the active scene when supported.
     * @param {number} width - current viewport width in pixels.
     * @param {number} height - current viewport height in pixels.
     * @returns {void}
     */
    resize(width, height)
    {
        this.activeScene?.resize?.(width, height);
    }

}
