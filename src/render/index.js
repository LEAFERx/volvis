import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import vert from '@/shaders/vert.glsl';
import frag from '@/shaders/frag.glsl';

export function init(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#000");
  scene.fog = new THREE.Fog("#eee", 20, 100);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(25, 13, 13);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  // const material = new THREE.MeshPhongMaterial({
  //   color: 0x857ebb,
  //   shininess: true,
  // });
  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    // lights: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 2.5, 0);
  scene.add(mesh);

  const hemLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemLight.position.set(0, 48, 0);
  scene.add(hemLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(-10, 8, -5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
  scene.add(dirLight);

  const floorGeometry = new THREE.PlaneGeometry(8000, 8000);
  const floorMaterial = new THREE.MeshPhongMaterial({
    color: 0x857ebb,
    shininess: true,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -0.5 * Math.PI;
  floor.receiveShadow = true;
  floor.position.y = -0.001;
  scene.add(floor);

  const control = new OrbitControls(camera, renderer.domElement);
  control.enableDamping = true;

  function animate() {
    control.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
  }
  animate();

  function resizeRendererToDisplaySize(renderer) {
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
}