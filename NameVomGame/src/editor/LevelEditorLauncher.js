import { SceneId } from '../core/constants/SceneId.js';

export const isLevelEditorEnabled = true;

export async function openLevelEditor(updateManager, sceneManager, assetManager)
{
    const { LevelEditorScene } = await import('./LevelEditorScene.js');

    sceneManager.registerScene(SceneId.LEVEL_EDITOR, () =>
        new LevelEditorScene(
            updateManager,
            sceneManager,
            assetManager
        ));

    sceneManager.changeScene(SceneId.LEVEL_EDITOR);
}
