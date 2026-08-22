import RAPIER from '@dimforge/rapier3d-compat';
import { BaseCharacter } from './BaseCharacter.js';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { AssetId } from '../../core/constants/AssetId.js';

export class BodyCharacter extends BaseCharacter
{
    constructor(assetManager, physicsWorld, position)
    {
        super(assetManager, AssetId.CHARACTER);

        //a dynamic rigid body is affected by gravity, contacts, forces, and impulses
        const rigidBodyDescription = RAPIER.RigidBodyDesc
            .dynamic()
            //places the rapier body at the requested starting point
            .setTranslation(position.x, position.y, position.z)
            //prevents the player falling over
            .lockRotations();

        const rigidBody = physicsWorld.createRigidBody(rigidBodyDescription);

        const colliderDescription = RAPIER.ColliderDesc
            .capsule(0.6, 0.45)
            //moves the collider
            .setTranslation(0, 1.05, 0)
            .setCollisionGroups(PhysicsCollisionGroup.BODY);

        //attaches the capsule to the rigid body
        const collider = physicsWorld.createCollider(colliderDescription, rigidBody);

        this.setPhysics(rigidBody, collider);
        this.position.copy(position);
    }

    move(direction, speed)
    {
        //get current velocity with gravity in y
        const velocity = this.rigidBody.linvel();

        //the true argument applies the new velocity immediately
        this.rigidBody.setLinvel({ x: direction.x * speed, y: velocity.y, z: direction.z * speed }, true);
    }

    stopMovement()
    {
        const velocity = this.rigidBody.linvel();
        this.rigidBody.setLinvel({ x: 0, y: velocity.y, z: 0 }, true);
    }
}
