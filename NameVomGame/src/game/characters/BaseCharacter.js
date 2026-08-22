import * as THREE from 'three';
import { AnimationController } from '../../core/animation/AnimationController.js';

export class BaseCharacter extends THREE.Group
{
    constructor(assetManager, assetId)
    {
        super();

        this.assetManager = assetManager;

        this.rigidBody = null;
        this.collider = null;

        this.#createModel(assetId);
        this.#setupAnimation();
    }

    updateAnimation(deltaTime)
    {
        this.animationController.update(deltaTime);
    }

    faceDirection(direction, deltaTime)
    {
        if (direction.lengthSq() === 0) return;

        //atan2 converts the horizontal movement vector into a rotation around the y axis
        const targetRotation = Math.atan2(direction.x, direction.z);

        //normalizes the difference to ensure rotation always takes the shortest path
        const angleDifference = Math.atan2(
            Math.sin(targetRotation - this.rotation.y),
            Math.cos(targetRotation - this.rotation.y)
        );

        //smoothing
        const alpha = 1 - Math.exp(-10 * deltaTime);
        this.rotation.y = THREE.MathUtils.lerp(this.rotation.y, this.rotation.y + angleDifference, alpha);
    }

    setPhysics(rigidBody, collider)
    {
        this.rigidBody = rigidBody;
        this.collider = collider;
    }

    syncPhysics()
    {
        //characters without physics can still use this base class without causing an error
        if (!this.rigidBody) return;

        //rapier owns the authoritative position after the physics world has stepped
        const position = this.rigidBody.translation();

        //three.js does not know about rapier, so its visible object must be updated manually
        this.position.set(position.x, position.y, position.z);
    }

    dispose()
    {
        this.animationController.dispose();
    }

    #createModel(assetId)
    {
        this.model = this.assetManager.createInstance(assetId);

        const bounds = new THREE.Box3().setFromObject(this.model);
        const center = bounds.getCenter(new THREE.Vector3());

        //centers x and z while moving the model bottom to local y zero
        //this keeps the character origin at its feet and matches the rapier body origin
        this.model.position.set(-center.x, -bounds.min.y, -center.z);
        this.add(this.model);
    }

    #setupAnimation()
    {
        const idleClip = this.model.animations[0];
        if (!idleClip) throw new Error('Character model has no idle animation');

        this.animationController = new AnimationController(this.model, this.model.animations);
        this.animationController.playLoop(idleClip.name);
    }
}
