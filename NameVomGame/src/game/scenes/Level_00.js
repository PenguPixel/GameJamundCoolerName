import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { BaseLevelScene } from './BaseLevelScene.js';
import { DynamicObjects } from '../templates/DynamicObjects.js';

export class Level_00 extends BaseLevelScene
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
        this.#setupRoomGeometry();
        this.#setupLights();
        this.#setupAssets();
        this.#setupPhysics();
    }


    //called whenever this level becomes the active scene
    enterLevel()
    {
        console.log('ENTER LEVEL 00');
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

    #setupRoomGeometry()
    {
        

    }

    #setupLights()
    {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(5, 10, 5);

        this.scene.add(ambientLight, directionalLight);
    }


    // Puzzle and State References
    // Door
    #doorMesh = null;
    #doorCollider = null;
    #doorRigidBody = null;
    #isDoorOpen = false;
    
    // Lever
    #leverTriggerCollider = null;
    #leverMesh = null;
    
    #setupAssets()
    {
        //create level-specific asset instances here and add them to this.scene

        // Materials
        const wallMat = new THREE.MeshStandardMaterial({color: 0xaaaaaa});
        const doorMat = new THREE.MeshStandardMaterial({color: 0x00aaaa});
        const gateMat = new THREE.MeshStandardMaterial({
            color: 0xaa00aa,
            wireframe: true,
        });
        const triggerMat = new THREE.MeshStandardMaterial({
            color: 0xaaaa00,
            emissive: 0xaaaaaa,
            emissiveIntensity: 0.8
        });
        
        // Meshes
        const leftWallMesh = new THREE.Mesh( new THREE.BoxGeometry(4, 3, 0.5), wallMat);
        leftWallMesh.position.set(-2, 1.5, -2);

        const gateMesh = new THREE.Mesh( new THREE.BoxGeometry(2, 3, 0.5), gateMat);
        gateMesh.position.set(2, 1.5, -2);
        
        this.#doorMesh = new THREE.Mesh( new THREE.BoxGeometry(2, 3, 0.5), doorMat);
        this.#doorMesh.position.set(0, 1.5, -2);

        // Add
        this.scene.add(leftWallMesh, gateMesh, this.#doorMesh);

        // Dynamic Objects

    this.dynamicFactory = new DynamicObjects(this.physicsWorld);

    const trapDoor = this.dynamicFactory.createTrapDoor({
        position: { x: 0, y: 0, z: 0 },
        size: { x: 1, y: 1, z: 1}
    });
    console.log(trapDoor);


    }


    #setupPhysics()
    {
        //this collider matches the visible 30 by 30 ground plane
        this.createGroundCollider(30, 30);

        //create additional wall, obstacle, trigger, and puzzle colliders here

        const leftWallBody = this.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        const leftWallDesc = RAPIER.ColliderDesc.cuboid(2, 1.5, 0.25)
            .setTranslation(-4, 1.5, -2)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);
        this.physicsWorld.createCollider(leftWallDesc, leftWallBody);

        const gateBody = this.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        const gateDesc = RAPIER.ColliderDesc.cuboid(1, 1.5, 0.25)
            .setTranslation(2, 1.5, -2)
            .setCollisionGroups(PhysicsCollisionGroup.SPIRIT_PASSABLE);
        this.physicsWorld.createCollider(gateDesc, gateBody);

        const doorBody = this.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        const doorBodyDesc = RAPIER.ColliderDesc.cuboid(1, 1.5, 0.25)
            .setTranslation(0, 1.5, -2)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);
        this.physicsWorld.createCollider(doorBodyDesc, doorBody);
        
    }
}
