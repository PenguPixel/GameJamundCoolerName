import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { SceneId } from '../core/constants/SceneId.js';
import { BaseScene } from '../game/scenes/BaseScene.js';
import { createLevelData, validateLevelData } from '../game/levels/LevelData.js';
import { LevelObjectCatalog, getLevelObjectDefinition } from '../game/levels/LevelObjectCatalog.js';
import { LevelObjectFactory } from '../game/levels/LevelObjectFactory.js';
import editorOverlay from './LevelEditorOverlay.html?raw';
import './LevelEditor.css';

export class LevelEditorScene extends BaseScene
{
    constructor(updateManager, sceneManager, assetManager)
    {
        super(updateManager, assetManager);

        this.sceneManager = sceneManager;
        this.canvas = document.querySelector('#canvas-threeJs');
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
        this.camera.position.set(10, 12, 10);

        this.objectFactory = new LevelObjectFactory(this.assetManager);
        this.levelObjects = [];
        this.editableRoot = new THREE.Group();
        this.editableRoot.name = 'editor-level-objects';
        this.scene.add(this.editableRoot);

        this.gridSize = 1;
        this.nextObjectId = 1;
        this.placementType = null;
        this.placementPreview = null;
        this.placementRotationY = 0;
        this.placementIsBlocked = false;
        this.selectedObject = null;
        this.ignoreNextCanvasClick = false;
        this.overlay = null;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.placementOffset = new THREE.Vector3();

        this.#setupScene();
        this.#setupControls();

        this.handleCanvasClick = event => this.#handleCanvasClick(event);
        this.handlePointerMove = event => this.#handlePointerMove(event);
        this.handlePointerLeave = () => this.#hidePlacementPreview();
        this.handleKeyDown = event => this.#handleKeyDown(event);
    }


    enter()
    {
        this.#createOverlay();
        this.canvas.addEventListener('click', this.handleCanvasClick);
        this.canvas.addEventListener('pointermove', this.handlePointerMove);
        this.canvas.addEventListener('pointerleave', this.handlePointerLeave);
        window.addEventListener('keydown', this.handleKeyDown);
    }


    update()
    {
        this.orbitControls.update();
    }


    exit()
    {
        this.canvas.removeEventListener('click', this.handleCanvasClick);
        this.canvas.removeEventListener('pointermove', this.handlePointerMove);
        this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
        window.removeEventListener('keydown', this.handleKeyDown);

        this.#destroyPlacementPreview();

        this.transformControls.detach();
        this.transformControls.dispose();
        this.orbitControls.dispose();

        this.#clearLevelObjects();
        this.overlay?.remove();
        this.overlay = null;

        this.ground.geometry.dispose();
        this.ground.material.dispose();
    }


