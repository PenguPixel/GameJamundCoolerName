import * as THREE from 'three';
import { Time } from './Time.js';
import { InputManager } from './manager/InputManager.js';
import { InputAction } from './constants/InputAction.js';
import { UpdateManager } from "./manager/UpdateManager.js";
import { AssetManager } from "./manager/AssetManager.js";
import { AssetManifest } from "./config/AssetManifest.js";
import { SceneManager } from './manager/SceneManager.js';
import { SceneId } from './constants/SceneId.js';
import { Game } from '../game/Game.js';

export default class Engine
{

    //############################################
    //                CONSTRUCTOR
    //############################################

    /**
     * creates the renderer, scene, camera, engine managers, and input bindings.
     * @param {HTMLCanvasElement} canvas - canvas used by the webgl renderer.
     */
    constructor(canvas)
    {
        //creates the three.js rendering foundation
        
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.add(new THREE.AxesHelper);
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


        //creates the reusable engine services

        this.time = new Time();
        this.inputManager = new InputManager();
        this.updateManager = new UpdateManager();
        this.assetManager = new AssetManager(AssetManifest);
        this.sceneManager =  new SceneManager()


        //register resize event
        
        window.addEventListener('resize', () => this.#resize());
        this.#resize();
    }



    //############################################
    //               PUBLIC METHODS
    //############################################

    /**
     * loads every registered asset, creates the game, and starts the render loop.
     * @returns {Promise<void>} resolves after initialization has completed.
     * @throws {Error} when an asset cannot be loaded or game initialization fails.
     */
    async start()
    {
        await this.assetManager.loadAll();

        this.game = new Game(
            this.inputManager, 
            this.updateManager,
            this.assetManager,
            this.sceneManager
        );

        this.updateManager.add(this.game);

        this.renderer.setAnimationLoop(() => this.#updateLoop());
    }



    //############################################
    //              PRIVATE METHODS
    //############################################

    /**
     * runs all update phases and renders one frame.
     * @returns {void}
     */
    #updateLoop()
    {
        //updates frame timing
        this.time.update();

        //runs preparation logic before simulation
        this.updateManager.preUpdate(this.time.deltaTime);

        //runs deterministic fixed-step simulation
        while (this.time.accumulator >= this.time.fixedDeltaTime)
        {
            this.updateManager.fixedUpdate(this.time.fixedDeltaTime);
            this.time.accumulator -= this.time.fixedDeltaTime;
        }

        //runs frame-based game logic
        this.updateManager.update(this.time.deltaTime);

        //runs logic that depends on completed updates
        this.updateManager.lateUpdate(this.time.deltaTime);

        //renders the scene and clears single-frame input states
        this.sceneManager.render(this.renderer);
        this.inputManager.endFrame();
    }


    /**
     * synchronizes renderer and camera dimensions with the browser window.
     * @returns {void}
     */
    #resize()
    {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);
        this.sceneManager.resize(width, height);
    }

}
