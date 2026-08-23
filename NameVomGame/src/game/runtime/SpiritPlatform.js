import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { BaseRuntimeLevelObject } from './BaseRuntimeLevelObject.js';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';

export class SpiritPlatform extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {}, audioManager = null)
    {
        super(physicsWorld, characterController, model, options, audioManager);

        this.platformType = options.platformType ?? 'start';
        this.bounds = new THREE.Box3().setFromObject(this);
        this.spawnPosition = this.bounds.getCenter(new THREE.Vector3());
        this.spawnPosition.y = this.bounds.max.y + 0.01;

        this.#createCollider();
    }


    containsCharacter(character)
    {
        const position = character.rigidBody.translation();
        const padding = 0.15;

        return position.x >= this.bounds.min.x + padding &&
            position.x <= this.bounds.max.x - padding &&
            position.z >= this.bounds.min.z + padding &&
            position.z <= this.bounds.max.z - padding &&
            Math.abs(position.y - this.bounds.max.y) <= 0.5;
    }


    getSpawnPosition()
    {
        return this.spawnPosition.clone();
    }


    dispose()
    {
        this.physicsWorld.removeRigidBody(this.rigidBody);
    }


    #createCollider()
    {
        const center = this.bounds.getCenter(new THREE.Vector3());
        const halfExtents = this.bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5);
        const rigidBodyDescription = RAPIER.RigidBodyDesc
            .fixed()
            .setTranslation(center.x, center.y, center.z);

        this.rigidBody = this.physicsWorld.createRigidBody(rigidBodyDescription);

        const colliderDescription = RAPIER.ColliderDesc
            .cuboid(halfExtents.x, halfExtents.y, halfExtents.z)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);

        this.collider = this.physicsWorld.createCollider(colliderDescription, this.rigidBody);
    }
}
