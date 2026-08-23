import RAPIER from '@dimforge/rapier3d-compat';
import { BaseCharacter } from './BaseCharacter.js';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { AssetId } from '../../core/constants/AssetId.js';

export class SpiritCharacter extends BaseCharacter
{
    constructor(assetManager, physicsWorld, position, healthController)
    {
        super(assetManager, AssetId.GHOST);

        this.physicsWorld = physicsWorld;
        this.healthController = healthController;

        //character controller uses collision
        //the 0.1 offset is a safety gap/distance between objectcolliders
        this.rapierCharacterController = this.physicsWorld.createCharacterController(0.1);

        //kinematic so no gravtiy
        const rigidBodyDescription = RAPIER.RigidBodyDesc
            .kinematicPositionBased()
            //places the rapier body at the requested starting point
            .setTranslation(position.x, position.y, position.z);

        const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDescription);

        const colliderDescription = RAPIER.ColliderDesc
            .capsule(0.6, 0.45)
            //moves the collider
            .setTranslation(0, 1.05, 0)
            .setCollisionGroups(PhysicsCollisionGroup.SPIRIT);

        //attaches the capsule to the kinematic rigid body
        const collider = this.physicsWorld.createCollider(colliderDescription, rigidBody);

        this.setPhysics(rigidBody, collider);
        this.position.copy(position);
    }

    updateAnimation(deltaTime, isMoving)
    {
        this.animationController.activeAction.timeScale = isMoving ? 12 : 3;
        super.updateAnimation(deltaTime);
    }

    takeDamage(amount = 1)
    {
        this.healthController.takeDamage(amount);
    }

    move(direction, speed, fixedDeltaTime)
    {
        if (direction.lengthSq() === 0) return;

        //rapier expects a distance for this physics step instead of a velocity per second
        const desiredMovement = {x: direction.x * speed * fixedDeltaTime, y: 0, z: direction.z * speed * fixedDeltaTime};

        //checks the desired movement if it will hit a obstacle
        //sensors must trigger gameplay without blocking the character controller movement
        this.rapierCharacterController.computeColliderMovement(
            this.collider,
            desiredMovement,
            RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
            PhysicsCollisionGroup.SPIRIT
        );

        //get the safe calculated movement
        const movement = this.rapierCharacterController.computedMovement();

        //get current pos because computedmovement is just relative offset
        const position = this.rigidBody.translation();

        //set the next desired movement (will execute in next physic step)
        this.rigidBody.setNextKinematicTranslation({ x: position.x + movement.x, y: position.y + movement.y, z: position.z + movement.z });
    }

    dispose()
    {
        this.physicsWorld.removeCharacterController(this.rapierCharacterController);
        super.dispose();
    }
}
