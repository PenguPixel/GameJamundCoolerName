import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Time } from './Time.js';
import { InputManager } from './manager/InputManager.js';
import { UpdateManager } from "./manager/UpdateManager.js";
import { AssetManager } from "./manager/AssetManager.js";
import { AssetManifest } from "./config/AssetManifest.js";
import { SceneManager } from './manager/SceneManager.js';
import { AudioManager } from './manager/AudioManager.js';
import { AudioManifest } from './config/AudioManifest.js';
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
        //creates the three.js renderer

        this.canvas = canvas;
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;


        //creates the reusable engine services

        this.time = new Time();
        this.inputManager = new InputManager();
        this.updateManager = new UpdateManager();
        this.assetManager = new AssetManager(AssetManifest);
        this.audioManager = new AudioManager(AudioManifest);
        this.sceneManager =  new SceneManager();


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
        await Promise.all([
            RAPIER.init(),
            this.assetManager.loadAll(),
            this.audioManager.loadAll()
        ]);

        this.game = new Game(
            this.inputManager,
            this.updateManager,
            this.assetManager,
            this.sceneManager,
            this.audioManager
        );

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
