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
        id: AssetId.WORLD1,
        path: './assets/models/world1.glb'
    }
]);
