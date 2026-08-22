import { AudioId } from "../constants/AudioId.js";
import { AudioType } from "../constants/AudioType.js";

//############################################
//            AUDIO CONFIGURATION
//############################################

//lists every audio file that the audio manager loads during engine startup
export const AudioManifest = Object.freeze([
    {
        id: AudioId.TITLE_MUSIC,
        type: AudioType.MUSIC,
        src: ['./assets/audio/music/music test.wav'],
        volume: 0.5,
        loop: true
    },
    {
        id: AudioId.TITLE_AMBIENT,
        type: AudioType.AMBIENT,
        src: ['./assets/audio/ambient/game loop pad.wav'],
        volume: 0.5,
        loop: true
    },
    {
        id: AudioId.MENU_HOVER,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/menu-hover.wav'],
        volume: 0.35,
        loop: false
    },
    {
        id: AudioId.MENU_CLICK,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/menu-click sound.wav'],
        volume: 0.6,
        loop: false
    },
    {
        id: AudioId.ITEM_PICKUP,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/item-pickup.wav'],
        volume: 0.8,
        loop: false
    }
]);
