export const LEVEL_DATA_VERSION = 1;

export function createLevelData(name, objects, gridSize)
{
    return {
        version: LEVEL_DATA_VERSION,
        name,
        editor: { gridSize },
        objects: objects.map(object =>
        {
            const objectData = {
                id: object.userData.levelObjectId,
                type: object.userData.levelObjectType,
                position: object.position.toArray().map(roundNumber),
                rotation: object.rotation.toArray().slice(0, 3).map(roundNumber),
                scale: object.scale.toArray().map(roundNumber)
            };

            const properties = object.userData.levelObjectProperties;
            if (properties) objectData.properties = { ...properties };

            return objectData;
        })
    };
}


export function validateLevelData(data)
{
    if (!data || typeof data !== 'object') throw new Error('Level data must be an object.');
    if (data.version !== LEVEL_DATA_VERSION) throw new Error(`Unsupported level version: ${data.version}`);
    if (!Array.isArray(data.objects)) throw new Error('Level data needs an objects array.');

    const objectIds = new Set();

    for (const object of data.objects)
    {
        if (typeof object.id !== 'string' || typeof object.type !== 'string')
        {
            throw new Error('Every level object needs a string id and type.');
        }

        if (objectIds.has(object.id)) throw new Error(`Duplicate level object id: ${object.id}`);
        objectIds.add(object.id);

        validateVector(object.position, 'position');
        validateVector(object.rotation, 'rotation');
        validateVector(object.scale, 'scale');
    }

    return data;
}


function validateVector(value, propertyName)
{
    const isValid = Array.isArray(value) &&
        value.length === 3 &&
        value.every(Number.isFinite);

    if (!isValid) throw new Error(`${propertyName} must contain three finite numbers.`);
}


function roundNumber(value)
{
    return Number(value.toFixed(4));
}
