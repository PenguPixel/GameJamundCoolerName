import * as THREE from 'three';
import { AssetId } from '../core/constants/AssetId.js';

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

        this.speed = 3;
        this.direction = new THREE.Vector3();
        this.#createModel();
    }

    #createModel()
    {
        this.model = this.assetManager.createInstance(AssetId.GHOST);

        const bounds = new THREE.Box3().setFromObject(this.model);
        const center = bounds.getCenter(new THREE.Vector3());

        this.model.position.set(-center.x, -bounds.min.y, -center.z);
        this.add(this.model);
    }
}
