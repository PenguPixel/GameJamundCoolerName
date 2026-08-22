//each value uses exactly one bit so multiple groups can be combined without overlapping
//object.freeze prevents group identifiers from being changed accidentally at runtime
export const PhysicsGroup = Object.freeze({
    //1 << 0 moves binary 0001 zero places, so body gets bit 0 and the decimal value 1
    BODY: 1 << 0,
    //1 << 1 moves binary 0001 one place left, so spirit becomes 0010 and the decimal value 2
    SPIRIT: 1 << 1,
    //1 << 2 produces binary 0100 and the decimal value 4 for normal world geometry
    WORLD: 1 << 2,
    //1 << 3 produces binary 1000 and the decimal value 8 for objects only the body should hit
    SPIRIT_PASSABLE: 1 << 3,
    //1 << 4 produces binary 10000 and the decimal value 16 for sensors only the body should activate
    BODY_TRIGGER: 1 << 4,
    //1 << 5 produces binary 100000 and the decimal value 32 for sensors only the spirit should activate
    SPIRIT_TRIGGER: 1 << 5,
    //1 << 6 produces binary 1000000 and the decimal value 64 for sensors both characters should activate
    TRIGGER: 1 << 6
});

//rapier stores two separate 16-bit masks inside one 32-bit number
//the upper 16 bits describe which group the collider belongs to
//the lower 16 bits describe which groups the collider is allowed to interact with
function createCollisionGroups(membership, filter)
{
    //shifting membership by 16 places moves it into the upper half of the number
    //the bitwise or operator then inserts the filter into the still-empty lower half
    //example: membership 0001 and filter 1100 become 0000000000000001_0000000000001100
    return (membership << 16) | filter;
}

//rapier only creates a collision when both colliders accept each other's membership
//object.freeze keeps these finished 32-bit configurations constant during the game
export const PhysicsCollisionGroup = Object.freeze({
    //body collides physically with world and spirit-passable objects
    //body can activate body-trigger and general-trigger sensors but does not collide physically with sensors
    //body ignores spirit characters, other body colliders, and spirit-only triggers
    BODY: createCollisionGroups(
        PhysicsGroup.BODY,
        PhysicsGroup.WORLD |
        PhysicsGroup.SPIRIT_PASSABLE |
        PhysicsGroup.BODY_TRIGGER |
        PhysicsGroup.TRIGGER
    ),
    //spirit collides physically only with normal world objects
    //spirit can activate spirit-trigger and general-trigger sensors
    //spirit ignores body characters, other spirits, spirit-passable objects, and body-only triggers
    SPIRIT: createCollisionGroups(
        PhysicsGroup.SPIRIT,
        PhysicsGroup.WORLD |
        PhysicsGroup.SPIRIT_TRIGGER |
        PhysicsGroup.TRIGGER
    ),
    //world collides physically with body and spirit characters
    //world ignores other world colliders, spirit-passable objects, and every trigger group
    WORLD: createCollisionGroups(
        PhysicsGroup.WORLD,
        PhysicsGroup.BODY | PhysicsGroup.SPIRIT
    ),
    //spirit-passable objects collide physically only with the body character
    //they ignore spirits, world objects, other spirit-passable objects, and every trigger group
    SPIRIT_PASSABLE: createCollisionGroups(
        PhysicsGroup.SPIRIT_PASSABLE,
        PhysicsGroup.BODY
    ),
    //body triggers detect only the body character when configured as sensors
    //they ignore spirits, world objects, spirit-passable objects, and every other trigger group
    BODY_TRIGGER: createCollisionGroups(
        PhysicsGroup.BODY_TRIGGER,
        PhysicsGroup.BODY
    ),
    //spirit triggers detect only the spirit character when configured as sensors
    //the sensor must also enable rapier activecollisiontypes.kinematic_fixed
    //they ignore bodies, world objects, spirit-passable objects, and every other trigger group
    SPIRIT_TRIGGER: createCollisionGroups(
        PhysicsGroup.SPIRIT_TRIGGER,
        PhysicsGroup.SPIRIT
    ),
    //general triggers detect body and spirit characters when configured as sensors
    //the sensor must also enable rapier activecollisiontypes.kinematic_fixed to detect the spirit
    //they ignore world objects, spirit-passable objects, and every trigger group
    TRIGGER: createCollisionGroups(
        PhysicsGroup.TRIGGER,
        PhysicsGroup.BODY | PhysicsGroup.SPIRIT
    )
});
