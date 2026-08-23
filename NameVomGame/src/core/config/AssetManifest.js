import { AssetId } from "../constants/AssetId.js";

//############################################
//            ASSET CONFIGURATION
//############################################

//lists every asset that the asset manager loads during engine startup
export const AssetManifest = Object.freeze([
    {
        id: AssetId.CHEST,
        path: './assets/models/chest_03.glb'
    },
    {
        id: AssetId.GHOST,
        path: './assets/models/ghost.glb'
    },
    {
        id: AssetId.CHARACTER,
        path: './assets/models/character.glb'
    },
    {
        id: AssetId.CHARACTER_2,
        path: './assets/models/character_2.glb'
    },
    {
        id: AssetId.WORLD1,
        path: './assets/models/world1.glb'
    },
    {
        id: AssetId.WALL,
        path: './assets/models/wall.glb'
    },
    {
        id: AssetId.WALL_ONE_SIDE_CLOSED,
        path: './assets/models/wall_one_side_closed.glb'
    },
    {
        id: AssetId.WALL_CORNER,
        path: './assets/models/wall_corner.glb'
    },
    {
        id: AssetId.BARS,
        path: './assets/models/bars.glb'
    },
    {
        id: AssetId.DOOR,
        path: './assets/models/door.glb'
    },
    {
        id: AssetId.STONE,
        path: './assets/models/stone.glb'
    },
    {
        id: AssetId.CACTUS,
        path: './assets/models/cactus.glb'
    },
    {
        id: AssetId.CACTUS_FLOWER,
        path: './assets/models/cactus_flower.glb'
    },
    {
        id: AssetId.PALM_TREE,
        path: './assets/models/palmtree.glb'
    },
    {
        id: AssetId.TORCH,
        path: './assets/models/torch.glb'
    },
    {
        id: AssetId.SPIKES,
        path: './assets/models/spikes.glb'
    },
    {
        id: AssetId.BUTTON,
        path: './assets/models/button.glb'
    },
    {
        id: AssetId.BUTTON_SPIRIT,
        path: './assets/models/button_2.glb'
    },
    {
        id: AssetId.TRAPDOOR,
        path: './assets/models/trapdoor.glb'
    },
    {
        id: AssetId.PLATFORM,
        path: './assets/models/platform.glb'
    },
    {
        id: AssetId.PLATFORM_END,
        path: './assets/models/platform_2.glb'
    }
]);
