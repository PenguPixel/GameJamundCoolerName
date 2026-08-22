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
        src: ['./assets/audio/music/music_main_title_theme_loop.mp3'],
        volume: 0.1,
        loop: true
    },
    {
        id: AudioId.TITLE_AMBIENT,
        type: AudioType.AMBIENT,
        src: ['./assets/audio/ambient/game loop pad.mp3'],
        volume: 0.1,
        loop: true
    },
    {
        id: AudioId.BODY_LEVEL_MUSIC,
        type: AudioType.MUSIC,
        src: ['./assets/audio/music/music_level_loop.mp3'],
        volume: 0.5,
        loop: true
    },
    {
        id: AudioId.BODY_LEVEL_AMBIENT,
        type: AudioType.AMBIENT,
        src: ['./assets/audio/ambient/ambient-loop-bells and wind.mp3'],
        volume: 0.4,
        loop: true
    },
    {
        id: AudioId.MENU_HOVER,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/ui/sfx_ui-menu-hover.mp3'],
        volume: 1,
        loop: false
    },
    {
        id: AudioId.MENU_CLICK,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/ui/sfx_ui-menu-click.mp3'],
        volume: 1,
        loop: false
    },
    {
        id: AudioId.ITEM_PICKUP,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/sfx_item-pickup-soft-1.mp3'],
        volume: 0.8,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_1,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/footsteps/sfx_footsteps_sand 1.mp3'],
        volume: 0.6,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_2,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/footsteps/sfx_footsteps_sand 2.mp3'],
        volume: 0.7,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_3,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/footsteps/sfx_footsteps_sand 3.mp3'],
        volume: 0.65,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_4,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/footsteps/sfx_footsteps_sand 4.mp3'],
        volume: 0.6,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_5,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/footsteps/sfx_footsteps_sand 5.mp3'],
        volume: 0.7,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_6,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/footsteps/sfx_footsteps_sand 6.mp3'],
        volume: 0.6,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_7,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/footsteps/sfx_footsteps_sand 7.mp3'],
        volume: 0.7,
        loop: false
    },
    {
        id: AudioId.FOOTSTEP_SAND_8,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/footsteps/sfx_footsteps_sand 8.mp3'],
        volume: 0.6,
        loop: false
    },
    {
        id: AudioId.CHAR_SWAP,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/sfx_character_switch-sound.mp3'],
        volume: 0.8,
        loop: false
    },
    {
        id: AudioId.DOOR_PRESSURE_PLATE,
        type: AudioType.SFX,
        src: ['./assets/audio/sfx/doors/sfx_door_pressure-plate_ activate.mp3'],
        volume: 0.8,
        loop: false
    }
]);
