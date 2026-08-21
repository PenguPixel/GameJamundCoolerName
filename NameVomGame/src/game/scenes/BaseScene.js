import * as THREE from 'three';

export class BaseScene
{
    constructor(updateManager)
    {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.updateManager = updateManager;
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
        this.camera?.aspect = width / height;
        this.camera?.updateProjectionMatrix();
    }
}