import * as THREE from 'three';
import { InputAction } from "../core/constants/InputAction.js";
import { AssetId } from '../core/constants/AssetId.js';
import { AnimationController } from '../core/animation/AnimationController.js';

export class Player extends THREE.Group
{
    /**
     * Constructor
     */

    constructor(inputManager, assetManager)
    {
        super();

        this.inputManager = inputManager;
        this.assetManager = assetManager;

        this.speed = 8;
        this.direction = new THREE.Vector3();
        this.#createModel();
        this.#setupAnimation();
    }

    #createMesh()
    {
        const geometry = new THREE.CylinderGeometry(3, 3, 3, 12, 2, false);
        const material = new THREE.MeshStandardMaterial( {color: 0xaa00ff});
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0.5, 0);
        this.add(mesh);
    }

     #createModel()
    {
        this.model = this.assetManager.createInstance(AssetId.GHOST);

        const bounds = new THREE.Box3().setFromObject(this.model);
        const center = bounds.getCenter(new THREE.Vector3());

        this.model.position.set(-center.x, -bounds.min.y, -center.z);
        // this.model.rotation.y = Math.PI;
        this.add(this.model);
    }

    #setupAnimation()
    {
        const idleClip = this.model.animations[0];
        if (!idleClip) throw new Error('Ghost model has no idle animation');

        this.animationController = new AnimationController(this.model, this.model.animations);
        this.animationController.playLoop(idleClip.name);
    }
    
    /**
     * Update
     */

    update(deltaTime)
    {
        this.animationController.update(deltaTime);
        this.direction.set(0, 0, 0);

        if (this.inputManager.isPressed(InputAction.MOVE_FORWARD)) this.direction.z -= 1;
        if (this.inputManager.isPressed(InputAction.MOVE_BACKWARD)) this.direction.z += 1;
        if (this.inputManager.isPressed(InputAction.MOVE_LEFT)) this.direction.x -= 1;
        if (this.inputManager.isPressed(InputAction.MOVE_RIGHT)) this.direction.x += 1;

        if (this.direction.lengthSq() > 0) this.direction.normalize();

        this.position.addScaledVector(this.direction, this.speed * deltaTime);
    }
}
