import * as THREE from 'three';

export class BaseRuntimeLevelObject extends THREE.Group
{
    constructor(physicsWorld, characterController, model, options = {}, audioManager = null)
    {
        super();

        this.physicsWorld = physicsWorld;
        this.characterController = characterController;
        this.model = model;
        this.options = options;
        this.audioManager = audioManager;

        this.position.copy(model.position);
        this.quaternion.copy(model.quaternion);
        this.scale.copy(model.scale);
        this.userData = { ...model.userData };

        model.position.set(0, 0, 0);
        model.quaternion.identity();
        model.scale.set(1, 1, 1);
        this.add(model);
    }
}
