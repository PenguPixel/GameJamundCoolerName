import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { AudioId } from '../../core/constants/AudioId.js';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { BaseRuntimeLevelObject } from './BaseRuntimeLevelObject.js';

const OPEN_COLLIDER_DELAY = 2000;
const CLOSE_COLLIDER_DELAY = 1000;

export class ControlledDoor extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {}, audioManager = null)
    {
        super(physicsWorld, characterController, model, options, audioManager);

        this.sources = new Set();
        this.activeSources = new Set();
        this.isOpen = false;
        this.collider = null;
        this.colliderTimer = null;

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
    }


    setSourceActive(sourceId, isActive)
    {
        if (isActive) this.activeSources.add(sourceId);
        else this.activeSources.delete(sourceId);

        const shouldOpen = this.sources.size > 0 && this.activeSources.size === this.sources.size;
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


    registerSource(sourceId)
    {
        this.sources.add(sourceId);
    }


    dispose()
    {
        clearTimeout(this.colliderTimer);
        this.action.stop();
        this.mixer.uncacheRoot(this.model);
        this.#removeCollider();
    }


    #scheduleColliderChange()
    {
        clearTimeout(this.colliderTimer);
        const delay = this.isOpen ? OPEN_COLLIDER_DELAY : CLOSE_COLLIDER_DELAY;

        this.colliderTimer = setTimeout(() =>
        {
            this.colliderTimer = null;

            if (this.isOpen)
            {
                this.#removeCollider();
                return;
            }

            if (!this.collider) this.#createCollider(this.closedColliderBounds);
        }, delay);
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
