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
import { LoadingScreen } from './LoadingScreen.js';

const GAME_ASPECT_RATIO = 16 / 9;

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
        this.loadingScreen = new LoadingScreen();


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
        const totalItems = AssetManifest.length + AudioManifest.length + 1;
        let loadedItems = 0;
        const itemLoaded = () =>
        {
            loadedItems += 1;
            this.loadingScreen.setProgress(loadedItems / totalItems);
        };

        try
        {
            await Promise.all([
                RAPIER.init().then(itemLoaded),
                this.assetManager.loadAll(itemLoaded),
                this.audioManager.loadAll(itemLoaded)
            ]);
        }
        catch (error)
        {
            this.loadingScreen.showError();
            throw error;
        }

        await this.loadingScreen.finish();

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
        this.updateManager.lateUpdate(this.time.deltaTime, this.time.interpolationAlpha);

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
        let width = window.innerWidth;
        let height = window.innerHeight;

        if (width / height > GAME_ASPECT_RATIO) width = height * GAME_ASPECT_RATIO;
        else height = width / GAME_ASPECT_RATIO;

        width = Math.floor(width);
        height = Math.floor(height);

        document.documentElement.style.setProperty('--game-width', `${width}px`);
        document.documentElement.style.setProperty('--game-height', `${height}px`);

        this.renderer.setSize(width, height);
        this.sceneManager.resize(width, height);
    }

}
