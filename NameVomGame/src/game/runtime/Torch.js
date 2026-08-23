import * as THREE from 'three';
import { BaseRuntimeLevelObject } from './BaseRuntimeLevelObject.js';

const LIGHT_COLOR = 0x765a7c;
const LIGHT_INTENSITY = 18;

export class Torch extends BaseRuntimeLevelObject
{
    constructor(physicsWorld, characterController, model, options = {})
    {
        super(physicsWorld, characterController, model, options);

        this.flickerTime = Math.random() * Math.PI * 2;
        this.light = new THREE.PointLight(LIGHT_COLOR, LIGHT_INTENSITY, 7, 2);

        this.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3().setFromObject(this.model);
        const lightPosition = bounds.getCenter(new THREE.Vector3());
        lightPosition.y = bounds.max.y;
        this.light.position.copy(this.worldToLocal(lightPosition));
        this.add(this.light);
    }


    update(deltaTime)
    {
        this.flickerTime += deltaTime;
        this.light.intensity = LIGHT_INTENSITY
            + Math.sin(this.flickerTime * 11) * 1.5
            + Math.sin(this.flickerTime * 23) * 0.75;
    }
}
