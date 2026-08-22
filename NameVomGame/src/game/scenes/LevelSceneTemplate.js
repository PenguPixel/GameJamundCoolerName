import * as THREE from 'three';
import { BaseLevelScene } from './BaseLevelScene.js';


// Für ein neues Level:
// 1. Datei kopieren und umbenennen.
// 2. Klasse umbenennen.
// 3. Neue ID in SceneId.js ergänzen.
// 4. Scene in Game.js importieren und registrieren.
// 5. In #setupAssets() und den Level-Hooks das eigentliche Level bauen.


export class LevelSceneTemplate extends BaseLevelScene
{
    constructor(inputManager, updateManager, sceneManager, assetManager, audioManager)
    {
        //configures the shared level camera, characters, spawn points, and physics world
        super(inputManager, updateManager, sceneManager, assetManager, audioManager, {
            cameraFov: 60,
            cameraNear: 0.1,
            cameraFar: 300,
            cameraOffset: new THREE.Vector3(0, 7, 7),
            cameraSmoothing: 5,
            cameraDeadZoneX: 0,
            cameraDeadZoneZ: 0,
            cameraFollowY: true,
            bodyPosition: new THREE.Vector3(-2, 0, 0),
            spiritPosition: new THREE.Vector3(2, 0, 0)
        });

        this.scene.background = new THREE.Color(0x101218);

        this.#setupEnvironment();
        this.#setupLights();
        this.#setupAssets();
        this.#setupPhysics();
    }


    //called whenever this level becomes the active scene
    enterLevel()
    {

    }


    //called once per rendered frame before fixed physics updates
    preUpdateLevel(deltaTime)
    {

    }


    //called during every fixed step before the rapier world is simulated
    fixedUpdateLevel(fixedDeltaTime)
    {

    }


    //called once per rendered frame after character animations are updated
    updateLevel(deltaTime)
    {

    }


    //called after regular updates but before the shared follow camera is updated
    lateUpdateLevel(deltaTime)
    {

    }


    //called before characters and the rapier world are disposed
    exitLevel()
    {

    }


    #setupEnvironment()
    {
        const groundSize = 30;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x263d46, side: THREE.DoubleSide });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;

        //the grid is slightly raised to prevent flickering where both surfaces overlap
        const grid = new THREE.GridHelper(groundSize, groundSize, 0x765a7c, 0x263d46);
        grid.position.y = 0.01;

        this.scene.add(ground, grid);
    }


    #setupLights()
    {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(5, 10, 5);

        this.scene.add(ambientLight, directionalLight);
    }


    #setupAssets()
    {
        //create level-specific asset instances here and add them to this.scene
    }


    #setupPhysics()
    {
        //this collider matches the visible 30 by 30 ground plane
        this.createGroundCollider(30, 30);

        //create additional wall, obstacle, trigger, and puzzle colliders here
    }
}
