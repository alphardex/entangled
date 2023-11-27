import * as kokomi from "kokomi.js";
import * as THREE from "three";

import World from "./World/World";

import Debug from "./Debug";

import resources from "./resources";

export default class Experience extends kokomi.Base {
  constructor(sel = "#sketch") {
    super(sel);

    window.experience = this;

    THREE.ColorManagement.enabled = false;

    this.renderer.setClearColor(0x000000, 1);

    this.debug = new Debug();

    this.am = new kokomi.AssetManager(this, resources);

    // this.camera.position.set(0, 0, 5.6);
    // this.camera.fov = 30;
    // this.camera.updateProjectionMatrix();
    // new kokomi.OrbitControls(this);

    const camera = new THREE.OrthographicCamera(
      0,
      window.innerWidth,
      0,
      window.innerHeight,
      -10000,
      10000
    );
    camera.position.z = 2.5;
    this.camera = camera;
    window.addEventListener("resize", () => {
      this.camera.right = window.innerWidth;
      this.camera.bottom = window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
    new kokomi.OrbitControls(this);

    this.world = new World(this);
  }
}
