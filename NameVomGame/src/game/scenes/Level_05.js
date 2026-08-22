import * as THREE from 'three';
import { BaseLevelScene } from './BaseLevelScene.js';
import levelData from '../levels/data/new_level.json';

export class Level_05 extends BaseLevelScene
{
    constructor(inputManager, updateManager, sceneManager, assetManager, audioManager)
    {
        super(inputManager, updateManager, sceneManager, assetManager, audioManager, {
            cameraFov: 60,
            cameraNear: 0.1,
            cameraFar: 300,
            cameraOffset: new THREE.Vector3(0, 10, 5),
            cameraSmoothing: 5,
            cameraDeadZoneX: 0,
            cameraDeadZoneZ: 0,
            cameraFollowY: true,
            bodyPosition: new THREE.Vector3(-3, 0, 0),
            spiritPosition: new THREE.Vector3(2, 0, 0)
        });

        this.scene.background = new THREE.Color(0x101218);

        this.#setupLights();
        this.#setupAssets();
        this.#setupPhysics();
    }


    enterLevel()
    {

    }


    exitLevel()
    {

    }


    #setupLights()
    {
        const ambientLight = new THREE.AmbientLight(0xffffff, 3);
        const directionalLight = new THREE.DirectionalLight(0x2999AD, 9);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(1024, 1024);
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.0001;
        directionalLight.shadow.normalBias = 0.02;

        this.scene.add(ambientLight, directionalLight);
    }


    #setupAssets()
    {
        this.levelObjects = this.loadLevelData(levelData);
    }


    #setupPhysics()
    {
        //creates colliders only where editor objects such as tiles and walls are placed
        this.createLevelObjectColliders(this.levelObjects);
    }
}
