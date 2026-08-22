import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../CharacterController.js';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';

export class BaseLevelScene extends BaseScene
{
    constructor(inputManager, updateManager, sceneManager, assetManager, audioManager, options = {})
    {
        super(updateManager, assetManager);

        const {
            gravity = new THREE.Vector3(0, -9.81, 0),
            cameraFov = 60,
            cameraNear = 0.1,
            cameraFar = 300,
            cameraOffset = new THREE.Vector3(0, 7, 7),
            cameraSmoothing = 5,
            cameraDeadZoneX = 0,
            cameraDeadZoneZ = 0,
            cameraFollowY = true,
            bodyPosition = new THREE.Vector3(-2, 3, 0),
            spiritPosition = new THREE.Vector3(2, 3, 0)
        } = options;

        this.inputManager = inputManager;
        this.sceneManager = sceneManager;
        this.audioManager = audioManager;

        this.physicsWorld = new RAPIER.World(gravity);
        this.camera = new THREE.PerspectiveCamera(
            cameraFov,
            window.innerWidth / window.innerHeight,
            cameraNear,
            cameraFar
        );

        this.cameraOffset = cameraOffset.clone();
        this.cameraSmoothing = cameraSmoothing;
        this.cameraDeadZoneX = cameraDeadZoneX;
        this.cameraDeadZoneZ = cameraDeadZoneZ;
        this.cameraFollowY = cameraFollowY;
        this.cameraFollowPoint = new THREE.Vector3();
        this.cameraTarget = new THREE.Vector3();
        this.characterPosition = new THREE.Vector3();

        this.characterController = new CharacterController(
            this.inputManager,
            this.assetManager,
            this.physicsWorld,
            { bodyPosition, spiritPosition }
        );
        this.scene.add(this.characterController);

        this.#initializeCameraPosition();
    }

    enter()
    {
        this.enterLevel();
    }

    preUpdate(deltaTime)
    {
        this.preUpdateLevel(deltaTime);
    }

    fixedUpdate(fixedDeltaTime)
    {
        //movement must be prepared before rapier advances the physics simulation
        this.characterController.fixedUpdate(fixedDeltaTime);
        this.fixedUpdateLevel(fixedDeltaTime);

        this.physicsWorld.timestep = fixedDeltaTime;
        this.physicsWorld.step();

        //three.js objects must copy their authoritative rapier positions after the step
        this.characterController.syncPhysics();
    }

    update(deltaTime)
    {
        this.characterController.update(deltaTime);
        this.updateLevel(deltaTime);
    }

    lateUpdate(deltaTime)
    {
        this.lateUpdateLevel(deltaTime);
        this.#followCamera(deltaTime);
    }

    exit()
    {
        this.exitLevel();
        this.characterController.dispose();
        this.physicsWorld.free();
    }

    createGroundCollider(width, depth, surfaceY = 0)
    {
        const halfHeight = 0.1;
        const rigidBody = this.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        const colliderDescription = RAPIER.ColliderDesc
            .cuboid(width / 2, halfHeight, depth / 2)
            .setTranslation(0, surfaceY - halfHeight, 0)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);

        return this.physicsWorld.createCollider(colliderDescription, rigidBody);
    }

    enterLevel()
    {
    }

    preUpdateLevel(deltaTime)
    {
    }

    fixedUpdateLevel(fixedDeltaTime)
    {
    }

    updateLevel(deltaTime)
    {
    }

    lateUpdateLevel(deltaTime)
    {
    }

    exitLevel()
    {
    }

    #initializeCameraPosition()
    {
        this.characterController.activeCharacter.getWorldPosition(this.cameraFollowPoint);
        this.camera.position.copy(this.cameraFollowPoint).add(this.cameraOffset);
        this.camera.lookAt(this.cameraFollowPoint);
    }

    #followCamera(deltaTime)
    {
        this.characterController.activeCharacter.getWorldPosition(this.characterPosition);
        this.cameraTarget.copy(this.cameraFollowPoint);

        const diffX = this.characterPosition.x - this.cameraFollowPoint.x;
        const diffZ = this.characterPosition.z - this.cameraFollowPoint.z;

        if (Math.abs(diffX) > this.cameraDeadZoneX)
        {
            this.cameraTarget.x = this.characterPosition.x - Math.sign(diffX) * this.cameraDeadZoneX;
        }

        if (Math.abs(diffZ) > this.cameraDeadZoneZ)
        {
            this.cameraTarget.z = this.characterPosition.z - Math.sign(diffZ) * this.cameraDeadZoneZ;
        }

        if (this.cameraFollowY) this.cameraTarget.y = this.characterPosition.y;

        const alpha = 1 - Math.exp(-this.cameraSmoothing * deltaTime);
        this.cameraFollowPoint.lerp(this.cameraTarget, alpha);

        this.camera.position.copy(this.cameraFollowPoint).add(this.cameraOffset);
        this.camera.lookAt(this.cameraFollowPoint);
    }
}
