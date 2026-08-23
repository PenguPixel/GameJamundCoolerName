const STARTING_HEALTH = 5;

export class GameState
{
    constructor()
    {
        this.maxHealth = STARTING_HEALTH;
        this.health = this.maxHealth;
    }


    reset()
    {
        this.health = this.maxHealth;
    }


    takeDamage(amount = 1)
    {
        if (this.isDead) return;
        this.health = Math.max(0, this.health - amount);
    }


    kill()
    {
        this.health = 0;
    }


    get isDead()
    {
        return this.health === 0;
    }
}
