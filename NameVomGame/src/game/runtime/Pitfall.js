import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { BaseRuntimeLevelObject } from './BaseRuntimeLevelObject.js';

const PIT_DEPTH = 3;

export class Pitfall extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {})
    {
        super(physicsWorld, characterController, model, options);

        this.bodyCharacter = characterController.bodyCharacter;
        this.hasTriggered = false;
        this.colliders = [];

        const mesh = this.model.getObjectByProperty('isMesh', true);
        mesh.castShadow = false;
        mesh.receiveShadow = false;

        this.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3().setFromObject(this.model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const triggerDescription = RAPIER.ColliderDesc
            .cuboid(size.x / 2, 0.25, size.z / 2)
            .setTranslation(center.x, this.position.y + 0.25, center.z)
            .setSensor(true)
            .setCollisionGroups(PhysicsCollisionGroup.BODY_TRIGGER);

        this.triggerCollider = this.physicsWorld.createCollider(triggerDescription);
        this.colliders.push(this.triggerCollider);

        const bottomDescription = RAPIER.ColliderDesc
            .cuboid(size.x / 2, 0.1, size.z / 2)
            .setTranslation(center.x, this.position.y - PIT_DEPTH - 0.1, center.z)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);
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
            description.setCollisionGroups(PhysicsCollisionGroup.WORLD);
            this.colliders.push(this.physicsWorld.createCollider(description));
        }
    }


    update()
    {
        const isInside = this.physicsWorld.intersectionPair(this.triggerCollider, this.bodyCharacter.collider);

        if (isInside && !this.hasTriggered)
        {
            const position = this.bodyCharacter.rigidBody.translation();
            this.bodyCharacter.rigidBody.setTranslation({
                x: position.x,
                y: this.position.y - 2.5,
                z: position.z
            }, true);
            this.bodyCharacter.takeDamage(1);
        }

        this.hasTriggered = isInside;
    }


    dispose()
    {
        for (const collider of this.colliders)
        {
            this.physicsWorld.removeCollider(collider, true);
        }
    }
}
