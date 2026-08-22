import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { BaseRuntimeLevelObject } from '../runtime/BaseRuntimeLevelObject.js';

const SpikeTrapState = Object.freeze({
    WAITING: 'waiting',
    RISING: 'rising',
    ACTIVE: 'active',
    LOWERING: 'lowering'
});

export class SpikeTrap extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {})
    {
        super(physicsWorld, characterController, model, options);

        const {
            startDelay = 0,
            interval = 2,
            activeDuration = 1,
            damage = 1
        } = options;

        this.bodyCharacter = characterController.bodyCharacter;
        this.interval = interval;
        this.activeDuration = activeDuration;
        this.damage = damage;
        this.timeUntilActivation = startDelay;
        this.activeTimeRemaining = 0;
        this.hasDamagedThisCycle = false;
        this.state = SpikeTrapState.WAITING;

        const [clip] = model.animations ?? [];
        if (!clip) throw new Error('Spike trap model has no animation.');

        this.mixer = new THREE.AnimationMixer(model);
        this.action = this.mixer.clipAction(clip);
        this.action.setLoop(THREE.LoopOnce, 1);
        this.action.clampWhenFinished = true;

        this.handleAnimationFinished = event => this.#handleAnimationFinished(event);
        this.mixer.addEventListener('finished', this.handleAnimationFinished);

        this.#createDamageSensor();
    }


    update(deltaTime)
    {
        this.mixer.update(deltaTime);

        if (this.state === SpikeTrapState.WAITING)
        {
            this.timeUntilActivation -= deltaTime;
            if (this.timeUntilActivation <= 0) this.#raiseSpikes();
            return;
        }

        if (this.state !== SpikeTrapState.ACTIVE) return;

        this.#damageBodyIfIntersecting();
        this.activeTimeRemaining -= deltaTime;
        if (this.activeTimeRemaining <= 0) this.#lowerSpikes();
    }


    dispose()
    {
        this.mixer.removeEventListener('finished', this.handleAnimationFinished);
        this.action.stop();
        this.mixer.uncacheRoot(this.model);

        if (this.damageCollider.isValid())
        {
            this.physicsWorld.removeCollider(this.damageCollider, true);
        }
    }


    #raiseSpikes()
    {
        this.state = SpikeTrapState.RISING;
        this.hasDamagedThisCycle = false;
        this.action.reset();
        this.action.timeScale = 1;
        this.action.play();
    }


    #lowerSpikes()
    {
        this.state = SpikeTrapState.LOWERING;
        this.action.reset();
        this.action.time = this.action.getClip().duration;
        this.action.timeScale = -1;
        this.action.play();
    }


    #handleAnimationFinished(event)
    {
        if (event.action !== this.action) return;

        if (this.state === SpikeTrapState.RISING)
        {
            this.state = SpikeTrapState.ACTIVE;
            this.activeTimeRemaining = this.activeDuration;
            this.#damageBodyIfIntersecting();
            return;
        }

        if (this.state === SpikeTrapState.LOWERING)
        {
            this.state = SpikeTrapState.WAITING;
            this.timeUntilActivation = this.interval;
        }
    }


    #createDamageSensor()
    {
        this.updateWorldMatrix(true, true);

        const plate = this.model.getObjectByName('plate');
        const plateBounds = new THREE.Box3().setFromObject(plate);
        const plateSize = plateBounds.getSize(new THREE.Vector3());
        const plateCenter = plateBounds.getCenter(new THREE.Vector3());
        const scaledHazardHeight = 1.1 * Math.abs(this.scale.y);

        const colliderDescription = RAPIER.ColliderDesc
            .cuboid(plateSize.x / 2, scaledHazardHeight / 2, plateSize.z / 2)
            .setTranslation(
                plateCenter.x,
                plateBounds.max.y + scaledHazardHeight / 2,
                plateCenter.z
            )
            .setSensor(true)
            .setCollisionGroups(PhysicsCollisionGroup.BODY_TRIGGER);

        this.damageCollider = this.physicsWorld.createCollider(colliderDescription);
    }


    #damageBodyIfIntersecting()
    {
        if (this.hasDamagedThisCycle) return;

        const intersectsBody = this.physicsWorld.intersectionPair(
            this.damageCollider,
            this.bodyCharacter.collider
        );

        if (!intersectsBody) return;

        this.hasDamagedThisCycle = true;
        this.bodyCharacter.takeDamage(this.damage);
    }
}
