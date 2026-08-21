import * as THREE from 'three';
import { InputAction } from "../core/constants/InputAction.js";

export class Player extends THREE.Group
{
    /**
     * Constructor
     */

    constructor(inputManager)
    {
        super();

        this.inputManager = inputManager;

        this.#createMesh();
    }

    #createMesh()
    {
        const geometry = new THREE.CylinderGeometry(3, 3, 3, 12, 2, false);
        const material = new THREE.MeshStandardMaterial( {color: 0xaa00ff});
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0.5, 0);
        this.add(mesh);
    }
}