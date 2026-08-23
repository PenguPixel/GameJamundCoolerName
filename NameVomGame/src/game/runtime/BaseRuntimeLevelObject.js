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
        this.sources = new Set();
        this.activeSources = new Set();
        this.isActivated = false;

        this.position.copy(model.position);
        this.quaternion.copy(model.quaternion);
        this.scale.copy(model.scale);
        this.userData = { ...model.userData };

        model.position.set(0, 0, 0);
        model.quaternion.identity();
        model.scale.set(1, 1, 1);
        this.add(model);
    }


    registerSource(sourceId)
    {
        this.sources.add(sourceId);
        this.#updateActivationState();
    }


    setSourceActive(sourceId, isActive)
    {
        if (isActive) this.activeSources.add(sourceId);
        else this.activeSources.delete(sourceId);

        this.#updateActivationState();
    }


    onActivationChanged()
    {
    }


    #updateActivationState()
    {
        const isActivated = this.sources.size > 0 && this.activeSources.size === this.sources.size;
        if (isActivated === this.isActivated) return;

        this.isActivated = isActivated;
        this.onActivationChanged(this.isActivated);
    }
}
