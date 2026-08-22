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
        mesh = null
    } = {})
    {
        mesh = new THREE.Mesh(
            new THREE.BoxGeometry(size.x, size.y, size.z),
            new THREE.MeshStandardMaterial({color: 0xaaffaa})
        );
        mesh.position.set(position.x, position.y + 0.05, position.z);

        // Rigidbody
        const bodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y + 0.05, position.z)
        
        const trapDoorBody = this.physicsWorld.createRigidBody(bodyDesc);

        // Physical Collider
        const trapDoorDesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);

        const solidCollider = this.physicsWorld.createCollider(trapDoorDesc, trapDoorBody);

        // Proximity Sensor
        const trapDoorTriggerDesc = RAPIER.ColliderDesc.ball(2)
            .setSensor(true)
            .setCollisionGroups(PhysicsCollisionGroup.BODY_TRIGGER)
            .setActiveCollisionTypes(
                RAPIER.ActiveCollisionTypes.DEFAULT |
                RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED
            );
        
        const triggerCollider = this.physicsWorld.createCollider(trapDoorTriggerDesc, trapDoorBody);

        return {
            type: 'trapDoor',
            mesh,
            rigidBody: trapDoorBody,
            solidCollider,
            triggerCollider,
            isTriggered: false
        };
    }
}