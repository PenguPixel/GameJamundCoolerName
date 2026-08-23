import * as THREE from 'three';
import { getLevelObjectDefinition } from './LevelObjectCatalog.js';

export class LevelObjectFactory
{
    constructor(assetManager)
    {
        this.assetManager = assetManager;
    }


    create(type, assetId = null)
    {
        const definition = getLevelObjectDefinition(type);
        if (!definition) throw new Error(`Unknown level object type: ${type}`);

        const instance = definition.primitive
            ? this.#createPrimitive(definition.primitive)
            : this.assetManager.createInstance(assetId ?? definition.assetId);
        const object = definition.surfaceMeshName
            ? this.#createSurfaceAlignedRoot(instance, definition.surfaceMeshName)
            : definition.centerOnGround
                ? this.#createCenteredRoot(instance)
                : instance;

        object.scale.fromArray(definition.defaultScale);
        object.rotation.fromArray(definition.defaultRotation);
        object.position.y = definition.placementY;
        object.userData.levelObjectType = definition.type;

        if (definition.defaultProperties)
        {
            object.userData.levelObjectProperties = { ...definition.defaultProperties };
        }

        if (definition.textureRepeat)
        {
            this.#applyTextureRepeat(object, definition.textureRepeat);
        }

        object.traverse(child =>
        {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
        });

        return object;
    }


    createFromData(data)
    {
        const definition = getLevelObjectDefinition(data.type);
        const variant = data.properties?.[definition?.assetVariantProperty];
        const assetId = definition?.assetVariants?.[variant];
        const object = this.create(data.type, assetId);

        if (Array.isArray(data.position)) object.position.fromArray(data.position);
        if (Array.isArray(data.rotation)) object.rotation.fromArray(data.rotation);
        if (Array.isArray(data.scale)) object.scale.fromArray(data.scale);

        if (data.properties)
        {
            object.userData.levelObjectProperties = {
                ...object.userData.levelObjectProperties,
                ...data.properties
            };
        }

        object.userData.levelObjectId = data.id;
        return object;
    }


    createStaticBatch(type, objectsData)
    {
        if (objectsData.length === 0) throw new Error('Cannot create an empty static level object batch.');

        //one template supplies the shared geometry, material, local bounds, and glb hierarchy
        const template = this.create(type);
        const batch = new THREE.Group();
        const colliderBounds = this.#getObjectLocalBounds(template);
        const rootWorldInverse = template.matrixWorld.clone().invert();
        const sourceMeshes = [];

        template.traverse(child =>
        {
            if (!child.isMesh || !child.geometry) return;

            //keeps transforms authored inside the glb while the level transform changes per instance
            sourceMeshes.push({
                mesh: child,
                matrixToRoot: rootWorldInverse.clone().multiply(child.matrixWorld)
            });
        });

        if (sourceMeshes.length === 0)
        {
            this.dispose(template);
            throw new Error(`Cannot batch level object type without mesh geometry: ${type}`);
        }

        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        const objectMatrix = new THREE.Matrix4();
        const instanceMatrix = new THREE.Matrix4();

        for (const { mesh, matrixToRoot } of sourceMeshes)
        {
            const instancedMesh = new THREE.InstancedMesh(
                mesh.geometry,
                mesh.material,
                objectsData.length
            );

            for (let index = 0; index < objectsData.length; index++)
            {
                const data = objectsData[index];
                position.fromArray(data.position);
                rotation.fromArray(data.rotation);
                quaternion.setFromEuler(rotation);
                scale.fromArray(data.scale);
                objectMatrix.compose(position, quaternion, scale);
                instanceMatrix.multiplyMatrices(objectMatrix, matrixToRoot);
                instancedMesh.setMatrixAt(index, instanceMatrix);
            }

            instancedMesh.instanceMatrix.needsUpdate = true;
            instancedMesh.computeBoundingBox();
            instancedMesh.computeBoundingSphere();
            instancedMesh.castShadow = mesh.castShadow;
            instancedMesh.receiveShadow = mesh.receiveShadow;
            instancedMesh.userData.ownsLevelMaterial = mesh.userData.ownsLevelMaterial;
            batch.add(instancedMesh);
        }

        batch.name = `static-${type}-batch`;
        batch.userData.levelObjectType = type;
        batch.userData.levelObjectIds = objectsData.map(data => data.id);
        batch.userData.ownedLevelTextures = template.userData.ownedLevelTextures ?? [];

        //lightweight objects retain ids and transforms for collider creation without rendering clones
        const colliderObjects = objectsData.map(data =>
        {
            const object = new THREE.Object3D();
            object.position.fromArray(data.position);
            object.rotation.fromArray(data.rotation);
            object.scale.fromArray(data.scale);
            object.userData.levelObjectId = data.id;
            object.userData.levelObjectType = data.type;
            object.userData.levelObjectBounds = colliderBounds.clone();
            return object;
        });

        return { batch, colliderObjects };
    }


    createPreview(type)
    {
        const preview = this.create(type);

        preview.traverse(child =>
        {
            if (!child.isMesh) return;

            const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
            const previewMaterials = sourceMaterials.map(material =>
            {
                const previewMaterial = material.clone();
                previewMaterial.transparent = true;
                previewMaterial.opacity = 0.45;
                previewMaterial.depthWrite = false;
                return previewMaterial;
            });

            if (child.userData.ownsLevelMaterial)
            {
                for (const material of sourceMaterials) material.dispose();
            }

            child.material = Array.isArray(child.material) ? previewMaterials : previewMaterials[0];
            child.userData.ownsLevelMaterial = true;
            child.castShadow = false;
            child.receiveShadow = false;
        });

        return preview;
    }


