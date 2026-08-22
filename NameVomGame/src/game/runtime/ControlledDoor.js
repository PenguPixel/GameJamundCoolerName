import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { AudioId } from '../../core/constants/AudioId.js';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { BaseRuntimeLevelObject } from './BaseRuntimeLevelObject.js';

export class ControlledDoor extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {}, audioManager = null)
    {
        super(physicsWorld, characterController, model, options, audioManager);

        this.sources = new Set();
        this.activeSources = new Set();
        this.isOpen = false;
        this.collider = null;

        const [clip] = this.model.animations;
        this.mixer = new THREE.AnimationMixer(this.model);
        this.action = this.mixer.clipAction(clip);
        this.action.setLoop(THREE.LoopOnce, 1);
        this.action.clampWhenFinished = true;

        this.handleAnimationFinished = () => this.#handleAnimationFinished();
        this.mixer.addEventListener('finished', this.handleAnimationFinished);

        this.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3().setFromObject(this.model);
        this.#createCollider(bounds);
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
    }


    registerSource(sourceId)
    {
        this.sources.add(sourceId);
    }


    dispose()
    {
        this.mixer.removeEventListener('finished', this.handleAnimationFinished);
        this.action.stop();
        this.mixer.uncacheRoot(this.model);
        this.#removeCollider();
    }


    #handleAnimationFinished()
    {
        if (this.isOpen)
        {
            this.#removeCollider();
            return;
        }

        if (this.collider) return;

        this.updateWorldMatrix(true, true);
        this.#createCollider(new THREE.Box3().setFromObject(this.model));
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
