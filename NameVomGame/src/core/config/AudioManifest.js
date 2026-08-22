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
        src: ['./assets/audio/music/main title theme-loop.mp3'],
        volume: 0.1,
        loop: true
    },
    {
        id: AudioId.TITLE_AMBIENT,
        type: AudioType.AMBIENT,
        src: ['./assets/audio/ambient/game loop pad.wav'],
        volume: 0.1,
        loop: true
    },
    {
        id: AudioId.BODY_LEVEL_MUSIC,
        type: AudioType.MUSIC,
        src: ['./assets/audio/music/End-credits-Loop-mp3.mp3'],
        volume: 0.5,
        loop: true
    },
    {
        id: AudioId.BODY_LEVEL_AMBIENT,
        type: AudioType.AMBIENT,
        src: ['./assets/audio/ambient/Ambient-loop-bells and wind.mp3'],
        volume: 0.4,
        loop: true
    },
    {
        id: AudioId.MENU_HOVER,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/menu-hover.wav'],
        volume: 1,
        loop: false
    },
    {
        id: AudioId.MENU_CLICK,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/menu-click sound.wav'],
        volume: 1,
        loop: false
    },
    {
        id: AudioId.ITEM_PICKUP,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/item-pickup.wav'],
        volume: 0.8,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_1,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/Footsteps/FootstepsSand 1.mp3'],
        volume: 0.6,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_2,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/Footsteps/FootstepsSand 2.mp3'],
        volume: 0.7,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_3,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/Footsteps/FootstepsSand 3.mp3'],
        volume: 0.65,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_4,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/Footsteps/FootstepsSand 4.mp3'],
        volume: 0.6,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_5,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/Footsteps/FootstepsSand 5.mp3'],
        volume: 0.7,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_6,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/Footsteps/FootstepsSand 6.mp3'],
        volume: 0.6,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_7,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/Footsteps/FootstepsSand 7.mp3'],
        volume: 0.7,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_8,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/Footsteps/FootstepsSand 8.mp3'],
        volume: 0.6,
        loop: false
    },
    {
        id: AudioId.CHAR_SWAP,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/character switch-sound.mp3'],
        volume: 0.8,
        loop: false
    },
    {
        id: AudioId.DOOR_PRESSURE_PLATE,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/door pressure-plate activate.mp3'],
        volume: 0.8,
        loop: false
    }
]);
