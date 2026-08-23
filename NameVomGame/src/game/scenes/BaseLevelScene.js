import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../CharacterController.js';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { validateLevelData } from '../levels/LevelData.js';
import { LevelObjectFactory } from '../levels/LevelObjectFactory.js';
import { getLevelObjectDefinition, LevelObjectType } from '../levels/LevelObjectCatalog.js';
import { SpikeTrap } from '../templates/SpikeTrap.js';
import { ControlledDoor } from '../runtime/ControlledDoor.js';
import { PressurePlate } from '../runtime/PressurePlate.js';
import { Pitfall } from '../runtime/Pitfall.js';
import { SpiritLightCone } from '../runtime/SpiritLightCone.js';
import { SpiritPlatform } from '../runtime/SpiritPlatform.js';
import { SpiritChallengeController } from '../SpiritChallengeController.js';
import { SceneId } from '../../core/constants/SceneId.js';
import { LevelIntroController } from '../LevelIntroController.js';

//add future traps and interactive level objects here using the same constructor parameters
const RuntimeLevelObjectClasses = new Map([
    [LevelObjectType.SPIKE_TRAP, SpikeTrap],
    [LevelObjectType.DOOR, ControlledDoor],
    [LevelObjectType.PRESSURE_PLATE, PressurePlate],
    [LevelObjectType.PITFALL, Pitfall],
    [LevelObjectType.SPIRIT_LIGHT_CONE, SpiritLightCone],
    [LevelObjectType.SPIRIT_PLATFORM, SpiritPlatform]
]);