    dispose(object)
    {
        const ownedMaterials = new Set();
        const ownedTextures = new Set();

        object.traverse(child =>
        {
            for (const texture of child.userData.ownedLevelTextures ?? [])
            {
                ownedTextures.add(texture);
            }

            const ownsResources = child.userData.ownsLevelResources;
            const ownsMaterial = child.userData.ownsLevelMaterial;
            if (!ownsResources && !ownsMaterial) return;

            if (ownsResources) child.geometry?.dispose();

            const materials = Array.isArray(child.material) ? child.material : [child.material];
            for (const material of materials)
            {
                if (!material) continue;
                ownedMaterials.add(material);
            }
        });

        for (const texture of ownedTextures) texture.dispose();
        for (const material of ownedMaterials) material.dispose();
    }


    #createCenteredRoot(instance)
    {
        const root = new THREE.Group();
        const bounds = new THREE.Box3().setFromObject(instance);
        const center = bounds.getCenter(new THREE.Vector3());

        instance.position.x -= center.x;
        instance.position.y -= bounds.min.y;
        instance.position.z -= center.z;
        root.add(instance);
        root.animations = instance.animations ?? [];

        return root;
    }


    #createPrimitive(primitive)
    {
        let geometry;

        if (primitive.shape === 'box')
        {
            geometry = new THREE.BoxGeometry(...primitive.size);
        }
        else if (primitive.shape === 'circle')
        {
            geometry = new THREE.CircleGeometry(primitive.radius, 32);
            geometry.rotateX(-Math.PI / 2);
        }
        else
        {
            geometry = new THREE.ConeGeometry(primitive.radius, primitive.height, 32, 1, true);
        }

        const material = new THREE.MeshStandardMaterial({
            color: primitive.color,
            transparent: primitive.opacity < 1,
            opacity: primitive.opacity ?? 1,
            depthWrite: primitive.opacity === undefined || primitive.opacity === 1,
            side: primitive.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
            emissive: primitive.emissive ?? 0x000000,
            emissiveIntensity: primitive.emissiveIntensity ?? 0
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.ownsLevelResources = true;
        mesh.userData.ownsLevelMaterial = true;
        return mesh;
    }


    #createSurfaceAlignedRoot(instance, surfaceMeshName)
    {
        const surfaceMesh = instance.getObjectByName(surfaceMeshName);
        if (!surfaceMesh) throw new Error(`Surface mesh not found: ${surfaceMeshName}`);

        instance.updateWorldMatrix(true, true);

        const root = new THREE.Group();
        const bounds = new THREE.Box3().setFromObject(instance);
        const surfaceBounds = new THREE.Box3().setFromObject(surfaceMesh);
        const center = bounds.getCenter(new THREE.Vector3());

        //places the selected mesh top at local y zero while centering the full asset horizontally
        instance.position.x -= center.x;
        instance.position.y -= surfaceBounds.max.y;
        instance.position.z -= center.z;
        root.add(instance);
        root.animations = instance.animations ?? [];

        return root;
    }


    #applyTextureRepeat(object, repeat)
    {
        const textureClones = new Map();

        object.traverse(child =>
        {
            if (!child.isMesh) return;

            const materials = Array.isArray(child.material) ? child.material : [child.material];
            const materialClones = materials.map(material =>
            {
                const materialClone = material.clone();

                for (const [property, texture] of Object.entries(material))
                {
                    if (!texture?.isTexture) continue;

                    if (!textureClones.has(texture))
                    {
                        const textureClone = texture.clone();
                        textureClone.wrapS = THREE.RepeatWrapping;
                        textureClone.wrapT = THREE.RepeatWrapping;
                        textureClone.repeat.fromArray(repeat);
                        textureClone.needsUpdate = true;
                        textureClones.set(texture, textureClone);
                    }

                    materialClone[property] = textureClones.get(texture);
                }

                return materialClone;
            });

            child.material = Array.isArray(child.material) ? materialClones : materialClones[0];
            child.userData.ownsLevelMaterial = true;
        });

        object.userData.ownedLevelTextures = [...textureClones.values()];
    }


    #getObjectLocalBounds(object)
    {
        object.updateWorldMatrix(true, true);

        const rootWorldInverse = object.matrixWorld.clone().invert();
        const bounds = new THREE.Box3().makeEmpty();
        const corner = new THREE.Vector3();
        const matrixToRoot = new THREE.Matrix4();

        object.traverse(child =>
        {
            if (!child.isMesh || !child.geometry) return;

            child.geometry.computeBoundingBox();
            const meshBounds = child.geometry.boundingBox;
            if (!meshBounds) return;

            matrixToRoot.multiplyMatrices(rootWorldInverse, child.matrixWorld);

            for (const x of [meshBounds.min.x, meshBounds.max.x])
            {
                for (const y of [meshBounds.min.y, meshBounds.max.y])
                {
                    for (const z of [meshBounds.min.z, meshBounds.max.z])
                    {
                        corner.set(x, y, z).applyMatrix4(matrixToRoot);
                        bounds.expandByPoint(corner);
                    }
                }
            }
        });

        return bounds;
    }
}
