import { Howl, Howler } from 'howler';

export class AudioManager
{

    //############################################
    //                CONSTRUCTOR
    //############################################

    /**
     * creates audio caches, playback channels, and volume controls for a supplied manifest.
     * @param {Array<{id: string, type: 'music'|'ambient'|'sfx', src: string[], volume?: number, loop?: boolean}>} manifest - audio entries loaded during startup.
     */
    constructor(manifest)
    {
        //stores configuration and loaded howl instances

        this.manifest = manifest;
        this.sounds = new Map();
        this.types = new Map();

        //tracks music and ambient independently so both channels can play together

        this.currentMusic = null;
        this.currentMusicId = null;
        this.currentMusicPlaybackId = null;

        this.currentAmbient = null;
        this.currentAmbientId = null;
        this.currentAmbientPlaybackId = null;

        //stores the global and channel-specific volume multipliers

        this.masterVolume = 1;
        this.musicVolume = 1;
        this.ambientVolume = 1;
        this.sfxVolume = 1;
    }



    //############################################
    //               PUBLIC METHODS
    //############################################

    /**
     * loads every audio entry from the manifest in parallel.
     * @param {Function|null} [onItemLoaded=null] - called whenever one manifest sound finishes loading.
     * @returns {Promise<void>} resolves after every registered sound has loaded.
     * @throws {Error} when one or more audio files cannot be loaded.
     */
    async loadAll(onItemLoaded = null)
    {
        const promises = this.manifest.map(async config =>
        {
            await this.#load(config);
            onItemLoaded?.();
        });
        await Promise.all(promises);
    }


    /**
     * plays a loaded sound effect and allows overlapping playback instances.
     * @param {string} id - registered identifier of an sfx entry.
     * @returns {number} howler playback identifier for the new sound instance.
     * @throws {Error} when the audio is missing or is not registered as sfx.
     */
    playSfx(id)
    {
        const sound = this.#get(id);

        if (this.types.get(id) !== 'sfx') throw new Error ('Audio is not SFX: ' + id);

        return sound.play();
    }


    /**
     * stops one playback instance of a loaded sound effect.
     * @param {string} id - registered identifier of an sfx entry.
     * @param {number} playbackId - howler playback identifier returned by playsfx.
     * @returns {void}
     * @throws {Error} when the audio is missing or is not registered as sfx.
     */
    stopSfx(id, playbackId)
    {
        const sound = this.#get(id);

        if (this.types.get(id) !== 'sfx') throw new Error('Audio is not SFX: ' + id);

        sound.stop(playbackId);
    }


    /**
     * pauses one playback instance of a loaded sound effect.
     * @param {string} id - registered identifier of an sfx entry.
     * @param {number} playbackId - howler playback identifier returned by playsfx.
     * @returns {void}
     * @throws {Error} when the audio is missing or is not registered as sfx.
     */
    pauseSfx(id, playbackId)
    {
        const sound = this.#get(id);

        if (this.types.get(id) !== 'sfx') throw new Error('Audio is not SFX: ' + id);

        sound.pause(playbackId);
    }


    /**
     * resumes one paused playback instance of a loaded sound effect.
     * @param {string} id - registered identifier of an sfx entry.
     * @param {number} playbackId - howler playback identifier returned by playsfx.
     * @returns {void}
     * @throws {Error} when the audio is missing or is not registered as sfx.
     */
    resumeSfx(id, playbackId)
    {
        const sound = this.#get(id);

        if (this.types.get(id) !== 'sfx') throw new Error('Audio is not SFX: ' + id);

        sound.play(playbackId);
    }


    /**
     * starts a music track or resumes its paused playback instance.
     * @param {string} id - registered identifier of a music entry.
     * @returns {number|undefined} howler playback identifier, or undefined when the track is already playing.
     * @throws {Error} when the audio is missing or is not registered as music.
     */
    playMusic(id)
    {
        const sound = this.#get(id);
        
        if (this.types.get(id) !== 'music') throw new Error ('Audio is not music: ' + id);
        if (this.currentMusicId === id && this.currentMusicPlaybackId !== null)
        {
            if (sound.playing(this.currentMusicPlaybackId)) return;
            return sound.play(this.currentMusicPlaybackId);
        }

        this.stopMusic();

        this.currentMusic = sound;
        this.currentMusicId = id;
        this.currentMusicPlaybackId = sound.play();

        return this.currentMusicPlaybackId;
    }


