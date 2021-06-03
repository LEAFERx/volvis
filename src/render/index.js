import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import vert from '@/shaders/vert.glsl';
import frag from '@/shaders/frag.glsl';
import vert2 from '@/shaders/vert2.glsl';
import frag2 from '@/shaders/frag2.glsl';

export function init(canvas, data) {

  // console.log(data[100][100][5]); // error. Should print 5. data seems to be undefined.

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#000");
  scene.fog = new THREE.Fog("#eee", 20, 100);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  // camera.position.set(25, 13, 13);
  camera.position.set(0, 0, -2); // almost full-screen

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  // const material = new THREE.MeshPhongMaterial({
  //   color: 0x857ebb,
  //   shininess: true,
  // });
  var cubeMaterial = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    side: THREE.BackSide,
    // lights: true,
  });

  var renderTexture;

  var dataTexture = new THREE.DataTexture3D(data, 256, 256, 178); // Now using the teapot

  var dataMaterial = new THREE.ShaderMaterial({
    vertexShader: vert2,
    fragmentShader: frag2,
    side: THREE.FrontSide,
    uniforms: {
      rawObjectTexture: {value: dataTexture}, 
      backSideTexture: {value: renderTexture}
    }
  });

  //!!!!!!!!!

  const cubeBackSideScene = new THREE.Scene();
  // for test purpose
  cubeBackSideScene.background = new THREE.Color("#000");
  cubeBackSideScene.fog = new THREE.Fog("#eee", 20, 100);

  var cubeMesh = new THREE.Mesh(geometry, cubeMaterial);
  cubeMesh.position.set(0, 0, 0);
  cubeBackSideScene.add(cubeMesh);

  var meshWithObject = new THREE.Mesh(geometry, dataMaterial);
  meshWithObject.position.set(0, 0, 0);
  scene.add(meshWithObject);

  const hemLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemLight.position.set(0, 48, 0);
  cubeBackSideScene.add(hemLight);
  scene.add(hemLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(-10, 8, -5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
  cubeBackSideScene.add(dirLight);
  scene.add(dirLight);

  const floorGeometry = new THREE.PlaneGeometry(8000, 8000);
  const floorMaterial = new THREE.MeshPhongMaterial({
    color: 0x857ebb,
    shininess: true,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -0.5 * Math.PI;
  floor.receiveShadow = true;
  floor.position.y = -0.501; // Modified. Now the problem is that it's invisible.
  cubeBackSideScene.add(floor);
  scene.add(floor);

  const control = new OrbitControls(camera, renderer.domElement);
  control.enableDamping = true;

  function animate() {
    control.update();

    // for testing:
    renderer.render(cubeBackSideScene, camera);
    
    // First pass: render back side of the cube
    // renderer.render(cubeBackSideScene, camera, renderTexture, true);
    // Second pass: ray marching
    // renderer.render(scene, camera);
    
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