import * as THREE from 'three';
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { ShaderPass } from "three/examples/jsm/Addons.js";

const DarkVioletVignetteShader = {
    uniforms: {
        tDiffuse: { value: null },
        radius: { value: 0.35 },
        softness: { value: 0.45 },
        intensity: { value: 0.0 }, //starts invisible
        vignetteColor: { value: new THREE.Color(0x581c87) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float radius;
        uniform float softness;
        uniform float intensity;
        uniform vec3 vignetteColor;
        varying vec2 vUv;

        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            float dist = distance(vUv, vec2(0.5));
            float vignetteFactor = smoothstep(radius, radius + softness, dist);
            vec3 finalColor = mix(texel.rgb, vignetteColor, vignetteFactor * intensity);
            gl_FragColor = vec4(finalColor, texel.a);
        }
    `
};

export class PostProcessingManager
{
    constructor(renderer)
    {
        this.renderer = renderer;
        this.composer = new EffectComposer(renderer);
        this.renderPass = null;

        //transition parameters
        this.isSpiritActive = false;
        this.currentTransition = 0.0; //0.0 represents body mode and 1.0 represents spirit mode
        this.transitionSpeed = 4.0;   //controls how quickly the modes blend

        //target values for spirit mode
		this.targetBloomStrength = 0.17;
        this.targetVignetteIntensity = 0.85;
        this.targetFogDensity = 0.035;

        //colors used during the transition
        this.bodyBgColor = new THREE.Color(0x101218);
        this.spiritBgColor = new THREE.Color(0x1e0b36);
        this.spiritFogColor = new THREE.Color(0x280e46);

        //the vignette pass stays active while intensity controls its strength
        this.vignettePass = new ShaderPass(DarkVioletVignetteShader);
        this.composer.addPass(this.vignettePass);

        // 2. Bloom Pass
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.0,  //starts disabled
            0.4,
            0.25
        );
        this.composer.addPass(this.bloomPass);
    }

    setSceneAndCamera(scene, camera)
    {
        this.currentScene = scene;
        
        if(!this.currentScene.fog)
        {
            this.currentScene.fog = new THREE.FogExp2(this.spiritFogColor, 0.0);
        }
        if (this.renderPass) {
            this.renderPass.scene = scene;
            this.renderPass.camera = camera;
        } else {
            this.renderPass = new RenderPass(scene, camera);
            this.composer.insertPass(this.renderPass, 0);
        }
    }

    setSpiritMode(active)
    {
        this.isSpiritActive = Boolean(active);
    }

    update(deltaTime = 0.016)
    {
        const target = this.isSpiritActive ? 1.0 : 0.0;

        const alpha = 1 - Math.exp(-this.transitionSpeed * deltaTime);
        this.currentTransition = THREE.MathUtils.lerp(this.currentTransition, target, alpha);

        //updates post-processing effects
        this.vignettePass.uniforms.intensity.value = this.currentTransition * this.targetVignetteIntensity;
        this.bloomPass.strength = this.currentTransition * this.targetBloomStrength;

        //smoothly interpolates fog and background color
        if (this.currentScene)
        {
            if (this.currentScene.fog) {
                this.currentScene.fog.density = this.currentTransition * this.targetFogDensity;
            }

            if (this.currentScene.background instanceof THREE.Color) {
                this.currentScene.background.lerpColors(
                    this.bodyBgColor,
                    this.spiritBgColor,
                    this.currentTransition
                );
            }
        }
    }

    render()
    {
        if (this.renderPass) {
            this.composer.render();
        }
    }

    resize(width, height)
    {
        this.composer.setSize(width, height);
    }
}
