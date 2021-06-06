import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import Stats from 'stats.js';

import vertexShader from '@/shaders/vert.glsl';
import fragmentShader from '@/shaders/frag.glsl';

export class RenderContext {
  constructor(canvas) {
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
  
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#000');

    this.light1 = new THREE.PointLight("#fff", 1);
    this.light1.position.set(0, 0, -2);
    this.light1Helper = new THREE.PointLightHelper(this.light1, 0.01);
    this.light2 = new THREE.PointLight("#fff", 1);
    this.light2.position.set(0, 2, 0);
    this.light2Helper = new THREE.PointLightHelper(this.light2, 0.01);

    const axesHelper = new THREE.AxesHelper(3);
    this.scene.add(axesHelper);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, -2); // almost full-screen

    this.control = new OrbitControls(this.camera, this.renderer.domElement);
    this.control.enableDamping = true;
  }

  makeDataTexture() {
    const dataTexture = new THREE.DataTexture3D(this.raw.data, ...this.raw.info.dimension);
    dataTexture.format = THREE.RedFormat;
    dataTexture.type = THREE.FloatType;
    dataTexture.minFilter = THREE.LinearFilter;
    dataTexture.magFilter = THREE.LinearFilter;
    dataTexture.unpackAlignment = 1;
    return dataTexture;
  }

  makeTFTexture(samples) {
    const texture = new THREE.DataTexture(samples, samples.length, 1, THREE.RedFormat, THREE.FloatType);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  init(raw, options) {
    this.raw = raw;
  
    this.dataMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.FrontSide,
      uniforms: THREE.UniformsLib['lights'],
      lights: true,
      transparent: true,
    });
    this.dataMaterial.uniforms['worldCoordCameraPos'] = { value: this.camera.position };
    this.dataMaterial.uniforms['volumeData'] = { value: this.makeDataTexture() };
    this.dataMaterial.uniforms['dimension'] = { value: new THREE.Vector3(...raw.info.dimension) };
    this.dataMaterial.uniforms['voxelInterval'] = { value: new THREE.Vector3(...raw.info.interval) };

    const identicalTF = Float32Array.from([...Array(256).keys()].map(x => x / 255.0));
    this.dataMaterial.uniforms['tfR'] = { value: this.makeTFTexture(identicalTF) };
    this.dataMaterial.uniforms['tfG'] = { value: this.makeTFTexture(identicalTF) };
    this.dataMaterial.uniforms['tfB'] = { value: this.makeTFTexture(identicalTF) };
    this.dataMaterial.uniforms['tfA'] = { value: this.makeTFTexture(identicalTF) };

    this.dataMaterial.uniforms['raySampleNum'] = { value: options.raySampleNum };
    this.dataMaterial.uniforms['raySamplesPerLightSample'] = { value: options.raySamplesPerLightSample };
    this.dataMaterial.uniforms['lightSampleNum'] = { value: options.lightSampleNum };
  
    const box = new THREE.BoxGeometry(1, 1, 1);
    this.mesh = new THREE.Mesh(box, this.dataMaterial);
    this.mesh.position.set(0, 0, 0);
    this.scene.add(this.mesh);

    requestAnimationFrame(this.animate.bind(this));
  }

  setRaw(raw) {
    if (this.dataMaterial) {
      this.raw = raw;
      this.dataMaterial.uniforms['volumeData'].value = this.makeDataTexture();
    }
  }

  setTransferFunction(tfs = {}) {
    if (this.dataMaterial) {
      if (tfs.r) {
        this.dataMaterial.uniforms['tfR'] = { value: this.makeTFTexture(tfs.r) };
      }
      if (tfs.g) {
        this.dataMaterial.uniforms['tfG'] = { value: this.makeTFTexture(tfs.g) };
      }
      if (tfs.b) {
        this.dataMaterial.uniforms['tfB'] = { value: this.makeTFTexture(tfs.b) };
      }
      if (tfs.a) {
        this.dataMaterial.uniforms['tfA'] = { value: this.makeTFTexture(tfs.a) };
      }
    }
  }

  setOptions(options) {
    if (this.dataMaterial) {
      this.dataMaterial.uniforms['raySampleNum'].value = options.raySampleNum;
      this.dataMaterial.uniforms['raySamplesPerLightSample'].value = options.raySamplesPerLightSample;
      this.dataMaterial.uniforms['lightSampleNum'].value = options.lightSampleNum;
    }
  }
  
  resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    var width = window.innerWidth;
    var height = window.innerHeight;
    var canvasPixelWidth = canvas.width / window.devicePixelRatio;
    var canvasPixelHeight = canvas.height / window.devicePixelRatio;

    const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  animate() {
    this.stats.begin();
    this.control.update();
    this.renderer.render(this.scene, this.camera);

    if (this.resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
    this.stats.end();
    
    requestAnimationFrame(this.animate.bind(this));
  }

  setSceneBackground(color) {
    if (color === 'white') {
      this.scene.background = new THREE.Color('#fff');
    } else {
      this.scene.background = new THREE.Color('#000');
    }
  }

  setLight1Enable(enable) {
    if (enable) {
      this.scene.add(this.light1, this.light1Helper);
    } else {
      this.scene.remove(this.light1, this.light1Helper);
    }
  }

  setLight1Attr(attr = {}) {
    if (attr.x) {
      this.light1.position.x = attr.x;
    }
    if (attr.y) {
      this.light1.position.y = attr.y;
    }
    if (attr.z) {
      this.light1.position.z = attr.z;
    }
    if (attr.intensity) {
      this.light1.intensity = attr.intensity;
    }
  }

  setLight2Enable(enable) {
    if (enable) {
      this.scene.add(this.light2, this.light2Helper);
    } else {
      this.scene.remove(this.light2, this.light2Helper);
    }
  }

  setLight2Attr(attr = {}) {
    if (attr.x) {
      this.light2.position.x = attr.x;
    }
    if (attr.y) {
      this.light2.position.y = attr.y;
    }
    if (attr.z) {
      this.light2.position.z = attr.z;
    }
    if (attr.intensity) {
      this.light2.intensity = attr.intensity;
    }
  }
}
