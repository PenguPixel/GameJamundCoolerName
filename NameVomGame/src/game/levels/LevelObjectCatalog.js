import { AssetId } from '../../core/constants/AssetId.js';
import { PhysicsCollisionGroup } from '../physics/PhysicsCollisionGroup.js';

export const LevelObjectType = Object.freeze({
    WALL: 'wall',
    WALL_ONE_SIDE_CLOSED: 'wallOneSideClosed',
    WALL_CORNER: 'wallCorner',
    BARS: 'bars',
    DOOR: 'door',
    STONE: 'stone',
    CACTUS_FLOWER: 'cactusFlower',
    SPIKE_TRAP: 'spikeTrap',
    CHEST: 'chest',
    WORLD_TILE_5X5: 'worldTile',
    WORLD_TILE_1X1: 'worldTile1x1'
});

//keeps editor labels and runtime creation defaults in one shared place
export const LevelObjectCatalog = Object.freeze([
    Object.freeze({
        type: LevelObjectType.WALL,
        label: 'wall',
        assetId: AssetId.WALL,
        defaultScale: [1, 1, 1],
        defaultRotation: [0, 0, 0],
        centerOnGround: true,
        staticBatch: true,
        physicsCollisionGroup: PhysicsCollisionGroup.WORLD,
        placementY: 0
    }),
    Object.freeze({
        type: LevelObjectType.WALL_CORNER,
        label: 'wall corner',
        assetId: AssetId.WALL_CORNER,
        defaultScale: [1, 1, 1],
        defaultRotation: [0, 0, 0],
        centerOnGround: true,
        staticBatch: true,
        physicsCollisionGroup: PhysicsCollisionGroup.WORLD,
        placementY: 0
    }),
    Object.freeze({
        type: LevelObjectType.BARS,
        label: 'bars',
        assetId: AssetId.BARS,
        defaultScale: [1, 1, 1],
        defaultRotation: [0, 0, 0],
        centerOnGround: true,
        placementOffset: [0.5, 0, 0],
        staticBatch: true,
        physicsCollisionGroup: PhysicsCollisionGroup.SPIRIT_PASSABLE,
        placementY: 0
    }),
    Object.freeze({
        type: LevelObjectType.DOOR,
        label: 'door',
        assetId: AssetId.DOOR,
        defaultScale: [1, 1, 1],
        defaultRotation: [0, 0, 0],
        centerOnGround: true,
        physicsCollisionGroup: PhysicsCollisionGroup.WORLD,
        placementY: 0
    }),
    Object.freeze({
        type: LevelObjectType.STONE,
        label: 'stone',
        assetId: AssetId.STONE,
        defaultScale: [1, 1, 1],
        defaultRotation: [0, 0, 0],
        centerOnGround: true,
        staticBatch: true,
        physicsCollisionGroup: PhysicsCollisionGroup.WORLD,
        placementY: 0
    }),
    Object.freeze({
        type: LevelObjectType.CACTUS_FLOWER,
        label: 'cactus flower',
        assetId: AssetId.CACTUS_FLOWER,
        defaultScale: [1, 1, 1],
        defaultRotation: [0, 0, 0],
        centerOnGround: true,
        staticBatch: true,
        placementY: 0
    }),
    Object.freeze({
        type: LevelObjectType.SPIKE_TRAP,
        label: 'spike trap',
        assetId: AssetId.SPIKES,
        defaultScale: [1, 1, 1],
        defaultRotation: [0, 0, 0],
        surfaceMeshName: 'plate',
        placementY: 0
    }),
    Object.freeze({
        type: LevelObjectType.WALL_ONE_SIDE_CLOSED,
        label: 'wall one side closed',
        assetId: AssetId.WALL_ONE_SIDE_CLOSED,
        defaultScale: [1, 1, 1],
        defaultRotation: [0, 0, 0],
        centerOnGround: true,
        staticBatch: true,
        physicsCollisionGroup: PhysicsCollisionGroup.WORLD,
        placementY: 0
    }),
    Object.freeze({
        type: LevelObjectType.CHEST,
        label: 'chest',
        assetId: AssetId.CHEST,
        defaultScale: [100, 100, 100],
        defaultRotation: [0, 0, 0],
        placementY: 0
    }),
    Object.freeze({
        type: LevelObjectType.WORLD_TILE_5X5,
        label: 'world tile 5x5',
        assetId: AssetId.WORLD1,
        defaultScale: [0.05, 0.05, 0.05],
        defaultRotation: [0, 0, 0],
        textureRepeat: [5, 5],
        staticBatch: true,
        colliderHeight: 0.2,
        physicsCollisionGroup: PhysicsCollisionGroup.WORLD,
        placementY: 0
    }),
    Object.freeze({
        type: LevelObjectType.WORLD_TILE_1X1,
        label: 'world tile 1x1',
        assetId: AssetId.WORLD1,
        defaultScale: [0.01, 0.01, 0.01],
        defaultRotation: [0, 0, 0],
        textureRepeat: [1, 1],
        staticBatch: true,
        colliderHeight: 0.2,
        physicsCollisionGroup: PhysicsCollisionGroup.WORLD,
        placementY: 0
    })
]);

export function getLevelObjectDefinition(type)
{
    return LevelObjectCatalog.find(definition => definition.type === type) ?? null;
}
