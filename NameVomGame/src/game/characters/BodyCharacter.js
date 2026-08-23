import RAPIER from '@dimforge/rapier3d-compat';
import { BaseCharacter } from './BaseCharacter.js';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { AssetId } from '../../core/constants/AssetId.js';
import { AudioId } from '../../core/constants/AudioId.js';

const FOOTSTEP_AUDIO_IDS = Object.freeze([
    AudioId.FOOTSTEP_SAND_1,
    AudioId.FOOTSTEP_SAND_2,
    AudioId.FOOTSTEP_SAND_3,
    AudioId.FOOTSTEP_SAND_4,
    AudioId.FOOTSTEP_SAND_5,
    AudioId.FOOTSTEP_SAND_6,
    AudioId.FOOTSTEP_SAND_7,
    AudioId.FOOTSTEP_SAND_8
]);

const HIT_AUDIO_IDS = Object.freeze([
    AudioId.BODY_HIT_1,
    AudioId.BODY_HIT_2,
    AudioId.BODY_HIT_3,
    AudioId.BODY_HIT_4,
    AudioId.BODY_HIT_5,
    AudioId.BODY_HIT_6,
    AudioId.BODY_HIT_7,
    AudioId.BODY_HIT_8
]);

const FOOTSTEP_INTERVAL = 0.25;
const MINIMUM_WALKING_SPEED = 0.1;
const MAXIMUM_GROUNDED_VERTICAL_SPEED = 0.15;

export class BodyCharacter extends BaseCharacter
{
    constructor(assetManager, audioManager, physicsWorld, position, healthController)
    {
        super(assetManager, AssetId.CHARACTER, false);

        this.audioManager = audioManager;
        this.healthController = healthController;
        this.footstepTimer = 0;
        this.movementClipName = this.model.animations[0].name;

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

    updateAnimation(deltaTime, isActive)
    {
        const velocity = this.rigidBody.linvel();
        const isMoving = isActive && Math.hypot(velocity.x, velocity.z) >= MINIMUM_WALKING_SPEED;

        if (isMoving && !this.animationController.activeAction)
        {
            const action = this.animationController.playLoop(this.movementClipName);
            action.timeScale = 5;
        }
        else if (!isMoving && this.animationController.activeAction)
        {
            this.animationController.stopAll();
        }

        super.updateAnimation(deltaTime);
    }

    takeDamage(amount = 1)
    {
        if (!this.healthController.takeDamage(amount)) return false;

        this.#playRandomHitSound();
        return true;
    }

    updateFootsteps(deltaTime, isActive)
    {
        const velocity = this.rigidBody.linvel();

        //horizontal velocity prevents footsteps while standing against an obstacle
        const horizontalSpeed = Math.hypot(velocity.x, velocity.z);

        //vertical velocity prevents footsteps while jumping or falling
        const isGrounded = Math.abs(velocity.y) <= MAXIMUM_GROUNDED_VERTICAL_SPEED;
        const isWalking = isActive && horizontalSpeed >= MINIMUM_WALKING_SPEED && isGrounded;

        if (!isWalking)
        {
            //a fresh interval starts whenever walking resumes
            this.footstepTimer = 0;
            return;
        }

        this.footstepTimer += deltaTime;
        if (this.footstepTimer < FOOTSTEP_INTERVAL) return;

        //keeps leftover frame time so the cadence stays stable at different frame rates
        this.footstepTimer %= FOOTSTEP_INTERVAL;
        this.#playRandomFootstep();
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

    #playRandomFootstep()
    {
        const randomIndex = Math.floor(Math.random() * FOOTSTEP_AUDIO_IDS.length);
        this.audioManager.playSfx(FOOTSTEP_AUDIO_IDS[randomIndex]);
    }


    #playRandomHitSound()
    {
        const randomIndex = Math.floor(Math.random() * HIT_AUDIO_IDS.length);
        this.audioManager.playSfx(HIT_AUDIO_IDS[randomIndex]);
    }
}
