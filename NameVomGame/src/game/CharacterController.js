import * as THREE from 'three';
import { InputAction } from '../core/constants/InputAction.js';
import { BodyCharacter } from './characters/BodyCharacter.js';
import { SpiritCharacter } from './characters/SpiritCharacter.js';

export class CharacterController extends THREE.Group
{
    constructor(inputManager, assetManager, physicsWorld, options = {})
    {
        super();

        const {
            bodyPosition = new THREE.Vector3(-2, 3, 0),
            spiritPosition = new THREE.Vector3(2, 3, 0)
        } = options;

        this.inputManager = inputManager;
        this.speed = 6;
        this.direction = new THREE.Vector3();

        this.bodyCharacter = new BodyCharacter(assetManager, physicsWorld, bodyPosition);
        this.spiritCharacter = new SpiritCharacter(assetManager, physicsWorld, spiritPosition);
        this.activeCharacter = this.bodyCharacter;

        this.add(this.bodyCharacter, this.spiritCharacter);
    }

    update(deltaTime)
    {
        this.bodyCharacter.updateAnimation(deltaTime);
        this.spiritCharacter.updateAnimation(deltaTime);

        if (this.inputManager.justPressed(InputAction.SWAP_CHARACTER)) this.#swapCharacter();
    }

    fixedUpdate(fixedDeltaTime)
    {
        this.#readMovementInput();
        this.bodyCharacter.stopMovement();
        this.activeCharacter.faceDirection(this.direction, fixedDeltaTime);
        this.activeCharacter.move(this.direction, this.speed, fixedDeltaTime);
    }

    syncPhysics()
    {
        this.bodyCharacter.syncPhysics();
        this.spiritCharacter.syncPhysics();
    }

    dispose()
    {
        this.bodyCharacter.dispose();
        this.spiritCharacter.dispose();
    }

    #readMovementInput()
    {
        this.direction.set(0, 0, 0);

        if (this.inputManager.isPressed(InputAction.MOVE_FORWARD)) this.direction.z -= 1;
        if (this.inputManager.isPressed(InputAction.MOVE_BACKWARD)) this.direction.z += 1;
        if (this.inputManager.isPressed(InputAction.MOVE_LEFT)) this.direction.x -= 1;
        if (this.inputManager.isPressed(InputAction.MOVE_RIGHT)) this.direction.x += 1;

        if (this.direction.lengthSq() > 0) this.direction.normalize();
    }

    #swapCharacter()
    {
        this.activeCharacter = this.activeCharacter === this.bodyCharacter ? this.spiritCharacter : this.bodyCharacter;
    }
}
