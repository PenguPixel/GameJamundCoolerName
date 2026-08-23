import * as THREE from 'three';
import { BaseLevelScene } from './BaseLevelScene.js';
import levelData from '../levels/data/level_end.json';
import { SceneId } from '../../core/constants/SceneId.js';
import { AssetId } from '../../core/constants/AssetId.js';
import { AudioId } from '../../core/constants/AudioId.js';
import { BaseCharacter } from '../characters/BaseCharacter.js';
import { SpiritPlatform } from '../runtime/SpiritPlatform.js';
import finalSequenceOverlay from '../ui/FinalSequenceOverlay.html?raw';
import '../ui/FinalSequenceOverlay.css';

const FinalState = Object.freeze({
    APPROACH: 'approach',
    WAITING: 'waiting',
    SPIRIT_MERGE: 'spiritMerge',
    RESTORING_COLOR: 'restoringColor',
    LOOKING_AROUND: 'lookingAround',
    RESCUED_APPROACH: 'rescuedApproach',
    HEART: 'heart',
    COMPLETE: 'complete'
});

const APPROACH_SPEED = 2.2;
const RESCUED_SPEED = 1.6;
const WAIT_DURATION = 1.25;
const SPIRIT_MERGE_DURATION = 2.25;
const COLOR_RESTORE_DURATION = 1.25;
const LOOK_DURATION = 2.8;
const HEART_FADE_DURATION = 1;
const HEART_HOLD_DURATION = 1;
const HEART_SCREEN_OFFSET_X = -12;
const PALE_CHARACTER_COLOR = new THREE.Color(0xaaa0b2);

export class Level_End extends BaseLevelScene
{
    constructor(inputManager, updateManager, sceneManager, assetManager, audioManager, gameState)
    {
        super(inputManager, updateManager, sceneManager, assetManager, audioManager, {
            cameraFov: 60,
            cameraNear: 0.1,
            cameraFar: 300,
            cameraOffset: new THREE.Vector3(0, 10, 5),
            cameraSmoothing: 5,
            cameraDeadZoneX: 0,
            cameraDeadZoneZ: 0,
            cameraFollowY: true,
            bodyPosition: new THREE.Vector3(-7, 0, -0.7),
            spiritPosition: new THREE.Vector3(-7, 0, 0.7),
            bodyMusicId: AudioId.FINAL_LEVEL_MUSIC,
            nextSceneId: SceneId.END,
            gameState,
            levelTitle: 'The Reunion'
        });

        this.scene.background = new THREE.Color(0x101218);
        this.finalState = FinalState.APPROACH;
        this.stateTime = 0;
        this.platform = null;
        this.rescuedCharacter = null;
        this.bodyTarget = new THREE.Vector3();
        this.spiritTarget = new THREE.Vector3();
        this.spiritMergeStart = new THREE.Vector3();
        this.spiritMergeTarget = new THREE.Vector3();
        this.rescuedTarget = new THREE.Vector3();
        this.moveDirection = new THREE.Vector3();
        this.ghostMaterials = [];
        this.rescuedMaterials = [];
        this.overlay = null;
        this.heart = null;

        this.#setupLights();
        this.#setupAssets();
        this.#setupPhysics();
        this.#setupFinalSequence();
    }


    enterLevel()
    {
        this.characterController.setControlsEnabled(false);
    }


    fixedUpdateLevel(fixedDeltaTime)
    {
        if (this.finalState !== FinalState.APPROACH) return;

        const bodyArrived = this.#moveBodyTo(this.bodyTarget, APPROACH_SPEED, fixedDeltaTime);
        const spiritArrived = this.#moveSpiritTo(this.spiritTarget, APPROACH_SPEED, fixedDeltaTime);

        if (!bodyArrived || !spiritArrived) return;

        this.#setState(FinalState.WAITING);
    }


    updateLevel(deltaTime)
    {
        this.rescuedCharacter.updateAnimation(deltaTime);
        this.stateTime += deltaTime;

        if (this.finalState === FinalState.WAITING)
        {
            if (this.stateTime >= WAIT_DURATION) this.#beginSpiritMerge();
            return;
        }

        if (this.finalState === FinalState.SPIRIT_MERGE)
        {
            this.#updateSpiritMerge();
            return;
        }

        if (this.finalState === FinalState.RESTORING_COLOR)
        {
            this.#updateRescuedColor();
            return;
        }

        if (this.finalState === FinalState.LOOKING_AROUND)
        {
            this.#updateLookingAround();
            return;
        }

        if (this.finalState === FinalState.RESCUED_APPROACH)
        {
            this.#updateRescuedApproach(deltaTime);
            return;
        }

        if (this.finalState === FinalState.HEART) this.#updateHeart();
    }


