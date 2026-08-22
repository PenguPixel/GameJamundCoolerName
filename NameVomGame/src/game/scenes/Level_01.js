import * as THREE from 'three';
import { BaseLevelScene } from './BaseLevelScene.js';
import { AssetId } from '../../core/constants/AssetId.js';

export class Level_01 extends BaseLevelScene
{
    constructor(inputManager, updateManager, sceneManager, assetManager, audioManager)
    {
        super(inputManager, updateManager, sceneManager, assetManager, audioManager, {
            cameraDeadZoneX: 3,
            cameraDeadZoneZ: 3,
            cameraFollowY: false,
            bodyPosition: new THREE.Vector3(0, 0, 0),
            spiritPosition: new THREE.Vector3(2, 0, 0)
        });

        this.#setupLights();
        this.#setupEnvironment();
        this.#setupAssets();
        this.createGroundCollider(20, 20);
    }

    enterLevel()
    {
        console.log('ENTER LEVEL 01');
    }

    exitLevel()
    {
        console.log('EXIT LEVEL 01');
    }

    #setupLights()
    {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        const pointLight = new THREE.PointLight(0xff00ff, 8);
        pointLight.position.set(1, 1, 1);

        this.scene.add(ambientLight, pointLight);
    }

    #setupEnvironment()
    {
        const grid = new THREE.GridHelper(20, 20);
        this.scene.add(grid);
    }

    #setupAssets()
    {
        const chest = this.assetManager.createInstance(AssetId.CHEST);
        chest.scale.setScalar(100);
        chest.position.set(-2, 0, 0);
        chest.rotation.y = Math.PI / 2;

        this.scene.add(chest);
    }
}
