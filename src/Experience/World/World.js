import * as kokomi from "kokomi.js";
import * as THREE from "three";

import TestObject from "./TestObject";

import WindowManager from "../WindowManager";

const useDefaultCube = false;

export default class World extends kokomi.Component {
  constructor(base) {
    super(base);

    this.base.am.on("ready", () => {
      // this.testObject = new TestObject(this.base);
      // this.testObject.addExisting();

      this.handleWindow();
    });
  }
  handleWindow() {
    let that = this;

    const t = THREE;
    let camera = this.base.camera;
    let scene = this.base.scene;
    let renderer = this.base.renderer;
    let world;
    let cubes = [];
    let sceneOffsetTarget = { x: 0, y: 0 };
    let sceneOffset = { x: 0, y: 0 };

    const colors = ["#00ff00", "#ff0000"];

    let today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    today = today.getTime();

    let internalTime = getTime();
    let windowManager;
    let initialized = false;

    // get time in seconds since beginning of the day (so that all windows use the same time)
    function getTime() {
      return (new Date().getTime() - today) / 1000.0;
    }

    if (new URLSearchParams(window.location.search).get("clear")) {
      localStorage.clear();
    } else {
      // this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState != "hidden" && !initialized) {
          init();
        }
      });

      window.onload = () => {
        if (document.visibilityState != "hidden") {
          init();
        }
      };

      function init() {
        initialized = true;

        // add a short timeout because window.offsetX reports wrong values before a short period
        setTimeout(() => {
          setupScene();
          setupWindowManager();
          updateWindowShape(false);
          render();
          document.querySelector(".loader-screen")?.classList.add("hollow");
        }, 1500);
      }

      function setupScene() {
        world = new t.Group();
        scene.add(world);
      }

      function setupWindowManager() {
        windowManager = new WindowManager();
        windowManager.setWinShapeChangeCallback(updateWindowShape);
        windowManager.setWinChangeCallback(windowsUpdated);

        // here you can add your custom metadata to each windows instance
        let metaData = { foo: "bar" };

        // this will init the windowmanager and add this window to the centralised pool of windows
        windowManager.init(metaData);

        // call update windows initially (it will later be called by the win change callback)
        windowsUpdated();
      }

      function windowsUpdated() {
        updateNumberOfCubes();
      }

      const updateNumberOfCubes = () => {
        let wins = windowManager.getWindows();

        // remove all cubes
        cubes.forEach((c) => {
          if (useDefaultCube) {
            world.remove(c);
          } else {
            world.remove(c.points);
          }
        });

        cubes = [];

        // add new cubes based on the current window setup
        for (let i = 0; i < wins.length; i++) {
          let win = wins[i];

          let c = new t.Color();
          if (i < 2) {
            c.set(colors[i]);
          } else {
            c.setHSL(i * 0.1, 1.0, 0.5);
          }

          // let s = 160 + i * 60;
          let s = 1;
          if (i < 2) {
            s = 220 - i * 80;
          } else {
            s = 160 + i * 60;
          }

          if (useDefaultCube) {
            let cube = new t.Mesh(
              new t.BoxGeometry(s, s, s),
              new t.MeshBasicMaterial({ color: c, wireframe: true })
            );
            world.add(cube);
            cube.position.x = win.shape.x + win.shape.w * 0.5;
            cube.position.y = win.shape.y + win.shape.h * 0.5;
            cubes.push(cube);
          } else {
            let cube = new TestObject(that.base, {
              color: c,
              scale: s,
              id: i,
            });
            cube.container = world;
            cube.addExisting();
            cube.points.position.x = win.shape.x + win.shape.w * 0.5;
            cube.points.position.y = win.shape.y + win.shape.h * 0.5;
            cubes.push(cube);
          }
        }
      };

      function updateWindowShape(easing = true) {
        // storing the actual offset in a proxy that we update against in the render function
        sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
        if (!easing) sceneOffset = sceneOffsetTarget;
      }

      const render = () => {
        let t = getTime();

        windowManager.update();

        // calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
        let falloff = 0.05;
        sceneOffset.x =
          sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
        sceneOffset.y =
          sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;

        // set the world position to the offset
        world.position.x = sceneOffset.x;
        world.position.y = sceneOffset.y;

        let wins = windowManager.getWindows();

        // loop through all our cubes and update their positions based on current window positions
        for (let i = 0; i < cubes.length; i++) {
          let cube = cubes[i];
          let win = wins[i];
          let _t = t; // + i * .2;

          let posTarget = {
            x: win.shape.x + win.shape.w * 0.5,
            y: win.shape.y + win.shape.h * 0.5,
          };

          if (useDefaultCube) {
            cube.position.x =
              cube.position.x + (posTarget.x - cube.position.x) * falloff;
            cube.position.y =
              cube.position.y + (posTarget.y - cube.position.y) * falloff;
            cube.rotation.x = _t * 0.5;
            cube.rotation.y = _t * 0.3;
          } else {
            cube.update_();
            cube.points.position.x =
              cube.points.position.x +
              (posTarget.x - cube.points.position.x) * falloff;
            cube.points.position.y =
              cube.points.position.y +
              (posTarget.y - cube.points.position.y) * falloff;

            if (wins.length === 2) {
              cubes[0].attractEnabled = true;
              cubes[1].attractEnabled = true;
              const p1 = cubes[1].points.position.clone();
              cubes[0].attractPos = p1;
              cubes[0].attractMesh.material.color.set(cubes[0].color);
              const p0 = cubes[0].points.position.clone();
              cubes[1].attractPos = p1;
              cubes[1].attractMesh.material.color.set(cubes[1].color);
              console.log({ p0, p1 });
            } else {
              cubes[0].attractEnabled = false;
            }
          }
        }
        renderer.render(scene, camera);
        requestAnimationFrame(render);
      };
    }
  }
}
