import { PostProcessingManager } from './PostProcessingManager';

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
        this.postProcessingManager = null;
    }




    //############################################
    //               PUBLIC METHODS
    //############################################

    /**
     * runs preparation logic on the active scene when supported.
     * @param {number} deltaTime - elapsed frame time in seconds.
     * @returns {void}
     */
    preUpdate(deltaTime)
    {
        this.activeScene?.preUpdate?.(deltaTime);
    }


    /**
     * runs fixed-step simulation logic on the active scene when supported.
     * @param {number} fixedDeltaTime - fixed simulation step in seconds.
     * @returns {void}
     */
    fixedUpdate(fixedDeltaTime)
    {
        this.activeScene?.fixedUpdate?.(fixedDeltaTime);
    }


    /**
     * runs frame-based logic on the active scene when supported.
     * @param {number} deltaTime - elapsed frame time in seconds.
     * @returns {void}
     */
    update(deltaTime)
    {
        this.activeScene?.update?.(deltaTime);
    }


    /**
     * runs follow-up logic on the active scene after regular updates when supported.
     * @param {number} deltaTime - elapsed frame time in seconds.
     * @returns {void}
     */
    lateUpdate(deltaTime)
    {
        this.activeScene?.lateUpdate?.(deltaTime);
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
        if (!sceneFunction) throw new Error(`Scene is not registered: ${id}`);

        //allows the previous scene to release scene-specific state

        if (this.activeScene)
        {
            this.activeScene.exit?.();
            this.activeScene.destroy?.();
        }

        //creates and enters a fresh scene controller

        this.activeScene = sceneFunction();
        this.activeSceneId = id;

        this.activeScene.enter?.();

        // Wenn die neue Szene Camera und Scene hat, PostProcessing aktualisieren
        if (this.postProcessingManager && this.activeScene?.scene && this.activeScene?.camera)
        {
            this.postProcessingManager.setSceneAndCamera(this.activeScene.scene, this.activeScene.camera);
        }
    }


    /**
     * renders the active scene with its own camera.
     * @param {import('three').WebGLRenderer} renderer - renderer owned by the engine.
     * @returns {void}
     */
    render(renderer)
    {
        if (!this.activeScene ||
            !this.activeScene.scene ||
            !this.activeScene.camera 
        ) return;

        // renderer.render(this.activeScene.scene, this.activeScene.camera);

        if(!this.postProcessingManager)
        {
            this.postProcessingManager = new PostProcessingManager(renderer);
            this.postProcessingManager.setSceneAndCamera(this.activeScene.scene, this.activeScene.camera);
        }

        const isSpirit = this.activeScene.characterController?.isSpiritActive ?? false;
        this.postProcessingManager.setSpiritMode(Boolean(isSpirit));

        this.postProcessingManager.update();
        
        this.postProcessingManager.render();
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
        this.postProcessingManager?.resize(width, height);
    }
}