    #setupScene()
    {
        this.scene.background = new THREE.Color(0x07141a);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
        directionalLight.position.set(8, 12, 6);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(1024, 1024);
        directionalLight.shadow.camera.left = -25;
        directionalLight.shadow.camera.right = 25;
        directionalLight.shadow.camera.top = 25;
        directionalLight.shadow.camera.bottom = -25;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 75;
        directionalLight.shadow.bias = -0.0001;
        directionalLight.shadow.normalBias = 0.02;

        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x102d37,
            side: THREE.DoubleSide
        });

        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.ground.name = 'editor-ground';
        this.ground.position.y = -0.01;

        const grid = new THREE.GridHelper(100, 100, 0x765a7c, 0x204d59);
        grid.position.y = 0.01;

        this.scene.add(ambientLight, directionalLight, this.ground, grid);
    }


    #setupControls()
    {
        this.orbitControls = new OrbitControls(this.camera, this.canvas);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.08;
        this.orbitControls.target.set(0, 0, 0);
        this.orbitControls.mouseButtons.LEFT = null;
        this.orbitControls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
        this.orbitControls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
        this.orbitControls.update();

        this.transformControls = new TransformControls(this.camera, this.canvas);
        this.transformControls.setTranslationSnap(this.gridSize);
        this.transformControls.setRotationSnap(THREE.MathUtils.degToRad(15));
        this.transformControls.setMode('translate');
        this.scene.add(this.transformControls.getHelper());

        this.transformControls.addEventListener('dragging-changed', event =>
        {
            this.orbitControls.enabled = !event.value;
        });

        this.transformControls.addEventListener('mouseDown', () =>
        {
            this.ignoreNextCanvasClick = true;
        });

        this.transformControls.addEventListener('objectChange', () =>
        {
            this.#updateStatusForSelection();
        });
    }


    #createOverlay()
    {
        this.overlay = document.createElement('div');
        this.overlay.className = 'level-editor-overlay';
        this.overlay.innerHTML = editorOverlay;
        document.body.append(this.overlay);

        const catalog = this.overlay.querySelector('[data-editor-catalog]');

        for (const definition of LevelObjectCatalog)
        {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = definition.label;
            button.dataset.editorObject = definition.type;
            button.addEventListener('click', () => this.#setPlacementType(definition.type));
            catalog.append(button);
        }

        this.overlay.querySelector('[data-editor-action="select"]')
            .addEventListener('click', () => this.#setPlacementType(null));

        this.overlay.querySelector('[data-editor-action="delete"]')
            .addEventListener('click', () => this.#deleteSelectedObject());

        this.overlay.querySelector('[data-editor-action="clear"]')
            .addEventListener('click', () => this.#requestClearLevel());

        this.overlay.querySelector('[data-editor-action="export"]')
            .addEventListener('click', () => this.#exportLevel());

        this.overlay.querySelector('[data-editor-action="import"]')
            .addEventListener('click', () => this.fileInput.click());

        this.overlay.querySelector('[data-editor-action="back"]')
            .addEventListener('click', () => this.sceneManager.changeScene(SceneId.TITLE));

        for (const button of this.overlay.querySelectorAll('[data-editor-transform]'))
        {
            button.addEventListener('click', () => this.#setTransformMode(button.dataset.editorTransform));
        }

        this.fileInput = this.overlay.querySelector('[data-editor-file]');
        this.fileInput.addEventListener('change', () => this.#importSelectedFile());

        this.overlay.querySelector('[data-editor-grid]').addEventListener('change', event =>
        {
            this.gridSize = Number(event.target.value);
            this.transformControls.setTranslationSnap(this.gridSize);
            this.#setStatus(`grid size set to ${this.gridSize}.`);
        });

        this.#updateTransformButtons();
        this.#updatePropertiesPanel();
    }


    #handleCanvasClick(event)
    {
        if (this.ignoreNextCanvasClick)
        {
            this.ignoreNextCanvasClick = false;
            return;
        }

        if (event.button !== 0) return;

        this.#updatePointer(event);
        this.raycaster.setFromCamera(this.pointer, this.camera);

        if (this.placementType)
        {
            const [intersection] = this.raycaster.intersectObject(this.ground);
            if (intersection) this.#placeObject(intersection.point);
            return;
        }

        const intersections = this.raycaster.intersectObjects(this.levelObjects, true);
        const selectedObject = intersections.length > 0
            ? this.#findLevelObjectRoot(intersections[0].object)
            : null;

        this.#selectObject(selectedObject);
    }


    #handlePointerMove(event)
    {
        if (!this.placementPreview) return;

        this.#updatePointer(event);
        this.raycaster.setFromCamera(this.pointer, this.camera);

        const [intersection] = this.raycaster.intersectObject(this.ground);
        if (!intersection)
        {
            this.#hidePlacementPreview();
            return;
        }

        const definition = getLevelObjectDefinition(this.placementType);
        this.#getPlacementPosition(intersection.point, definition, this.placementPreview.position);
        this.placementPreview.visible = true;
        this.#updatePlacementAvailability();
    }


    #handleKeyDown(event)
    {
        if (event.target.matches('input, select, textarea')) return;

        if (event.code === 'KeyW') this.#setTransformMode('translate');
        if (event.code === 'KeyE') this.#setTransformMode('rotate');
        if (event.code === 'Delete') this.#deleteSelectedObject();

        if (event.code === 'KeyR' && this.placementType)
        {
            this.#rotatePlacementPreview();
            return;
        }

        if (event.code === 'Escape')
        {
            this.#setPlacementType(null);
            this.#selectObject(null);
        }
    }


    #updatePointer(event)
    {
        const bounds = this.canvas.getBoundingClientRect();
        this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    }


    #placeObject(point)
    {
        const definition = getLevelObjectDefinition(this.placementType);
        const position = this.#getPlacementPosition(point, definition, new THREE.Vector3());
        const rotationY = definition.defaultRotation[1] + this.placementRotationY;

        if (this.#hasDuplicatePlacement(this.placementType, position, rotationY))
        {
            this.#setStatus('this object already exists at the current position and rotation.');
            return;
        }

        const object = this.objectFactory.create(this.placementType);
        object.position.copy(position);
        object.rotation.y += this.placementRotationY;
        object.userData.levelObjectId = this.#createObjectId(this.placementType);

        this.#addLevelObject(object);
        this.placementIsBlocked = false;
        this.#updatePlacementAvailability();
    }


    #addLevelObject(object)
    {
        this.levelObjects.push(object);
        this.editableRoot.add(object);
    }


    #selectObject(object)
    {
        this.selectedObject = object;

        if (object)
        {
            this.placementType = null;
            this.#destroyPlacementPreview();
            this.transformControls.attach(object);
            this.#updateCatalogButtons();
            this.#updatePropertiesPanel();
            this.#updateStatusForSelection();
            return;
        }

        this.transformControls.detach();
        this.#updatePropertiesPanel();
        this.#setStatus('nothing selected.');
    }


    #findLevelObjectRoot(object)
    {
        let current = object;

        while (current && current.parent !== this.editableRoot)
        {
            current = current.parent;
        }

        return current?.parent === this.editableRoot ? current : null;
    }


    #setPlacementType(type)
    {
        this.#destroyPlacementPreview();
        this.placementType = type;
        this.placementRotationY = 0;
        this.placementIsBlocked = false;
        this.selectedObject = null;
        this.transformControls.detach();
        this.#updateCatalogButtons();
        this.#updatePropertiesPanel();

        if (!type)
        {
            this.#setStatus('select tool active. click an object to edit it.');
            return;
        }

        const definition = getLevelObjectDefinition(type);
        this.placementPreview = this.objectFactory.createPreview(type);
        this.placementPreview.visible = false;
        this.scene.add(this.placementPreview);
        this.#setPlacementStatus(definition.label);
    }


    #rotatePlacementPreview()
    {
        this.placementRotationY = (this.placementRotationY + Math.PI / 2) % (Math.PI * 2);
        this.placementPreview.rotation.y += Math.PI / 2;

        const definition = getLevelObjectDefinition(this.placementType);
        if (this.placementPreview.visible) this.#updatePlacementAvailability();
        else this.#setPlacementStatus(definition.label);
    }


    #hidePlacementPreview()
    {
        if (this.placementPreview) this.placementPreview.visible = false;
    }


    #destroyPlacementPreview()
    {
        if (!this.placementPreview) return;

        this.scene.remove(this.placementPreview);
        this.#disposeLevelObject(this.placementPreview);
        this.placementPreview = null;
        this.placementIsBlocked = false;
    }


    #updatePlacementAvailability()
    {
        const definition = getLevelObjectDefinition(this.placementType);
        const rotationY = definition.defaultRotation[1] + this.placementRotationY;
        const isBlocked = this.#hasDuplicatePlacement(
            this.placementType,
            this.placementPreview.position,
            rotationY
        );

        if (isBlocked === this.placementIsBlocked) return;
        this.placementIsBlocked = isBlocked;

        this.placementPreview.traverse(child =>
        {
            if (!child.isMesh) return;

            const materials = Array.isArray(child.material) ? child.material : [child.material];
            for (const material of materials) material.opacity = isBlocked ? 0.15 : 0.45;
        });

        if (isBlocked)
        {
            this.#setStatus('placement blocked: this object already exists here with the same rotation.');
        }
        else
        {
            this.#setPlacementStatus(definition.label);
        }
    }


    #hasDuplicatePlacement(type, position, rotationY)
    {
        const epsilon = 0.0001;

        return this.levelObjects.some(object =>
        {
            if (object.userData.levelObjectType !== type) return false;

            const hasSamePosition = object.position.distanceToSquared(position) < epsilon * epsilon;
            const rotationDifference = Math.atan2(
                Math.sin(object.rotation.y - rotationY),
                Math.cos(object.rotation.y - rotationY)
            );

            return hasSamePosition && Math.abs(rotationDifference) < epsilon;
        });
    }


    #setPlacementStatus(label)
    {
        const degrees = THREE.MathUtils.radToDeg(this.placementRotationY);
        this.#setStatus(`${label} tool active | rotation ${degrees}° | r rotates 90° | click to place.`);
    }


    #setTransformMode(mode)
    {
        this.transformControls.setMode(mode);
        this.#updateTransformButtons();
        this.#updateStatusForSelection();
    }


    #updateCatalogButtons()
    {
        for (const button of this.overlay.querySelectorAll('[data-editor-object]'))
        {
            button.classList.toggle('is-active', button.dataset.editorObject === this.placementType);
        }
    }


    #updateTransformButtons()
    {
        for (const button of this.overlay.querySelectorAll('[data-editor-transform]'))
        {
            button.classList.toggle('is-active', button.dataset.editorTransform === this.transformControls.getMode());
        }
    }


    #updateStatusForSelection()
    {
        if (!this.selectedObject) return;

        const { x, y, z } = this.selectedObject.position;
        this.#setStatus(
            `${this.selectedObject.userData.levelObjectId} selected | ` +
            `position ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`
        );
    }


    #updatePropertiesPanel()
    {
        if (!this.overlay) return;

        const panel = this.overlay.querySelector('[data-editor-properties]');
        const properties = this.selectedObject?.userData.levelObjectProperties;
        panel.hidden = !properties;

        if (!properties) return;

        const definition = getLevelObjectDefinition(this.selectedObject.userData.levelObjectType);
        const fields = panel.querySelector('[data-editor-properties-fields]');
        panel.querySelector('[data-editor-properties-title]').textContent = definition.label;
        fields.replaceChildren();

        for (const [propertyName, value] of Object.entries(properties))
        {
            const label = document.createElement('label');
            const text = document.createElement('span');
            const isSelect = propertyName === 'activator' || propertyName === 'platformType';
            const input = isSelect
                ? document.createElement('select')
                : document.createElement('input');

            label.className = 'level-editor__field';
            text.textContent = propertyName === 'path'
                ? 'path (relative x,z points)'
                : propertyName.replace(/([A-Z])/g, ' $1').toLowerCase();
            input.dataset.editorProperty = propertyName;

            if (propertyName === 'activator')
            {
                input.append(new Option('body', 'body'), new Option('spirit', 'spirit'));
            }
            else if (propertyName === 'platformType')
            {
                input.append(new Option('start', 'start'), new Option('end', 'end'));
            }
            else
            {
                input.type = typeof value === 'number' ? 'number' : 'text';
                if (typeof value === 'number') input.step = '0.1';
                if (propertyName === 'path') input.placeholder = '5,0; 5,5; 0,5';
            }

            input.value = value;
            input.addEventListener('change', event => this.#setSelectedObjectProperty(event));
            label.append(text, input);
            fields.append(label);
        }
    }


    #setSelectedObjectProperty(event)
    {
        const properties = this.selectedObject?.userData.levelObjectProperties;
        if (!properties) return;

        const input = event.currentTarget;
        const propertyName = input.dataset.editorProperty;
        const value = typeof properties[propertyName] === 'number'
            ? Number(input.value)
            : input.value;

        properties[propertyName] = value;
        this.#setStatus(`${propertyName} set to ${value}.`);
    }


    #deleteSelectedObject()
    {
        if (!this.selectedObject)
        {
            this.#setStatus('select an object before deleting.');
            return;
        }

        const object = this.selectedObject;
        this.transformControls.detach();
        this.selectedObject = null;
        this.editableRoot.remove(object);
        this.levelObjects.splice(this.levelObjects.indexOf(object), 1);
        this.#disposeLevelObject(object);
        this.#updatePropertiesPanel();
        this.#setStatus('object deleted.');
    }


    #requestClearLevel()
    {
        if (this.levelObjects.length === 0)
        {
            this.#setStatus('the level is already empty.');
            return;
        }

        if (!window.confirm('Delete every object in the current editor level?')) return;

        this.#clearLevelObjects();
        this.#setStatus('level cleared.');
    }


    #clearLevelObjects()
    {
        this.transformControls.detach();
        this.selectedObject = null;
        this.#updatePropertiesPanel();

        for (const object of this.levelObjects)
        {
            this.editableRoot.remove(object);
            this.#disposeLevelObject(object);
        }

        this.levelObjects.length = 0;
    }


    #disposeLevelObject(object)
    {
        this.objectFactory.dispose(object);
    }


    #exportLevel()
    {
        const levelName = this.#getLevelName();
        const levelData = createLevelData(levelName, this.levelObjects, this.gridSize);
        const json = JSON.stringify(levelData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `${levelName}.json`;
        link.click();
        URL.revokeObjectURL(url);

        this.#setStatus(`exported ${this.levelObjects.length} objects to ${link.download}.`);
    }


    async #importSelectedFile()
    {
        const [file] = this.fileInput.files;
        if (!file) return;

        const importedObjects = [];

        try
        {
            const levelData = validateLevelData(JSON.parse(await file.text()));
            for (const data of levelData.objects)
            {
                importedObjects.push(this.objectFactory.createFromData(data));
            }

            this.#clearLevelObjects();
            for (const object of importedObjects) this.#addLevelObject(object);

            this.nextObjectId = 1;
            this.overlay.querySelector('[data-editor-name]').value = levelData.name ?? 'imported_level';

            const importedGridSize = Number(levelData.editor?.gridSize);
            if (importedGridSize > 0) this.#applyImportedGridSize(importedGridSize);

            this.#setStatus(`imported ${this.levelObjects.length} objects from ${file.name}.`);
        }
        catch (error)
        {
            for (const object of importedObjects) this.#disposeLevelObject(object);
            console.error(error);
            this.#setStatus(`import failed: ${error.message}`);
        }
        finally
        {
            this.fileInput.value = '';
        }
    }


    #applyImportedGridSize(gridSize)
    {
        const gridSelect = this.overlay.querySelector('[data-editor-grid]');
        const hasOption = [...gridSelect.options].some(option => Number(option.value) === gridSize);

        if (!hasOption) return;

        this.gridSize = gridSize;
        gridSelect.value = String(gridSize);
        this.transformControls.setTranslationSnap(gridSize);
    }


    #getLevelName()
    {
        const input = this.overlay.querySelector('[data-editor-name]');
        const safeName = input.value.trim().replace(/[^a-z0-9_-]+/gi, '_');

        return safeName || 'new_level';
    }


    #createObjectId(type)
    {
        let id;

        do
        {
            id = `${type}-${String(this.nextObjectId).padStart(3, '0')}`;
            this.nextObjectId += 1;
        }
        while (this.levelObjects.some(object => object.userData.levelObjectId === id));

        return id;
    }


    #setStatus(message)
    {
        this.overlay.querySelector('[data-editor-status]').textContent = message;
    }


    #snap(value)
    {
        return Math.round(value / this.gridSize) * this.gridSize;
    }


    #getPlacementPosition(point, definition, target)
    {
        target.set(
            this.#snap(point.x),
            definition.placementY,
            this.#snap(point.z)
        );

        if (!definition.placementOffset) return target;

        const rotationY = definition.defaultRotation[1] + this.placementRotationY;
        this.placementOffset
            .fromArray(definition.placementOffset)
            .applyAxisAngle(THREE.Object3D.DEFAULT_UP, rotationY);

        return target.add(this.placementOffset);
    }
}
