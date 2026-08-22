import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { Player } from '../Player.js';
import { AssetId } from './../../core/constants/AssetId.js';


export class Level_01 extends BaseScene
{
    constructor(inputManager, updateManager, sceneManager, assetManager)
    {
        super(updateManager, assetManager);

        this.camera = new THREE.PerspectiveCamera(60,  window.innerWidth / window.innerHeight);
        this.inputManager = inputManager;
        this.sceneManager = sceneManager;

        this.#init();
    }

    #init()
    {
        this.player = new Player(this.inputManager, this.assetManager);
        this.add(this.player);

        this.#setupLights();

        this.#setupCamera();
        this.#setupMeshes();
    }

    #setupCamera()
    {
        this.cameraFollowPoint = this.player.position.clone();
        this.cameraOffset = new THREE.Vector3(0, 7, 7);
        this.cameraTarget = new THREE.Vector3();
        this.deadZoneX = 3;
        this.deadZoneZ = 3;
    }

    #setupLights()
    {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xff00ff, 8)
        pointLight.position.set(1, 1, 1);
        this.scene.add(pointLight);
    }

    enter()
    {
        console.log('ENTER LEVEL 01');

        this.camera.position.set(0, 5, 8);
        this.camera.lookAt(0, 0, 0);

        const grid = new THREE.GridHelper(20, 20);
        this.scene.add(grid);

    }

    update(deltaTime)
    {
        this.#followCamera(deltaTime);
    }

    exit()
    {
        console.log('EXIT LEVEL 01');
    }

    #followCamera(deltaTime)
        {
            this.cameraTarget.copy(this.cameraFollowPoint);
            const diffX = this.player.position.x - this.cameraFollowPoint.x;
            const diffZ = this.player.position.z - this.cameraFollowPoint.z;

            if (Math.abs(diffX) > this.deadZoneX)
            {
                this.cameraTarget.x = this.player.position.x - Math.sign(diffX) * this.deadZoneX;
            }

            if (Math.abs(diffZ) > this.deadZoneZ)
            {
                this.cameraTarget.z = this.player.position.z - Math.sign(diffZ) * this.deadZoneZ;
            }

        const alpha = 1 - Math.exp(-5 * deltaTime);
        this.cameraFollowPoint.lerp(this.cameraTarget, alpha);

        this.camera.position.copy(this.cameraFollowPoint).add(this.cameraOffset);
        this.camera.lookAt(this.cameraFollowPoint);
    }

    #setupMeshes()
    {
        const chest1 = this.assetManager.createInstance(AssetId.CHEST);
        chest1.scale.setScalar(100)
        chest1.position.set(-2, 0, 0);
        chest1.rotation.y = Math.PI / 2;
        this.scene.add(chest1);

        // const levelPlane = this.assetManager.createInstance(AssetId.LEVEL-PLANE);
        // levelPlane.scale.setScalar(50);
        // levelPlane.position.set(0, 0, 0);
        // this.scene.add(levelPlane);
    }
}