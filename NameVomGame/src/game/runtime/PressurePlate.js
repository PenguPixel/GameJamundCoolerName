import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { BaseRuntimeLevelObject } from './BaseRuntimeLevelObject.js';

export class PressurePlate extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {})
    {
        super(physicsWorld, characterController, model, options);

        this.activator = options.activator ?? 'body';
        this.targetId = options.targetId ?? '';
        this.target = null;
        this.isPressed = false;
        this.sourceId = this.userData.levelObjectId;
        this.character = this.activator === 'spirit'
            ? characterController.spiritCharacter
            : characterController.bodyCharacter;

        const [clip] = this.model.animations;
        this.mixer = new THREE.AnimationMixer(this.model);
        this.action = this.mixer.clipAction(clip);
        this.action.setLoop(THREE.LoopOnce, 1);
        this.action.clampWhenFinished = true;

        this.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3().setFromObject(this.model);
        const size = bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5);
        const center = bounds.getCenter(new THREE.Vector3());
        const sensorHeight = 0.5;
        const collisionGroups = this.activator === 'spirit'
            ? PhysicsCollisionGroup.SPIRIT_TRIGGER
            : PhysicsCollisionGroup.BODY_TRIGGER;

        const description = RAPIER.ColliderDesc
            .cuboid(size.x, sensorHeight / 2, size.z)
            .setTranslation(center.x, bounds.max.y + sensorHeight / 2, center.z)
            .setSensor(true)
            .setCollisionGroups(collisionGroups);

        if (this.activator === 'spirit')
        {
            description.setActiveCollisionTypes(
                RAPIER.ActiveCollisionTypes.DEFAULT |
                RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED
            );
        }

        this.collider = this.physicsWorld.createCollider(description);
    }


    connect(objectsById)
    {
        this.target = objectsById.get(this.targetId);
        this.target?.registerSource?.(this.sourceId);
    }


    update(deltaTime)
    {
        this.mixer.update(deltaTime);

        const isPressed = this.physicsWorld.intersectionPair(this.collider, this.character.collider);
        if (isPressed === this.isPressed) return;

        this.isPressed = isPressed;
        this.action.timeScale = this.isPressed ? 1 : -1;
        this.action.paused = false;
        this.action.play();
        this.target?.setSourceActive?.(this.sourceId, this.isPressed);
    }


    dispose()
    {
        this.target = null;
        this.action.stop();
        this.mixer.uncacheRoot(this.model);
        this.physicsWorld.removeCollider(this.collider, true);
    }
}
