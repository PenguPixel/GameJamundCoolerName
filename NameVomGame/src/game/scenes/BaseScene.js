import * as THREE from 'three';

export class BaseScene
{
    constructor(updateManager, assetManager)
    {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.updateManager = updateManager;
        this.assetManager = assetManager;
    }

    /**
     * Public Methods
     */

    add(object)
    {
        this.scene.add(object);

        if (typeof object.update === 'function' || 
            typeof object.fixedUpdate === 'function' ||
            typeof object.preUpdate === 'function' ||
            typeof object.lateUpdate === 'function' )
            {
                this.updateManager.add(object);
            }
    }


    resize(width, height)
    {
        if (!this.camera) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
}