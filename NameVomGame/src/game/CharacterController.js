import * as THREE from 'three';
import { InputAction } from '../core/constants/InputAction.js';
import { BodyCharacter } from './characters/BodyCharacter.js';
import { SpiritCharacter } from './characters/SpiritCharacter.js';
import { AudioId } from '../core/constants/AudioId.js';

export class CharacterController extends THREE.Group
{
    constructor(inputManager, assetManager, audioManager, physicsWorld, options = {})
    {
        super();

        const {
            bodyPosition = new THREE.Vector3(-2, 3, 0),
            spiritPosition = new THREE.Vector3(2, 3, 0)
        } = options;

        this.inputManager = inputManager;
        this.audioManager = audioManager;
        this.speed = 5;
        this.direction = new THREE.Vector3();

        this.bodyCharacter = new BodyCharacter(assetManager, audioManager, physicsWorld, bodyPosition);
        this.spiritCharacter = new SpiritCharacter(assetManager, physicsWorld, spiritPosition);
        this.activeCharacter = this.bodyCharacter;

        this.add(this.bodyCharacter, this.spiritCharacter);
    }

    update(deltaTime)
    {
        this.bodyCharacter.updateAnimation(deltaTime);
        this.spiritCharacter.updateAnimation(
            deltaTime,
            this.activeCharacter === this.spiritCharacter && this.direction.lengthSq() > 0
        );
        this.bodyCharacter.updateFootsteps(deltaTime, this.activeCharacter === this.bodyCharacter);

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

    startAudio()
    {
        this.#updateActiveCharacterAudio();
    }

    dispose()
    {
        this.audioManager.stopMusic();
        this.audioManager.stopAmbient();
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
        this.audioManager.playSfx(AudioId.CHAR_SWAP);
        this.activeCharacter = this.activeCharacter === this.bodyCharacter ? this.spiritCharacter : this.bodyCharacter;
        this.#updateActiveCharacterAudio();
    }



    #updateActiveCharacterAudio()
    {
        if (this.activeCharacter === this.bodyCharacter)
        {
            //music and ambience use separate channels so both body layers play together
            this.audioManager.playMusic(AudioId.BODY_LEVEL_MUSIC);
            this.audioManager.playAmbient(AudioId.BODY_LEVEL_AMBIENT);
            return;
        }

        //the spirit soundscape can be added here without changing the body configuration
        this.audioManager.pauseMusic();
        this.audioManager.pauseAmbient();
    }

    get isSpiritActive()
    {      
        return this.activeCharacter === this.spiritCharacter;
    }
}

