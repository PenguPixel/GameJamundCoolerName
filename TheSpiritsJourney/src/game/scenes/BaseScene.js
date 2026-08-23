import * as THREE from 'three';

export class BaseScene
{
    constructor(updateManager, assetManager)
    {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.updateManager = updateManager;
        this.assetManager = assetManager;
        this.registeredUpdateables = new Set();
    }

    /**
     * Public Methods
     */

    add(object)
    {
        this.scene.add(object);

        const isUpdateable = typeof object.update === 'function' ||
            typeof object.fixedUpdate === 'function' ||
            typeof object.preUpdate === 'function' ||
            typeof object.lateUpdate === 'function';

        if (!isUpdateable) return;

        this.updateManager.add(object);
        this.registeredUpdateables.add(object);
    }


    remove(object)
    {
        this.scene.remove(object);
        this.updateManager.remove(object);
        this.registeredUpdateables.delete(object);
    }


    resize(width, height)
    {
        if (!this.camera) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }


    destroy()
    {
        for (const object of this.registeredUpdateables)
        {
            this.updateManager.remove(object);
        }

        this.registeredUpdateables.clear();
    }
}
