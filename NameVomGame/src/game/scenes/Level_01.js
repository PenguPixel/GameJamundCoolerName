import * as THREE from 'three';
import { BaseScene } from './baseScene';
import { Player } from '../Player';

export class Level_01 extends BaseScene
{
    constructor(inputManager, updateManager)
    {
        super(updateManager);

        this.camera = new THREE.PerspectiveCamera(60,  window.innerWidth / window.innerHeight);
        this.inputManager = inputManager;

        this.#init();
    }

    #init()
    {
        this.player = new Player(this.inputManager);
        this.add(this.player);
    }

    enter()
    {
        console.log('ENTER LEVEL 01');

        this.camera.position.set(0, 5, 8);
        this.camera.lookAt(0, 0, 0);

        const grid = new THREE.GridHelper(20, 20);
        this.scene.add(grid);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);
    }

    update(deltaTime)
    {

    }

    exit()
    {
        console.log('EXIT LEVEL 01');
    }
}