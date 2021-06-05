import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// import vert from '@/shaders/vert.glsl';
// import frag from '@/shaders/frag.glsl';
import vert2 from '@/shaders/vert2.glsl';
import frag2 from '@/shaders/frag2.glsl';
import { Vector3 } from 'three';

export function init(canvas, data) {

  // console.log(data[100][100][5]); // error. Should print 5. data seems to be undefined.

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#000");

  const light = new THREE.PointLight("#faa", 1);
  light.position.set(2, 0, 0);
  scene.add(light);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  // camera.position.set(25, 13, 13);
  camera.position.set(0, 0, -2); // almost full-screen

  // const geometry = new THREE.BoxGeometry(1, 1, 1);

  // const renderTarget = new THREE.WebGLRenderTarget(
  //   window.innerWidth,
  //   window.innerHeight,
  //   {
  //     minFilter: THREE.NearestFilter,
  //     magFilter: THREE.NearestFilter,
  //     wrapS: THREE.ClampToEdgeWrapping,
  //     wrapT: THREE.ClampToEdgeWrapping,
  //     format: THREE.RGBAFormat,
  //     type: THREE.FloatType,
  //     generateMipmaps: false,
  //   },
  // );

  // const renderTargetMaterial = new THREE.ShaderMaterial({
  //   vertexShader: vert,
  //   fragmentShader: frag,
  //   side: THREE.BackSide,
  // });

  const dataTexture = new THREE.DataTexture3D(data, 256, 256, 256); // Now using the foot
  dataTexture.format = THREE.RedFormat;
  dataTexture.type = THREE.FloatType;
  dataTexture.minFilter = THREE.LinearFilter;
  dataTexture.magFilter = THREE.LinearFilter;
  dataTexture.unpackAlignment = 1;

  const dataMaterial = new THREE.ShaderMaterial({
    vertexShader: vert2,
    fragmentShader: frag2,
    side: THREE.FrontSide,
    uniforms: THREE.UniformsLib['lights'],
    lights: true,
  });
  dataMaterial.uniforms['worldCoordCameraPos'] = { value: camera.position };
  dataMaterial.uniforms['rawObjectTexture'] = { value: dataTexture };
  dataMaterial.uniforms['objectSize'] = { value: new Vector3(256.0, 256.0, 256.0) };

  // const renderTargetScene = new THREE.Scene();
  // renderTargetScene.background = new THREE.Color("#000");
  // const renderTargetMesh = new THREE.Mesh(geometry, renderTargetMaterial);
  // renderTargetMesh.position.set(0, 0, 0);
  // renderTargetScene.add(renderTargetMesh);

  // const targetRenderer = new THREE.WebGLRenderer({ antialias: true });
  // targetRenderer.setSize(window.innerWidth, window.innerHeight);
  // document.body.appendChild(targetRenderer.domElement);
  // targetRenderer.setRenderTarget(renderTarget);
  // targetRenderer.autoClear = true;

  const newGeometry = new THREE.BoxGeometry(1, 1, 1);
  const dataMesh = new THREE.Mesh(newGeometry, dataMaterial);
  dataMesh.position.set(0, 0, 0);
  scene.add(dataMesh);

  // const floorGeometry = new THREE.PlaneGeometry(8000, 8000);
  // const floorMaterial = new THREE.MeshPhongMaterial({
  //   color: 0x857ebb,
  //   shininess: true,
  // });
  // const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  // floor.rotation.x = -0.5 * Math.PI;
  // floor.receiveShadow = true;
  // floor.position.y = -0.501; // Modified. Now the problem is that it's invisible.
  // scene.add(floor);

  const control = new OrbitControls(camera, renderer.domElement);
  control.enableDamping = true;

  function animate() {
    control.update();

    // // targetRenderer.render(renderTargetScene, camera);
    // renderer.setRenderTarget(renderTarget);
    // renderer.render(renderTargetScene, camera);
    // renderer.setRenderTarget(null);
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