import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { AudioId } from '../../core/constants/AudioId.js';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { BaseRuntimeLevelObject } from './BaseRuntimeLevelObject.js';

const OPEN_COLLIDER_DELAY = 2;
const CLOSE_COLLIDER_DELAY = 1;

export class ControlledDoor extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {}, audioManager = null)
    {
        super(physicsWorld, characterController, model, options, audioManager);

        this.isOpen = false;
        this.collider = null;
        this.colliderChangeTime = null;

        const [clip] = this.model.animations;
        this.mixer = new THREE.AnimationMixer(this.model);
        this.action = this.mixer.clipAction(clip);
        this.action.setLoop(THREE.LoopOnce, 1);
        this.action.clampWhenFinished = true;

        this.updateWorldMatrix(true, true);
        this.closedColliderBounds = new THREE.Box3().setFromObject(this.model);
        this.#createCollider(this.closedColliderBounds);
    }


    update(deltaTime)
    {
        this.mixer.update(deltaTime);
        if (this.colliderChangeTime === null) return;

        this.colliderChangeTime -= deltaTime;
        if (this.colliderChangeTime > 0) return;

        this.colliderChangeTime = null;

        if (this.isOpen)
        {
            this.#removeCollider();
            return;
        }

        if (!this.collider) this.#createCollider(this.closedColliderBounds);
    }


    onActivationChanged(shouldOpen)
    {
        if (shouldOpen === this.isOpen) return;

        this.isOpen = shouldOpen;
        this.audioManager.playSfx(AudioId.DOOR_PRESSURE_PLATE);

        if (this.isOpen)
        {
            this.action.timeScale = 1;
        }
        else
        {
            this.action.timeScale = -1;
        }

        this.action.paused = false;
        this.action.play();
        this.#scheduleColliderChange();
    }


    dispose()
    {
        this.action.stop();
        this.mixer.uncacheRoot(this.model);
        this.#removeCollider();
    }


    #scheduleColliderChange()
    {
        this.colliderChangeTime = this.isOpen ? OPEN_COLLIDER_DELAY : CLOSE_COLLIDER_DELAY;
    }


    #createCollider(bounds)
    {
        const size = bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5);
        const center = bounds.getCenter(new THREE.Vector3());
        const description = RAPIER.ColliderDesc
            .cuboid(size.x, size.y, size.z)
            .setTranslation(center.x, center.y, center.z)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);

        this.collider = this.physicsWorld.createCollider(description);
    }


    #removeCollider()
    {
        if (!this.collider) return;

        this.physicsWorld.removeCollider(this.collider, true);
        this.collider = null;
    }
}