const DEATH_END_DELAY = 1;

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
            cameraOffset = new THREE.Vector3(0, 10, 5),
            cameraSmoothing = 5,
            cameraDeadZoneX = 0,
            cameraDeadZoneZ = 0,
            cameraFollowY = true,
            bodyPosition = new THREE.Vector3(-2, 3, 0),
            spiritPosition = new THREE.Vector3(2, 3, 0),
            nextSceneId = SceneId.END,
            gameState,
            levelTitle = 'level'
        } = options;

        this.inputManager = inputManager;
        this.sceneManager = sceneManager;
        this.audioManager = audioManager;
        this.nextSceneId = nextSceneId;

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
        this.levelObjectFactory = new LevelObjectFactory(this.assetManager);
        this.loadedLevelObjects = [];
        this.runtimeLevelObjects = [];
        this.spiritChallengeController = null;
        this.deathEndTimer = 0;
        this.levelIntroController = new LevelIntroController(levelTitle, this.audioManager);

        this.characterController = new CharacterController(
            this.inputManager,
            this.assetManager,
            this.audioManager,
            this.physicsWorld,
            { bodyPosition, spiritPosition, gameState }
        );
        this.scene.add(this.characterController);

        this.#initializeCameraPosition();
    }

    enter()
    {
        this.characterController.startAudio();
        this.enterLevel();
    }

    preUpdate(deltaTime)
    {
        if (!this.levelIntroController.isComplete) return;
        this.preUpdateLevel(deltaTime);
    }

    fixedUpdate(fixedDeltaTime)
    {
        if (!this.levelIntroController.isComplete) return;

        //movement must be prepared before rapier advances the physics simulation
        this.characterController.fixedUpdate(fixedDeltaTime);
        this.fixedUpdateLevel(fixedDeltaTime);

        for (const object of this.runtimeLevelObjects)
        {
            object.fixedUpdate?.(fixedDeltaTime);
        }

        this.physicsWorld.timestep = fixedDeltaTime;
        this.physicsWorld.step();

        //three.js objects must copy their authoritative rapier positions after the step
        this.characterController.syncPhysics();
    }

    update(deltaTime)
    {
        if (!this.levelIntroController.isComplete)
        {
            this.levelIntroController.update(deltaTime);
            return;
        }

        this.characterController.update(deltaTime);

        for (const object of this.runtimeLevelObjects)
        {
            object.update?.(deltaTime);
            if (this.characterController.isDead) break;
        }

        if (this.#updateDeathEnding(deltaTime)) return;

        if (this.spiritChallengeController?.update(deltaTime)) return;
        if (this.#updateDeathEnding(deltaTime)) return;

        this.updateLevel(deltaTime);
    }

    lateUpdate(deltaTime)
    {
        if (!this.levelIntroController.isComplete) return;
        this.lateUpdateLevel(deltaTime);
        this.#followCamera(deltaTime);
    }

    exit()
    {
        this.exitLevel();
        this.levelIntroController.dispose();
        this.spiritChallengeController?.dispose();
        this.spiritChallengeController = null;

        for (const object of this.loadedLevelObjects)
        {
            this.scene.remove(object);
            object.dispose?.();
            this.levelObjectFactory.dispose(object);
        }

        this.loadedLevelObjects.length = 0;
        this.runtimeLevelObjects.length = 0;
        this.characterController.dispose();
        this.physicsWorld.free();
    }

    loadLevelData(levelData)
    {
        const validatedData = validateLevelData(levelData);
        const createdVisuals = [];
        const objectsById = new Map();
        const staticObjectsByType = new Map();
        const createdRuntimeObjects = [];

        for (const objectData of validatedData.objects)
        {
            const definition = getLevelObjectDefinition(objectData.type);
            if (!definition) throw new Error(`Unknown level object type: ${objectData.type}`);

            const RuntimeObjectClass = RuntimeLevelObjectClasses.get(definition.runtimeObject);

            if (RuntimeObjectClass)
            {
                const model = this.levelObjectFactory.createFromData(objectData);
                const object = new RuntimeObjectClass(
                    this.physicsWorld,
                    this.characterController,
                    model,
                    model.userData.levelObjectProperties,
                    this.audioManager
                );

                objectsById.set(objectData.id, object);
                createdVisuals.push(object);
                createdRuntimeObjects.push(object);
                continue;
            }

            if (definition.staticBatch)
            {
                //runtime-only static objects are collected by type and rendered as instances
                const objectsData = staticObjectsByType.get(objectData.type) ?? [];
                objectsData.push(objectData);
                staticObjectsByType.set(objectData.type, objectsData);
                continue;
            }

            const object = this.levelObjectFactory.createFromData(objectData);
            objectsById.set(objectData.id, object);
            createdVisuals.push(object);
        }

        for (const [type, objectsData] of staticObjectsByType)
        {
            const { batch, colliderObjects } = this.levelObjectFactory.createStaticBatch(type, objectsData);
            createdVisuals.push(batch);

            for (const object of colliderObjects)
            {
                objectsById.set(object.userData.levelObjectId, object);
            }
        }

        for (const object of createdVisuals)
        {
            this.scene.add(object);
            this.loadedLevelObjects.push(object);
        }

        for (const object of createdRuntimeObjects)
        {
            object.connect?.(objectsById);
        }

        this.runtimeLevelObjects.push(...createdRuntimeObjects);
        this.#setupSpiritChallenge(createdRuntimeObjects);

        return validatedData.objects.map(objectData => objectsById.get(objectData.id));
    }

    createLevelObjectColliders(objects)
    {
        const colliders = [];

        for (const object of objects)
        {
            const definition = getLevelObjectDefinition(object.userData.levelObjectType);
            if (!definition?.physicsCollisionGroup) continue;

            colliders.push(this.createBoxColliderForObject(
                object,
                definition.physicsCollisionGroup,
                definition.colliderHeight
            ));
        }

        return colliders;
    }

    createBoxColliderForObject(object, collisionGroups, minimumHeight = 0)
    {
        const bounds = this.#getObjectLocalBounds(object);
        if (bounds.isEmpty()) throw new Error('Cannot create a collider for an object without mesh geometry.');

        const localCenter = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const worldScale = object.getWorldScale(new THREE.Vector3());
        const worldCenter = object.localToWorld(localCenter.clone());
        const worldRotation = object.getWorldQuaternion(new THREE.Quaternion());

        const worldSize = new THREE.Vector3(
            Math.abs(size.x * worldScale.x),
            Math.abs(size.y * worldScale.y),
            Math.abs(size.z * worldScale.z)
        );

        if (worldSize.y < minimumHeight)
        {
            //extends flat level objects downward so their visible top surface stays unchanged
            const missingHeight = minimumHeight - worldSize.y;
            const localDown = new THREE.Vector3(0, -1, 0).applyQuaternion(worldRotation);
            worldCenter.addScaledVector(localDown, missingHeight / 2);
            worldSize.y = minimumHeight;
        }

        const halfExtents = worldSize.multiplyScalar(0.5);

        const rigidBodyDescription = RAPIER.RigidBodyDesc
            .fixed()
            .setTranslation(worldCenter.x, worldCenter.y, worldCenter.z)
            .setRotation(worldRotation);

        const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDescription);
        const colliderDescription = RAPIER.ColliderDesc
            .cuboid(halfExtents.x, halfExtents.y, halfExtents.z)
            .setCollisionGroups(collisionGroups);
        const collider = this.physicsWorld.createCollider(colliderDescription, rigidBody);

        return { rigidBody, collider };
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

    onTransitionInComplete()
    {
        this.levelIntroController.start();
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

    #setupSpiritChallenge(runtimeObjects)
    {
        const platforms = runtimeObjects.filter(object => object instanceof SpiritPlatform);
        const startPlatform = platforms.find(platform => platform.platformType === 'start');
        const endPlatform = platforms.find(platform => platform.platformType === 'end');

        if (!startPlatform) return;

        this.spiritChallengeController?.dispose();
        this.spiritChallengeController = new SpiritChallengeController(
            this.characterController,
            this.audioManager,
            this.sceneManager,
            startPlatform,
            endPlatform,
            this.nextSceneId
        );
    }

    #updateDeathEnding(deltaTime)
    {
        if (!this.characterController.isDead) return false;

        this.deathEndTimer += deltaTime;
        if (this.deathEndTimer >= DEATH_END_DELAY)
        {
            this.sceneManager.changeScene(SceneId.BAD_END);
        }

        return true;
    }

    #getObjectLocalBounds(object)
    {
        const cachedBounds = object.userData.levelObjectBounds;
        if (cachedBounds) return cachedBounds.clone();

        object.updateWorldMatrix(true, true);

        const rootWorldInverse = object.matrixWorld.clone().invert();
        const bounds = new THREE.Box3().makeEmpty();
        const corner = new THREE.Vector3();
        const matrixToRoot = new THREE.Matrix4();

        object.traverse(child =>
        {
            if (!child.isMesh || !child.geometry) return;

            child.geometry.computeBoundingBox();
            const meshBounds = child.geometry.boundingBox;
            if (!meshBounds) return;

            matrixToRoot.multiplyMatrices(rootWorldInverse, child.matrixWorld);

            for (const x of [meshBounds.min.x, meshBounds.max.x])
            {
                for (const y of [meshBounds.min.y, meshBounds.max.y])
                {
                    for (const z of [meshBounds.min.z, meshBounds.max.z])
                    {
                        corner.set(x, y, z).applyMatrix4(matrixToRoot);
                        bounds.expandByPoint(corner);
                    }
                }
            }
        });

        return bounds;
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
