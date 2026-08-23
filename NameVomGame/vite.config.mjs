import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ command, mode }) =>
{
    const includeLevelEditor = command === 'serve' || mode === 'editor';
    const launcherFile = includeLevelEditor
        ? './src/editor/LevelEditorLauncher.js'
        : './src/editor/LevelEditorDisabled.js';

    return {
        base: './', // Wichtig: Relativer Basispfad für itch.io
        resolve: {
            alias: {
                'virtual:level-editor-launcher': fileURLToPath(new URL(launcherFile, import.meta.url))
            }
        }
    };
});