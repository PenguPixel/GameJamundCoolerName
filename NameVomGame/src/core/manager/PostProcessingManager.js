import * as THREE from 'three';
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";

export class PostProcessingManager
{
    constructor( renderer)
    {
        this.renderer = renderer;
        this.composer = new EffectComposer(renderer);
        this.renderPass = null;

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2,    // strength
            0.4,    // radius
            0.1    // threshold
        );

        this.bloomPass.enabled = false;
        this.composer.addPass(this.bloomPass);

    }

    setSceneAndCamera(scene, camera)
    {
        if(this.renderPass)
        {
            this.renderPass.scene = scene;
            this.renderPass.camera = camera;
        }
        else
        {
            this.renderPass = new RenderPass(scene, camera);
            this.composer.insertPass(this.renderPass, 0);
        }
    }

    setSpiritMode(active)
    {
        this.bloomPass.enabled = Boolean(active);

        if(this._lastActive !== active)
        {
            this._lastActive = active;
            console.log(`Render SpiritMode: ${active ? 'ACTIVE' : 'INACTIVE'}`);
        }
       
    }

    render()
    {
        if(this.renderPass)
        {
            this.composer.render();
        }
    }

    resize(width, height)
    {
        this.composer.setSize(width, height);
    }
}