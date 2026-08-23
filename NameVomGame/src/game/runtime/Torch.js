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

        const bounds = this.#getLocalModelBounds();
        const lightPosition = bounds.getCenter(new THREE.Vector3());
        lightPosition.y = bounds.max.y;
        this.light.position.copy(lightPosition);
        this.add(this.light);
    }


    update(deltaTime)
    {
        this.flickerTime += deltaTime;
        this.light.intensity = LIGHT_INTENSITY
            + Math.sin(this.flickerTime * 11) * 1.5
            + Math.sin(this.flickerTime * 23) * 0.75;
    }


    #getLocalModelBounds()
    {
        const bounds = new THREE.Box3();
        const corner = new THREE.Vector3();
        const matrixToTorch = new THREE.Matrix4();

        this.updateWorldMatrix(true, true);
        const worldToTorch = this.matrixWorld.clone().invert();

        this.model.traverse(object =>
        {
            if (!object.isMesh || !object.geometry) return;

            object.geometry.computeBoundingBox();
            const meshBounds = object.geometry.boundingBox;
            if (!meshBounds) return;

            matrixToTorch.multiplyMatrices(worldToTorch, object.matrixWorld);

            for (const x of [meshBounds.min.x, meshBounds.max.x])
            {
                for (const y of [meshBounds.min.y, meshBounds.max.y])
                {
                    for (const z of [meshBounds.min.z, meshBounds.max.z])
                    {
                        corner.set(x, y, z).applyMatrix4(matrixToTorch);
                        bounds.expandByPoint(corner);
                    }
                }
            }
        });

        return bounds;
    }
}
