import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';
import { BaseRuntimeLevelObject } from './BaseRuntimeLevelObject.js';

export class SpiritLightCone extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {})
    {
        super(physicsWorld, characterController, model, options);

        this.spiritCharacter = characterController.spiritCharacter;
        this.hasDamaged = false;
        this.speed = options.speed ?? 2;
        this.pathDirection = new THREE.Vector3();
        this.pathPoints = this.#createPath(options.path ?? '5,0');
        this.pathIndex = this.pathPoints.length > 1 ? 1 : 0;

        const mesh = this.model.getObjectByProperty('isMesh', true);
        mesh.castShadow = false;
        mesh.receiveShadow = false;

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

        const light = new THREE.SpotLight(
            0x9defff,
            20,
            size.y + 2,
            Math.atan(radius / size.y),
            0.5,
            1
        );
        const lightTarget = new THREE.Object3D();
        light.position.y = size.y;
        light.target = lightTarget;
        this.add(light, lightTarget);
    }


    fixedUpdate(fixedDeltaTime)
    {
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


    update()
    {
        const isInside = this.physicsWorld.intersectionPair(this.collider, this.spiritCharacter.collider);

        if (isInside && !this.hasDamaged) this.spiritCharacter.takeDamage(1);
        this.hasDamaged = isInside;
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
}
