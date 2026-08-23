import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { BaseRuntimeLevelObject } from './BaseRuntimeLevelObject.js';
import { AudioId } from '../../core/constants/AudioId.js';

const HIT_TINT_DURATION = 0.4;
const HIT_COLOR = new THREE.Color(0xff2020);

export class SpiritLightCone extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {}, audioManager = null)
    {
        super(physicsWorld, characterController, model, options, audioManager);

        this.spiritCharacter = characterController.spiritCharacter;
        this.isDisabled = false;
        this.hasDamaged = false;
        this.hitTintRemaining = 0;
        this.speed = options.speed ?? 2;
        this.pathDirection = new THREE.Vector3();
        this.pathPoints = this.#createPath(options.path ?? '5,0');
        this.pathIndex = this.pathPoints.length > 1 ? 1 : 0;

        this.mesh = this.model.getObjectByProperty('isMesh', true);
        this.mesh.material = this.mesh.material.clone();
        this.defaultColor = this.mesh.material.color.clone();
        this.defaultEmissive = this.mesh.material.emissive.clone();
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = false;

        this.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3().setFromObject(this.model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const radius = Math.max(size.x, size.z) / 2;

        const description = RAPIER.ColliderDesc
            .cylinder(1.2, radius)
            .setTranslation(center.x, 1.2, center.z)
            .setSensor(true)
            .setCollisionGroups(PhysicsCollisionGroup.SPIRIT_TRIGGER)
            .setActiveCollisionTypes(
                RAPIER.ActiveCollisionTypes.DEFAULT |
                RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED
            );

        this.collider = this.physicsWorld.createCollider(description);

        this.light = new THREE.SpotLight(
            0x9defff,
            20,
            size.y + 2,
            Math.atan(radius / size.y),
            0.5,
            1
        );
        this.defaultLightColor = this.light.color.clone();
        const lightTarget = new THREE.Object3D();
        this.light.position.y = size.y;
        this.light.target = lightTarget;
        this.add(this.light, lightTarget);
    }


    fixedUpdate(fixedDeltaTime)
    {
        if (this.isDisabled) return;
        if (this.pathPoints.length < 2 || this.speed <= 0) return;

        const target = this.pathPoints[this.pathIndex];
        this.pathDirection.subVectors(target, this.position);
        const distance = this.pathDirection.length();
        const movement = this.speed * fixedDeltaTime;

        if (movement >= distance)
        {
            this.position.copy(target);
            this.pathIndex = (this.pathIndex + 1) % this.pathPoints.length;
        }
        else
        {
            this.position.addScaledVector(this.pathDirection.normalize(), movement);
        }

        this.collider.setTranslation({
            x: this.position.x,
            y: this.position.y + 1.2,
            z: this.position.z
        });
    }


    update(deltaTime)
    {
        this.#updateHitTint(deltaTime);
        if (this.isDisabled) return;

        const isInside = this.physicsWorld.intersectionPair(this.collider, this.spiritCharacter.collider);

        if (isInside && !this.hasDamaged)
        {
            this.spiritCharacter.takeDamage(1);
            this.audioManager.playSfx(AudioId.SPIRIT_SPOTTED);
            this.#startHitTint();
        }
        this.hasDamaged = isInside;
    }


    onActivationChanged(isActivated)
    {
        const shouldDisable = isActivated;
        if (shouldDisable === this.isDisabled) return;

        this.isDisabled = shouldDisable;
        this.visible = !this.isDisabled;
        this.collider.setEnabled(!this.isDisabled);
        this.hasDamaged = false;
    }


    dispose()
    {
        this.physicsWorld.removeCollider(this.collider, true);
    }


    #createPath(path)
    {
        const start = this.position.clone();
        const points = path
            .split(';')
            .filter(Boolean)
            .map(point =>
            {
                const [x, z] = point.split(',').map(Number);
                return new THREE.Vector3(start.x + x, start.y, start.z + z);
            });

        return [start, ...points];
    }


    #startHitTint()
    {
        this.hitTintRemaining = HIT_TINT_DURATION;
        this.mesh.material.color.copy(HIT_COLOR);
        this.mesh.material.emissive.copy(HIT_COLOR);
        this.light.color.copy(HIT_COLOR);
    }


    #updateHitTint(deltaTime)
    {
        if (this.hitTintRemaining <= 0) return;

        this.hitTintRemaining = Math.max(0, this.hitTintRemaining - deltaTime);
        const progress = 1 - this.hitTintRemaining / HIT_TINT_DURATION;
        this.mesh.material.color.lerpColors(HIT_COLOR, this.defaultColor, progress);
        this.mesh.material.emissive.lerpColors(HIT_COLOR, this.defaultEmissive, progress);
        this.light.color.lerpColors(HIT_COLOR, this.defaultLightColor, progress);
    }
}