    /**
     * crossfades from the active music track to another music track.
     * @param {string} id - registered identifier of the target music entry.
     * @param {number} [duration=1000] - fade duration in milliseconds.
     * @returns {void}
     * @throws {Error} when the audio is missing or is not registered as music.
     */
    fadeMusicTo(id, duration = 1000)
    {
        const nextMusic = this.#get(id);
        const previousMusic = this.currentMusic;

        if (this.types.get(id) !== 'music') throw new Error('Audio is not music: ' + id);
        if (this.currentMusicId === id)
        {
            this.playMusic(id);
            return;
        }

        this.currentMusic = nextMusic;
        this.currentMusicId = id;

        const config = this.manifest.find(item => item.id === id);
        const targetVolume = (config?.volume ?? 1) * this.musicVolume;

        //starts the incoming track silently and fades it to its configured volume

        nextMusic.volume(0);
        this.currentMusicPlaybackId = nextMusic.play();
        nextMusic.fade(0, targetVolume, duration, this.currentMusicPlaybackId);

        if (previousMusic)
        {
            //fades out and stops the previously active track

            const currentVolume = previousMusic.volume();
            previousMusic.fade(currentVolume, 0, duration);
            previousMusic.once('fade', () => previousMusic.stop());
        }
    }


    /**
     * stops the currently active music track.
     * @returns {void}
     */
    stopMusic()
    {
        if (!this.currentMusic) return;

        this.currentMusic.stop(this.currentMusicPlaybackId);
        this.currentMusic = null;
        this.currentMusicId = null;
        this.currentMusicPlaybackId = null;
    }


    /**
     * pauses the active music while preserving its playback position.
     * @returns {void}
     */
    pauseMusic()
    {
        if (!this.currentMusic || this.currentMusicPlaybackId === null) return;
        this.currentMusic.pause(this.currentMusicPlaybackId);
    }


    /**
     * starts an ambient track or resumes its paused playback instance.
     * @param {string} id - registered identifier of an ambient entry.
     * @returns {number|undefined} howler playback identifier, or undefined when the track is already playing.
     * @throws {Error} when the audio is missing or is not registered as ambient.
     */
    playAmbient(id)
    {
        const sound = this.#get(id);

        if (this.types.get(id) !== 'ambient') throw new Error ('Audio is not ambient: ' + id);
        if (this.currentAmbientId === id && this.currentAmbientPlaybackId !== null)
        {
            if (sound.playing(this.currentAmbientPlaybackId)) return;
            return sound.play(this.currentAmbientPlaybackId);
        }

        this.stopAmbient();

        this.currentAmbient = sound;
        this.currentAmbientId = id;
        this.currentAmbientPlaybackId = sound.play();

        return this.currentAmbientPlaybackId;
    }


    /**
     * crossfades from the active ambient track to another ambient track.
     * @param {string} id - registered identifier of the target ambient entry.
     * @param {number} [duration=1000] - fade duration in milliseconds.
     * @returns {void}
     * @throws {Error} when the audio is missing or is not registered as ambient.
     */
    fadeAmbientTo(id, duration = 1000)
    {
        const nextAmbient = this.#get(id);
        const previousAmbient = this.currentAmbient;

        if (this.types.get(id) !== 'ambient') throw new Error('Audio is not ambient: ' + id);
        if (this.currentAmbientId === id)
        {
            this.playAmbient(id);
            return;
        }

        this.currentAmbient = nextAmbient;
        this.currentAmbientId = id;

        const config = this.manifest.find(item => item.id === id);
        const targetVolume = (config?.volume ?? 1) * this.ambientVolume;

        //starts the incoming track silently and fades it to its configured volume

        nextAmbient.volume(0);
        this.currentAmbientPlaybackId = nextAmbient.play();
        nextAmbient.fade(0, targetVolume, duration, this.currentAmbientPlaybackId);

        if (previousAmbient)
        {
            //fades out and stops the previously active track

            const currentVolume = previousAmbient.volume();
            previousAmbient.fade(currentVolume, 0, duration);
            previousAmbient.once('fade', () => previousAmbient.stop());
        }
    }


