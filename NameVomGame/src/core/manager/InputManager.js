export class InputManager
{
    //############################################
    //                CONSTRUCTOR
    //############################################

    /**
     * creates keyboard state collections and registers browser input events.
     */
    constructor()
    {
        this.pressedKeys = new Set();
        this.justPressedKeys = new Set();
        this.releasedKeys = new Set();

        this.bindings = new Map();

        this.#registerEvents();
    }



    //############################################
    //               PUBLIC METHODS
    //############################################

    /**
     * maps one logical action to one or more keyboard codes.
     * @param {string} name - logical action identifier.
     * @param {string[]} keys - keyboard event codes assigned to the action.
     * @returns {void}
     */
    addAction(name, keys)
    {
        this.bindings.set(name, keys);
    }


    /**
     * checks whether any key assigned to an action is currently held.
     * @param {string} action - logical action identifier.
     * @returns {boolean} true while at least one assigned key is held.
     */
    isPressed(action)
    {
        const keys = this.bindings.get(action)
        if (!keys) return false;

        return keys.some(key => this.pressedKeys.has(key));
    }


    /**
     * checks whether any key assigned to an action was pressed during this frame.
     * @param {string} action - logical action identifier.
     * @returns {boolean} true only during the first frame of a press.
     */
    justPressed(action)
    {
        const keys = this.bindings.get(action)
        if (!keys) return false;

        return keys.some(key => this.justPressedKeys.has(key));
    }


    /**
     * checks whether any key assigned to an action was released during this frame.
     * @param {string} action - logical action identifier.
     * @returns {boolean} true only during the frame in which a key was released.
     */
    isReleased(action)
    {
        const keys = this.bindings.get(action)
        if (!keys) return false;

        return keys.some(key => this.releasedKeys.has(key));
    }


    /**
     * clears input states that must only remain active for one rendered frame.
     * @returns {void}
     */
    endFrame()
    {
        this.justPressedKeys.clear();
        this.releasedKeys.clear();
    }



    //############################################
    //              PRIVATE METHODS
    //############################################

    /**
     * registers keyboard and focus listeners used to maintain input state.
     * @returns {void}
     */
    #registerEvents()
    {
        window.addEventListener("keydown", (e) =>
        {
            if (!e.ctrlKey && !e.altKey && !e.metaKey)
            {
                if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
            }

            if (!this.pressedKeys.has(e.code)) this.justPressedKeys.add(e.code);
            this.pressedKeys.add(e.code);
        });

        window.addEventListener("keyup", (e) => 
        {
            this.pressedKeys.delete(e.code);
            this.releasedKeys.add(e.code);
        });

        window.addEventListener("blur", () => 
        {
            this.pressedKeys.clear();
            this.justPressedKeys.clear();
            this.releasedKeys.clear();
        });
    }


}