    lateUpdateLevel()
    {
        if (this.finalState === FinalState.HEART) this.#positionHeart();
    }


    exitLevel()
    {
        this.rescuedCharacter?.dispose();
        this.rescuedCharacter?.removeFromParent();

        for (const material of this.ghostMaterials) material.dispose();
        this.ghostMaterials.length = 0;

        for (const { material } of this.rescuedMaterials) material.dispose();
        this.rescuedMaterials.length = 0;

        this.overlay?.remove();
        this.overlay = null;
        this.heart = null;
    }


    #setupLights()
    {
        const ambientLight = new THREE.AmbientLight(0xffffff, 3);
        const directionalLight = new THREE.DirectionalLight(0x2999AD, 9);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(1024, 1024);
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.0001;
        directionalLight.shadow.normalBias = 0.02;

        this.trackShadowLight(directionalLight);
        this.scene.add(ambientLight, directionalLight);
    }


    #setupAssets()
    {
        this.levelObjects = this.loadLevelData(levelData);
    }


    #setupPhysics()
    {
        //creates colliders only where editor objects such as tiles and walls are placed
        this.createLevelObjectColliders(this.levelObjects);
    }


    #setupFinalSequence()
    {
        this.platform = this.runtimeLevelObjects.find(object => object instanceof SpiritPlatform);
        if (!this.platform) throw new Error('Level_End needs one spirit platform.');

        const platformPosition = this.platform.getSpawnPosition();
        this.bodyTarget.set(platformPosition.x - 4, platformPosition.y, platformPosition.z - 0.7);
        this.spiritTarget.set(platformPosition.x - 4, platformPosition.y, platformPosition.z + 0.7);
        this.spiritMergeTarget.copy(platformPosition).add(new THREE.Vector3(0, 0.8, 0));

        this.rescuedCharacter = new BaseCharacter(this.assetManager, AssetId.CHARACTER_2, false);
        this.rescuedCharacter.position.copy(platformPosition);
        this.rescuedCharacter.rotation.y = -Math.PI / 2;
        this.#prepareRescuedColor();
        this.scene.add(this.rescuedCharacter);

        this.#prepareGhostFade();
        this.#createOverlay();
    }


    #moveBodyTo(target, speed, deltaTime)
    {
        const body = this.characterController.bodyCharacter;
        const position = body.rigidBody.translation();
        this.moveDirection.set(target.x - position.x, 0, target.z - position.z);

        if (this.moveDirection.length() <= 0.08)
        {
            body.stopMovement();
            return true;
        }

        this.moveDirection.normalize();
        body.faceDirection(this.moveDirection, deltaTime);
        body.move(this.moveDirection, speed);
        return false;
    }


    #moveSpiritTo(target, speed, deltaTime)
    {
        const spirit = this.characterController.spiritCharacter;
        const position = spirit.rigidBody.translation();
        this.moveDirection.set(target.x - position.x, 0, target.z - position.z);

        if (this.moveDirection.length() <= 0.08) return true;

        this.moveDirection.normalize();
        spirit.faceDirection(this.moveDirection, deltaTime);
        spirit.move(this.moveDirection, speed, deltaTime);
        spirit.animationController.activeAction.timeScale = 12;
        return false;
    }


    #beginSpiritMerge()
    {
        const spiritPosition = this.characterController.spiritCharacter.rigidBody.translation();
        this.spiritMergeStart.set(spiritPosition.x, spiritPosition.y, spiritPosition.z);
        this.#setState(FinalState.SPIRIT_MERGE);
    }


    #updateSpiritMerge()
    {
        const spirit = this.characterController.spiritCharacter;
        const progress = Math.min(this.stateTime / SPIRIT_MERGE_DURATION, 1);
        const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1);
        const position = new THREE.Vector3().lerpVectors(
            this.spiritMergeStart,
            this.spiritMergeTarget,
            easedProgress
        );

        spirit.rigidBody.setNextKinematicTranslation(position);
        for (const material of this.ghostMaterials) material.opacity = 1 - easedProgress;

        if (progress < 1) return;

