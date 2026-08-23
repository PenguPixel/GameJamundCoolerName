import Engine from "./core/Engine.js";

//############################################
//          APPLICATION ENTRY POINT
//############################################

//creates the engine with the page canvas and begins asynchronous startup
const canvas = document.querySelector("#canvas-threeJs");
const engine = new Engine(canvas);
engine.start();
