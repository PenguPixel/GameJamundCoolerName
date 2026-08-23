import * as THREE from 'three';
import { BaseLevelScene } from './BaseLevelScene.js';
import { AssetId } from '../../core/constants/AssetId.js';

export class Level_01 extends BaseLevelScene
{
    constructor(inputManager, updateManager, sceneManager, assetManager, audioManager, gameState)
    {
        super(inputManager, updateManager, sceneManager, assetManager, audioManager, {
            cameraDeadZoneX: 3,
            cameraDeadZoneZ: 3,
            cameraFollowY: false,
            bodyPosition: new THREE.Vector3(0, 0, 0),
            spiritPosition: new THREE.Vector3(2, 0, 0),
            gameState,
            levelTitle: 'level 01'
        });

        this.#setupLights();
        this.#setupEnvironment();
        this.#setupAssets();
        this.#setupWorldPlane();
        this.createGroundCollider(50, 50);
    }

    enterLevel()
    {
    }

    exitLevel()
    {
    }

    #setupLights()
    {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        const pointLight = new THREE.PointLight(0xff00ff, 8);
        pointLight.position.set(1, 1, 1);
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.set(1024, 1024);
        pointLight.shadow.camera.near = 0.1;
        pointLight.shadow.camera.far = 50;
        pointLight.shadow.bias = -0.0001;
        pointLight.shadow.normalBias = 0.02;

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

    #setupWorldPlane()
    {
        const worldTileSize = 10;
        const gridSize = 5;
        const worldTileCount = gridSize * gridSize;
        const worldTileMeshes = this.assetManager.createInstancedMeshes(AssetId.WORLD1, worldTileCount);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < worldTileCount; i++)
        {
            const row = Math.floor(i / gridSize);
            const column = i % gridSize;
            const offset = (gridSize - 1) / 2;

            dummy.position.set(
                (column - offset) * worldTileSize,
                0,
                (row - offset) * worldTileSize
            );
            dummy.scale.setScalar(0.001);
            dummy.rotation.x = -Math.PI / 2;
            dummy.updateMatrix();

            worldTileMeshes.setMatrixAt(i, dummy.matrix);
        }

        worldTileMeshes.instanceMatrix.needsUpdate = true;

        this.scene.add(worldTileMeshes);
    }
}
