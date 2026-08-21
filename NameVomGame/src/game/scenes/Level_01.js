import * as THREE from 'three';


export class Level_01
{
    constructor()
    {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60,  window.innerWidth / window.innerHeight);
    }

    enter()
    {
        console.log('ENTER LEVEL 01');

        this.camera.position.set(0, 5, 8);
        this.camera.lookAt(0, 0, 0);

        const grid = new THREE.GridHelper(20, 20);
        this.scene.add(grid);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);
    }

    update(deltaTime)
    {

    }

    exit()
    {
        console.log('EXIT LEVEL 01');
    }

    resize(width, height)
    {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
}