    /**
     * stops the currently active ambient track.
     * @returns {void}
     */
    stopAmbient()
    {
        if (!this.currentAmbient) return;

        this.currentAmbient.stop(this.currentAmbientPlaybackId);
        this.currentAmbient = null;
        this.currentAmbientId = null;
        this.currentAmbientPlaybackId = null;
    }


    /**
     * pauses the active ambience while preserving its playback position.
     * @returns {void}
     */
    pauseAmbient()
    {
        if (!this.currentAmbient || this.currentAmbientPlaybackId === null) return;
        this.currentAmbient.pause(this.currentAmbientPlaybackId);
    }


    /**
     * changes howler's global volume multiplier for every audio channel.
     * @param {number} volume - requested volume between zero and one.
     * @returns {void}
     */
    setMasterVolume(volume)
    {
        this.masterVolume = this.#clampVolume(volume);
        Howler.volume(this.masterVolume);
    }


    /**
     * changes the volume multiplier for every loaded music entry.
     * @param {number} volume - requested volume between zero and one.
     * @returns {void}
     */
    setMusicVolume(volume)
    {
        this.musicVolume = this.#clampVolume(volume);
        this.#updateTypeVolumes('music');
    }


    /**
     * changes the volume multiplier for every loaded ambient entry.
     * @param {number} volume - requested volume between zero and one.
     * @returns {void}
     */
    setAmbientVolume(volume)
    {
        this.ambientVolume = this.#clampVolume(volume);
        this.#updateTypeVolumes('ambient');
    }


    /**
     * changes the volume multiplier for every loaded sound effect.
     * @param {number} volume - requested volume between zero and one.
     * @returns {void}
     */
    setSfxVolume(volume)
    {
        this.sfxVolume = this.#clampVolume(volume);
        this.#updateTypeVolumes('sfx');
    }


    /**
     * mutes or unmutes every sound managed by howler.
     * @param {boolean} muted - whether global audio output should be muted.
     * @returns {void}
     */
    setMuted(muted)
    {
        Howler.mute(muted);
    }




    //############################################
    //              PRIVATE METHODS
    //############################################

    /**
     * returns a loaded howl instance for an identifier.
     * @param {string} id - registered audio identifier.
     * @returns {Howl} loaded howl instance.
     * @throws {Error} when the requested audio has not been loaded.
     */
    #get(id)
    {
        const sound = this.sounds.get(id);
        if (!sound) throw new Error('Audio is not loaded: ' + id);
        return sound;
    }


    /**
     * creates and loads one howl instance from a manifest entry.
     * @param {{id: string, type: 'music'|'ambient'|'sfx', src: string[], volume?: number, loop?: boolean}} config - audio entry to load.
     * @returns {Promise<void>} resolves after the sound has loaded.
     */
    #load(config)
    {
        return new Promise((resolve, reject) =>
            {
                const sound = new Howl({
                    src: config.src,
                    loop: config.loop ?? false,
                    volume: config.volume ?? 1,
                    preload: false
                })

                sound.once('load', () => resolve());

                sound.once('loaderror', (soundId, error) =>
                    reject(new Error(`Failed to load audio ${config.id}: ` + error)));

                this.sounds.set(config.id, sound);
                this.types.set(config.id, config.type);
                sound.load();
            });
    }


    /**
     * reapplies the configured base volume and current channel multiplier.
     * @param {'music'|'ambient'|'sfx'} type - audio channel to update.
     * @returns {void}
     */
    #updateTypeVolumes(type)
    {
        for (const config of this.manifest)
        {
            if (config.type != type) continue;

            const sound = this.sounds.get(config.id);
            if (!sound) continue;

            const baseVolume = config.volume ?? 1;
            const typeVolume = type === 'music'
                ? this.musicVolume
                : type === 'ambient'
                    ? this.ambientVolume
                    : this.sfxVolume;

            sound.volume(baseVolume * typeVolume);
        }
    }


    /**
     * limits a volume value to howler's supported zero-to-one range.
     * @param {number} volume - requested volume value.
     * @returns {number} clamped volume value.
     */
    #clampVolume(volume)
    {
        return Math.min(Math.max(volume, 0), 1);
    }

}
