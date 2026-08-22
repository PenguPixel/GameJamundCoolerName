import RAPIER from "@dimforge/rapier3d-compat";
import { PhysicsCollisionGroup } from "../physics/PhysicsCollisionGroup";
import * as THREE from 'three';

export class DynamicObjects
{
    constructor(physicsWorld)
    {
        this.physicsWorld = physicsWorld;
    }

    // Trap Door
    createTrapDoor({ 
        position = { x:0, y: 0, z: 0 }, 
        size = { x: 2, y: 0.5, z:2}, 
        mesh = null
    } = {})
    {
        mesh?.position.set(position.x, position.y + 0.05, position.z);

        // Rigidbody
        const bodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y + 0.05, position.z)
        
        const rigidBody = this.physicsWorld.createRigidBody(bodyDesc);

        // Physical Collider
        const physicalDesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);

        const solidCollider = this.physicsWorld.createCollider(physicalDesc, rigidBody);

        // Proximity Sensor
        const proximityDesc = RAPIER.ColliderDesc.ball(2)
            .setSensor(true)
            .setCollisionGroups(PhysicsCollisionGroup.BODY_TRIGGER)
            .setActiveCollisionTypes(
                RAPIER.ActiveCollisionTypes.DEFAULT |
                RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED
            );
        
        const triggerCollider = this.physicsWorld.createCollider(proximityDesc, rigidBody);

        return {
            type: 'trapDoor',
            mesh,
            rigidBody: rigidBody,
            solidCollider,
            triggerCollider,
            isTriggered: false
        };
    }

    // Spike Trap
    createSpikeTrap({ 
        position = { x:0, y: 0, z: 0 }, 
        size = { x: 2, y: 0.5, z:2}, 
        mesh = null
    } = {})
    {
        mesh?.position.set(position.x, position.y + 0.05, position.z);

        // Rigidbody
        const bodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y + 0.05, position.z)
        
        const rigidBody = this.physicsWorld.createRigidBody(bodyDesc);

        // Physical Collider
        const physicalDesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);

        const solidCollider = this.physicsWorld.createCollider(physicalDesc, rigidBody);

        // Proximity Sensor
        const proximityDesc = RAPIER.ColliderDesc.ball(2)
            .setSensor(true)
            .setCollisionGroups(PhysicsCollisionGroup.BODY_TRIGGER)
            .setActiveCollisionTypes(
                RAPIER.ActiveCollisionTypes.DEFAULT |
                RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED
            );
        
        const triggerCollider = this.physicsWorld.createCollider(proximityDesc, rigidBody);

        return {
            type: 'spikeTrap',
            mesh,
            rigidBody: rigidBody,
            solidCollider,
            triggerCollider,
            isTriggered: false
        };
    }

    // Spirit Starter
    createGhostPlatform({ 
        position = { x:0, y: 0, z: 0 }, 
        size = { x: 2, y: 0.5, z:2}, 
        mesh = null
    } = {})
    {
        mesh?.position.set(position.x, position.y + 0.05, position.z);

        // Rigidbody
        const bodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y + 0.05, position.z)
        
        const rigidBody = this.physicsWorld.createRigidBody(bodyDesc);

        // Physical Collider
        const physicalDesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);

        const solidCollider = this.physicsWorld.createCollider(physicalDesc, rigidBody);

        // Proximity Sensor
        const proximityDesc = RAPIER.ColliderDesc.ball(2)
            .setSensor(true)
            .setCollisionGroups(PhysicsCollisionGroup.SPIRIT_TRIGGER)
            .setActiveCollisionTypes(
                RAPIER.ActiveCollisionTypes.DEFAULT |
                RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED
            );
        
        const triggerCollider = this.physicsWorld.createCollider(proximityDesc, rigidBody);

        return {
            type: 'spiritPlatform',
            mesh,
            rigidBody: rigidBody,
            solidCollider,
            triggerCollider,
            isTriggered: false
        };
    }

    // Body Trigger Plate
    createTriggerPlate({ 
        position = { x:0, y: 0, z: 0 }, 
        size = { x: 2, y: 0.5, z:2}, 
        mesh = null
    } = {})
    {
        mesh?.position.set(position.x, position.y + 0.05, position.z);

        // Rigidbody
        const bodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y + 0.05, position.z)
        
        const rigidBody = this.physicsWorld.createRigidBody(bodyDesc);

        // Physical Collider
        const physicalDesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);

        const solidCollider = this.physicsWorld.createCollider(physicalDesc, rigidBody);

        // Proximity Sensor
        const proximityDesc = RAPIER.ColliderDesc.ball(2)
            .setSensor(true)
            .setCollisionGroups(PhysicsCollisionGroup.BODY_TRIGGER)
            .setActiveCollisionTypes(
                RAPIER.ActiveCollisionTypes.DEFAULT |
                RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED
            );
        
        const triggerCollider = this.physicsWorld.createCollider(proximityDesc, rigidBody);

        return {
            type: 'bodyTriggerPlate',
            mesh,
            rigidBody: rigidBody,
            solidCollider,
            triggerCollider,
            isTriggered: false
        };
    }

    // Spirit Trigger Plate
    createSpiritTriggerPlate({ 
        position = { x:0, y: 0, z: 0 }, 
        size = { x: 2, y: 0.5, z:2}, 
        mesh = null
    } = {})
    {
        mesh?.position.set(position.x, position.y + 0.05, position.z);

        // Rigidbody
        const bodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y + 0.05, position.z)
        
        const rigidBody = this.physicsWorld.createRigidBody(bodyDesc);

        // Physical Collider
        const physicalDesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
            .setCollisionGroups(PhysicsCollisionGroup.WORLD);

        const solidCollider = this.physicsWorld.createCollider(physicalDesc, rigidBody);

        // Proximity Sensor
        const proximityDesc = RAPIER.ColliderDesc.ball(2)
            .setSensor(true)
            .setCollisionGroups(PhysicsCollisionGroup.SPIRIT_TRIGGER)
            .setActiveCollisionTypes(
                RAPIER.ActiveCollisionTypes.DEFAULT |
                RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED
            );
        
        const triggerCollider = this.physicsWorld.createCollider(proximityDesc, rigidBody);

        return {
            type: 'spiritTriggerPlate',
            mesh,
            rigidBody: rigidBody,
            solidCollider,
            triggerCollider,
            isTriggered: false
        };
    }
}