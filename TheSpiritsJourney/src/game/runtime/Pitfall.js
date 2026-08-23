import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { BaseRuntimeLevelObject } from './BaseRuntimeLevelObject.js';

const PIT_DEPTH = 3;
const TRIGGER_SIZE = 1;

export class Pitfall extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {})
    {
        super(physicsWorld, characterController, model, options);

        this.bodyCharacter = characterController.bodyCharacter;
        this.isDisabled = false;
        this.hasTriggered = false;
        this.hasKilled = false;
        this.pitBottomY = this.position.y - PIT_DEPTH;
        this.colliders = [];

        const [clip] = this.model.animations;
        this.mixer = new THREE.AnimationMixer(this.model);
        this.action = this.mixer.clipAction(clip);
        this.action.setLoop(THREE.LoopOnce, 1);
        this.action.clampWhenFinished = true;

        this.updateWorldMatrix(true, true);
        const doorBounds = new THREE.Box3().makeEmpty();
        doorBounds.expandByObject(this.model.getObjectByName('polySurface34'));
        doorBounds.expandByObject(this.model.getObjectByName('polySurface41'));
        const size = doorBounds.getSize(new THREE.Vector3());
        const center = doorBounds.getCenter(new THREE.Vector3());
        this.triggerCenter = center.clone();

        const triggerDescription = RAPIER.ColliderDesc
            .cuboid(TRIGGER_SIZE / 2, 0.25, TRIGGER_SIZE / 2)
            .setTranslation(center.x, doorBounds.max.y + 0.25, center.z)
            .setSensor(true)
            .setCollisionGroups(PhysicsCollisionGroup.BODY_TRIGGER);

        this.triggerCollider = this.physicsWorld.createCollider(triggerDescription);
        this.colliders.push(this.triggerCollider);

        const doorDescription = RAPIER.ColliderDesc
            .cuboid(size.x / 2, 0.05, size.z / 2)
            .setTranslation(center.x, doorBounds.max.y - 0.05, center.z)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);
        this.doorCollider = this.physicsWorld.createCollider(doorDescription);

        const bottomDescription = RAPIER.ColliderDesc
            .cuboid(size.x / 2, 0.1, size.z / 2)
            .setTranslation(center.x, this.position.y - PIT_DEPTH - 0.1, center.z)
            .setCollisionGroups(PhysicsCollisionGroup.PIT);
        this.colliders.push(this.physicsWorld.createCollider(bottomDescription));

        const wallY = this.position.y - PIT_DEPTH / 2;
        const wallDescriptions = [
            RAPIER.ColliderDesc.cuboid(0.1, PIT_DEPTH / 2, size.z / 2)
                .setTranslation(center.x - size.x / 2 - 0.1, wallY, center.z),
            RAPIER.ColliderDesc.cuboid(0.1, PIT_DEPTH / 2, size.z / 2)
                .setTranslation(center.x + size.x / 2 + 0.1, wallY, center.z),
            RAPIER.ColliderDesc.cuboid(size.x / 2, PIT_DEPTH / 2, 0.1)
                .setTranslation(center.x, wallY, center.z - size.z / 2 - 0.1),
            RAPIER.ColliderDesc.cuboid(size.x / 2, PIT_DEPTH / 2, 0.1)
                .setTranslation(center.x, wallY, center.z + size.z / 2 + 0.1)
        ];

        for (const description of wallDescriptions)
        {
            description.setCollisionGroups(PhysicsCollisionGroup.PIT);
            this.colliders.push(this.physicsWorld.createCollider(description));
        }
    }


    update(deltaTime)
    {
        this.mixer.update(deltaTime);
        if (this.hasTriggered)
        {
            const bodyY = this.bodyCharacter.rigidBody.translation().y;
            if (!this.hasKilled && bodyY <= this.pitBottomY + 0.2)
            {
                this.hasKilled = true;
                this.characterController.kill();
            }
            return;
        }

        if (this.isDisabled) return;

        const position = this.bodyCharacter.rigidBody.translation();
        const isInside = this.physicsWorld.intersectionPair(this.triggerCollider, this.bodyCharacter.collider)
            && Math.abs(position.x - this.triggerCenter.x) <= TRIGGER_SIZE / 2
            && Math.abs(position.z - this.triggerCenter.z) <= TRIGGER_SIZE / 2;
        if (!isInside) return;

        this.hasTriggered = true;
        this.action.play();
        this.#removeDoorCollider();

        const velocity = this.bodyCharacter.rigidBody.linvel();
        this.bodyCharacter.rigidBody.setLinvel({ x: 0, y: velocity.y, z: 0 }, true);
        this.bodyCharacter.collider.setCollisionGroups(PhysicsCollisionGroup.FALLING_BODY);
    }


    onActivationChanged(isActivated)
    {
        const shouldDisable = isActivated;
        if (shouldDisable === this.isDisabled) return;

        this.isDisabled = shouldDisable;
        if (!this.hasTriggered) this.triggerCollider.setEnabled(!this.isDisabled);
    }


    fixedUpdate()
    {
        if (!this.hasTriggered) return;

        const velocity = this.bodyCharacter.rigidBody.linvel();
        this.bodyCharacter.rigidBody.setLinvel({ x: 0, y: velocity.y, z: 0 }, true);
    }


    dispose()
    {
        this.action.stop();
        this.mixer.uncacheRoot(this.model);
        this.#removeDoorCollider();

        for (const collider of this.colliders)
        {
            this.physicsWorld.removeCollider(collider, true);
        }
    }


    #removeDoorCollider()
    {
        if (!this.doorCollider) return;

        this.physicsWorld.removeCollider(this.doorCollider, true);
        this.doorCollider = null;
    }


}