        spirit.visible = false;
        spirit.collider.setEnabled(false);
        this.#setState(FinalState.RESTORING_COLOR);
    }


    #updateRescuedColor()
    {
        const progress = Math.min(this.stateTime / COLOR_RESTORE_DURATION, 1);
        const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1);

        for (const { material, originalColor } of this.rescuedMaterials)
        {
            material.color.lerpColors(PALE_CHARACTER_COLOR, originalColor, easedProgress);
        }

        if (progress >= 1) this.#setState(FinalState.LOOKING_AROUND);
    }


    #updateLookingAround()
    {
        const progress = Math.min(this.stateTime / LOOK_DURATION, 1);
        this.rescuedCharacter.rotation.y = -Math.PI / 2 + Math.sin(progress * Math.PI * 4) * 0.7;

        if (progress < 1) return;

        const bodyPosition = this.characterController.bodyCharacter.position;
        this.rescuedTarget.set(bodyPosition.x + 1.3, this.rescuedCharacter.position.y, bodyPosition.z);
        this.rescuedCharacter.rotation.y = -Math.PI / 2;
        const action = this.rescuedCharacter.animationController.playLoop(
            this.rescuedCharacter.model.animations[0].name
        );
        action.timeScale = 5;
        this.#setState(FinalState.RESCUED_APPROACH);
    }


    #updateRescuedApproach(deltaTime)
    {
        this.moveDirection.subVectors(this.rescuedTarget, this.rescuedCharacter.position);
        const distance = this.moveDirection.length();
        const movement = RESCUED_SPEED * deltaTime;

        if (distance > movement)
        {
            this.rescuedCharacter.position.addScaledVector(this.moveDirection.normalize(), movement);
            return;
        }

        this.rescuedCharacter.position.copy(this.rescuedTarget);
        this.rescuedCharacter.animationController.stopAll();
        this.heart.hidden = false;
        this.#positionHeart();
        this.#setState(FinalState.HEART);
    }


    #updateHeart()
    {
        const fadeOutStart = HEART_FADE_DURATION + HEART_HOLD_DURATION;
        const totalDuration = fadeOutStart + HEART_FADE_DURATION;

        if (this.stateTime < HEART_FADE_DURATION)
        {
            this.heart.style.opacity = String(this.stateTime / HEART_FADE_DURATION);
            return;
        }

        if (this.stateTime < fadeOutStart)
        {
            this.heart.style.opacity = '1';
            return;
        }

        this.heart.style.opacity = String(1 - (this.stateTime - fadeOutStart) / HEART_FADE_DURATION);

        if (this.stateTime < totalDuration) return;

        this.#setState(FinalState.COMPLETE);
        this.sceneManager.changeScene(SceneId.END);
    }


    #positionHeart()
    {
        const bodyPosition = new THREE.Vector3();
        const rescuedPosition = new THREE.Vector3();
        this.characterController.bodyCharacter.getWorldPosition(bodyPosition);
        this.rescuedCharacter.getWorldPosition(rescuedPosition);

        bodyPosition.lerp(rescuedPosition, 0.5);
        bodyPosition.y += 2.8;
        bodyPosition.project(this.camera);

        const canvas = document.querySelector('#canvas-threeJs');
        this.heart.style.left = `${(bodyPosition.x * 0.5 + 0.5) * canvas.clientWidth + HEART_SCREEN_OFFSET_X}px`;
        this.heart.style.top = `${(-bodyPosition.y * 0.5 + 0.5) * canvas.clientHeight}px`;
    }


    #prepareGhostFade()
    {
        this.characterController.spiritCharacter.model.traverse(object =>
        {
            if (!object.isMesh) return;

            const materials = Array.isArray(object.material)
                ? object.material.map(material => material.clone())
                : [object.material.clone()];

            for (const material of materials)
            {
                material.transparent = true;
                this.ghostMaterials.push(material);
            }

            object.material = Array.isArray(object.material) ? materials : materials[0];
        });
    }


    #prepareRescuedColor()
    {
        this.rescuedCharacter.model.traverse(object =>
        {
            if (!object.isMesh) return;

            const materials = Array.isArray(object.material)
                ? object.material.map(material => material.clone())
                : [object.material.clone()];

            for (const material of materials)
            {
                if (!material.color) continue;

                this.rescuedMaterials.push({
                    material,
                    originalColor: material.color.clone()
                });
                material.color.copy(PALE_CHARACTER_COLOR);
            }

            object.material = Array.isArray(object.material) ? materials : materials[0];
        });
    }


    #createOverlay()
    {
        this.overlay = document.createElement('div');
        this.overlay.innerHTML = finalSequenceOverlay;
        document.body.append(this.overlay);
        this.heart = this.overlay.querySelector('[data-final-heart]');
    }


    #setState(state)
    {
        this.finalState = state;
        this.stateTime = 0;
    }
}
