import RAPIER from "@dimforge/rapier3d-compat";
import { PhysicsCollisionGroup } from "../physics/PhysicsCollisionGroup";
import * as THREE from 'three';

export class DynamicObjects
{
    constructor(physicsWorld)
    {
        this.physicsWorld = physicsWorld;
    }

    createTrapDoor({ 
        position = { x:0, y: 0, z: 0 }, 
        size = { x: 2, y: 0.5, z:2}, 
        onTrigger = null 
    } = {})
    {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(size.x, size.y, size.z),
            new THREE.MeshStandardMaterial({color: 0xaaffaa})
        );
        mesh.position.set(position.x, position.y + 0.05, position.z);

        return {
            type: 'trapDoor',
            mesh
       }
    };
}