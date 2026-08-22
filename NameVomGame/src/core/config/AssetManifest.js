import { AssetId } from "../constants/AssetId.js";

//############################################
//            ASSET CONFIGURATION
//############################################

//lists every asset that the asset manager loads during engine startup
export const AssetManifest = Object.freeze([
    {
        id: AssetId.GHOST,
        path: './assets/models/ghost.glb'
    }
]);
