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
        this.#setupWorldPlane();
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

    #setupWorldPlane()
    {
        // World Size
        const worldTileSize = 10;
        const cols = 5;
        const rows = 5;

        const worldTileMeshes = this.assetManager.createInstancedMeshes(AssetId.WORLD1, 25);

        const gridSize = 5;
        const dummy = new THREE.Object3D();

        for (let i = 0; i < 25; i++)
        {
            const row = Math.floor(i / gridSize);
            const column = i % gridSize;

            dummy.position.set(column, 0, row);
            dummy.scale.setScalar(0.001)
            dummy.rotation.x = -Math.PI / 2;
            dummy.updateMatrix();

            worldTileMeshes.setMatrixAt(i, dummy.matrix);
        }

        worldTileMeshes.instanceMatrix.needsUpdate = true;

        // console.log(worldTileMeshes);
        // worldTileMeshes.scale.setScalar(0.1);

        // const worldPlaneGroup = new THREE.Group();

        // for(let x = 0; x < cols; x++)
        // {
        //     for(let z = 0; z < rows; z++)
        //     {
        //         const posX = (x - cols / 2) * worldTileSize;
        //         const posZ = (z - rows / 2) * worldTileSize;

        //         worldTileMeshes.position.set(posX, 0, posZ);

        //         worldPlaneGroup.add(worldTileMeshes);
        //     }
        // }

        this.scene.add(worldTileMeshes);
    }
}
