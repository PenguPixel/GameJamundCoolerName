import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export class AssetManager
{

    //############################################
    //                CONSTRUCTOR
    //############################################

    /**
     * creates the loading infrastructure for a supplied asset manifest.
     * @param {Array<{id: string, path: string}>} manifest - assets to load during startup.
     */
    constructor(manifest)
    {
        this.manifest = manifest;
        this.assets = new Map();

        this.loadingManager = new THREE.LoadingManager();
        this.loader = new GLTFLoader(this.loadingManager);

        this.#setupLoadingManager();
    }



    //############################################
    //               PUBLIC METHODS
    //############################################

    /**
     * loads every manifest entry in parallel and stores the resulting gltf assets.
     * @returns {Promise<void>} resolves after every asset has loaded.
     * @throws {Error} when one or more assets cannot be loaded.
     */
    async loadAll()
    {
        const promises = this.manifest.map(asset => this.#loadGLB(asset));
        await Promise.all(promises);
    }


    /**
     * returns the original loaded gltf asset for an identifier.
     * @param {string} id - registered asset identifier.
     * @returns {object} original gltf result produced by the loader.
     * @throws {Error} when the requested asset has not been loaded.
     */
    getOriginal(id)
    {
        const asset = this.assets.get(id);
        if (!asset) throw new Error(`Asset "${id}" is not loaded!`);
        return asset;
    }


    /**
     * creates an independent scene clone while reusing the loaded animation clips.
     * @param {string} id - registered asset identifier.
     * @returns {THREE.Object3D} cloned scene root with an animations property.
     * @throws {Error} when the requested asset has not been loaded.
     */
    createInstance(id)
    {
        const asset = this.getOriginal(id);
        const instance = SkeletonUtils.clone(asset.scene);
        instance.animations = asset.animations;
        return instance;
    }


    /**
     * creates an instanced mesh from an asset that contains exactly one mesh.
     * @param {string} id - registered asset identifier.
     * @param {number} count - maximum number of rendered instances.
     * @returns {THREE.InstancedMesh} instanced mesh sharing the source geometry and material.
     * @throws {Error} when the asset contains zero or multiple meshes.
     */
    createInstancedMeshes(id, count)
    {
        const mesh = this.#getMesh(id);
        const instancedMesh = new THREE.InstancedMesh(mesh.geometry, mesh.material, count);
        instancedMesh.castShadow = mesh.castShadow;
        instancedMesh.receiveShadow = mesh.receiveShadow;

        return instancedMesh;
    }



    //############################################
    //              PRIVATE METHODS
    //############################################

    /**
     * loads one glb manifest entry and stores it by its identifier.
     * @param {{id: string, path: string}} asset - manifest entry to load.
     * @returns {Promise<void>} resolves after the asset has been stored.
     */
    async #loadGLB(asset)
    {
        const glb = await this.loader.loadAsync(asset.path);

        //enables every loaded mesh to participate in the shared shadow system by default
        glb.scene.traverse(object =>
        {
            if (!object.isMesh) return;

            object.castShadow = true;
            object.receiveShadow = true;
        });

        this.assets.set(asset.id, glb);
    }


    /**
     * configures loading progress and error logging callbacks.
     * @returns {void}
     */
    #setupLoadingManager()
    {
        this.loadingManager.onStart = (url, loaded, total) => 
        {
            console.info(`Started loading: ${url}`);
        } 

        this.loadingManager.onProgress = (url, loaded, total) =>
        {
            console.info(`Loading: ${loaded}/${total}`);
        }

        this.loadingManager.onLoad = () =>
        {
            console.info("All assets loaded!");
        }

        this.loadingManager.onError = (url) =>
        {
            console.error(`Error while loading: ${url}`);
        }
    }


    /**
     * extracts the only mesh from a loaded asset.
     * @param {string} id - registered asset identifier.
     * @returns {THREE.Mesh} the single mesh contained in the asset.
     * @throws {Error} when the asset contains zero or multiple meshes.
     */
    #getMesh(id)
    {
        const asset = this.getOriginal(id);
        let mesh = null;

        asset.scene.traverse((object) => 
        {
            if (!object.isMesh) return;
            if (mesh) throw new Error('More than one mesh in asset: ' + id);

            mesh = object;
        })

        if (!mesh) throw new Error('No mesh in asset found: ' + id);

        return mesh;
    }


}
