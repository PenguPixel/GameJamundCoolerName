export class SceneManager
{

    constructor()
    {
        this.scenes = new Map();
        this.activeScene = null;
        this.activeSceneId = null;
    }

    update(deltaTime)
    {
        this.activeScene?.update?.(deltaTime);
    }

    registerScene(id, sceneFunction)
    {
        this.scenes.set(id, sceneFunction);
    }

    changeScene(id)
    {
        const sceneFunction = this.scenes.get(id);

        if (this.activeScene) this.activeScene.exit?.();

        this.activeScene = sceneFunction();
        this.activeSceneId = id;

        this.activeScene.enter();
    }

    render(renderer)
    {
        if (!this.activeScene) return;
        renderer.render(this.activeScene.scene, this.activeScene.camera);
    }

    resize(width, height)
    {
        this.activeScene?.resize?.(width, height);
    }

}