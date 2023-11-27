import * as kokomi from "kokomi.js";
import * as THREE from "three";

import testObjectVertexShader from "../Shaders/TestObject/vert.glsl";
import testObjectFragmentShader from "../Shaders/TestObject/frag.glsl";
import testObjectComputeShader from "../Shaders/TestObject/compute.glsl";

export default class TestObject extends kokomi.Component {
  constructor(base, config = {}) {
    super(base);

    const params = {
      uDistort: {
        value: 1,
      },
    };

    const {
      width = 512,
      size = 256,
      color = "#19b158",
      attractPos = new THREE.Vector3(0, 0, 0),
      scale = 1,
      id = 0,
      attractEnabled = false,
    } = config;
    this.color = color;
    this.attractPos = attractPos;
    this.attractEnabled = attractEnabled;

    const count = width ** 2;

    // gpgpu
    const gpgpu = new kokomi.GPUComputer(this.base, {
      width,
    });
    this.gpgpu = gpgpu;

    const posDt = gpgpu.createTexture();
    const data = posDt.image.data;

    for (let i = 0; i < data.length; i++) {
      data[i * 4 + 0] = THREE.MathUtils.randFloatSpread(size);
      data[i * 4 + 1] = THREE.MathUtils.randFloatSpread(size);
      data[i * 4 + 2] = THREE.MathUtils.randFloatSpread(size);
      data[i * 4 + 3] = 1;
    }

    const posVar = gpgpu.createVariable(
      "texturePosition",
      testObjectComputeShader,
      posDt,
      {
        uFreq: {
          value: 1,
        },
        uAttract: {
          value: new THREE.Vector3(0, 0, 0),
        },
        uNoise: {
          value: 0.5,
        },
        uId: {
          value: id,
        },
        uAttractEnabled: {
          value: false,
        },
      }
    );
    this.posVar = posVar;

    gpgpu.init();

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const references = new Float32Array(count * 2);
    const opacities = new Float32Array(count);
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < width; j++) {
        const idx = i + j * width;
        positions[idx * 3 + 0] = Math.random();
        positions[idx * 3 + 1] = Math.random();
        positions[idx * 3 + 2] = Math.random();
        references[idx * 2 + 0] = i / width;
        references[idx * 2 + 1] = j / width;
        opacities[idx * 1 + 0] = THREE.MathUtils.randFloat(0, 0.72);
      }
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(
      "reference",
      new THREE.BufferAttribute(references, 2)
    );
    geometry.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1));

    const uj = new kokomi.UniformInjector(this.base);
    this.uj = uj;
    const material = new THREE.ShaderMaterial({
      vertexShader: testObjectVertexShader,
      fragmentShader: testObjectFragmentShader,
      uniforms: {
        ...uj.shadertoyUniforms,
        ...params,
        texturePosition: {
          value: null,
        },
        uPointSize: {
          value: 1,
        },
        uPixelRatio: {
          value: this.base.renderer.getPixelRatio(),
        },
        uColor: {
          value: new THREE.Color(color),
        },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.material = material;
    const points = new THREE.Points(geometry, material);
    points.scale.setScalar(scale);
    this.points = points;

    const attractMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 64, 64),
      new THREE.MeshBasicMaterial({
        wireframe: true,
      })
    );
    this.attractMesh = attractMesh;
    this.attractMesh.position.copy(this.attractPos);
    this.attractMesh.scale.setScalar(scale);
    this.attractMesh.visible = false;

    const debug = this.base.debug;
    if (debug.active) {
      const debugFolder = debug.ui.addFolder("testObject");
      debugFolder
        .add(params.uDistort, "value")
        .min(0)
        .max(2)
        .step(0.01)
        .name("distort");
    }
  }
  addExisting() {
    this.container.add(this.points);
    this.container.add(this.attractMesh);
  }
  update_() {
    this.uj.injectShadertoyUniforms(this.material.uniforms);

    const mat = this.points.material;
    mat.uniforms.texturePosition.value = this.gpgpu.getVariableRt(this.posVar);

    const mat2 = this.posVar.material;
    mat2.uniforms.uAttract.value = this.attractPos;
    mat2.uniforms.uAttractEnabled.value = this.attractEnabled;

    this.attractMesh.position.copy(this.attractPos);
  }
}
