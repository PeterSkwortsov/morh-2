import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import GUI from "lil-gui";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { Evaluator ,Brush, SUBTRACTION } from "three-bvh-csg";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from "three/examples/jsm/Addons.js";
import { DotScreenPass } from "three/examples/jsm/Addons.js";
import { GlitchPass } from "three/examples/jsm/Addons.js";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RGBShiftShader } from "three/examples/jsm/Addons.js";
import { GammaCorrectionShader } from "three/examples/jsm/Addons.js";
import { compress } from "three/examples/jsm/libs/fflate.module.js";
import { SMAAPass } from "three/examples/jsm/Addons.js";
import { texture, textureLoad, uniform } from "three/tsl";
import { TextureLoader } from "three/webgpu";

const gui = new GUI({ width: 325 });
const debugObject = {};

const textureLoader = new THREE.TextureLoader()
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const rgbeLoader = new RGBELoader();
// const dracoLoader = new DRACOLoader();
// dracoLoader.setDecoderPath("./draco/");
const gltfLoader = new GLTFLoader();
// gltfLoader.setDRACOLoader(dracoLoader);



gltfLoader.load(
  '/models/DamagedHelmet/glTF/DamagedHelmet.gltf',
  (gltf) => {
    gltf.scene.scale.set(2, 2, 2)
    gltf.scene.rotation.y = Math.PI * 1.3
    scene.add(gltf.scene)

    // updateAllMaterials()
  }
)


/**
 * Environment map
 */
rgbeLoader.load("./urban_alley_01_1k.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  // scene.backgroundBlurriness = 0.5;
  scene.environment = environmentMap;
});


//Mesh

const directionalLight = new THREE.DirectionalLight('#ffffff', 6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 3, - 2.25)
scene.add(directionalLight)


/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);

  effectComposer.setSize(sizes.width, sizes.height)
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
});






/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-10, 6, -2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);



const renderTarget = new THREE.WebGLRenderTarget(
  800, 
  600, 
  {
    samples: renderer.getPixelRatio() === 1 ? 2 : 0
  }
)  // это для сглаживания

const effectComposer = new EffectComposer(renderer, renderTarget) // применили renderTarget тут

effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height) 

const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

const dotScreenPass = new DotScreenPass()
dotScreenPass.enabled = false
effectComposer.addPass(dotScreenPass)

const glitchPass = new GlitchPass()
// glitchPass.goWild = true //будет все время гонять эту картинку
glitchPass.enabled = false
effectComposer.addPass(glitchPass)

const rGBShiftShader = new ShaderPass(RGBShiftShader)
rGBShiftShader.enabled = false
effectComposer.addPass(rGBShiftShader)

const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader)
effectComposer.addPass(gammaCorrectionPass)

const unrealBloomPass = new UnrealBloomPass()
unrealBloomPass.strength = 0.3
unrealBloomPass.radius = 1
unrealBloomPass.threshold = 0.6
effectComposer.addPass(unrealBloomPass)

gui.add(unrealBloomPass, 'enabled')
gui.add(unrealBloomPass, 'strength').min(0).max(2).step(0.01)
gui.add(unrealBloomPass, 'radius').min(0).max(2).step(0.01)
gui.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.01)


const TintSeader = {
  uniforms: {
    tDiffuse: {value: null},
    uTint: {value: null}
   },
  vertexShader: `
  varying vec2 vUv;

  void main() 
  {
    gl_Position = projectionMatrix * 
    modelViewMatrix * vec4(position, 1.0);

    vUv = uv;
  }
  `,
  fragmentShader: `
  uniform sampler2D tDiffuse;
  uniform vec3 uTint;

  varying vec2 vUv;

    void main()
    {
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb += uTint;

      gl_FragColor = color;
    }
  `
}

const tintPass = new ShaderPass(TintSeader)
tintPass.material.uniforms.uTint.value = new THREE.Vector3()
effectComposer.addPass(tintPass)

gui.add(tintPass.material.uniforms.uTint.value, 'x').min(-1).max(1).step(0.001).name('red')
gui.add(tintPass.material.uniforms.uTint.value, 'y').min(-1).max(1).step(0.001).name('green')
gui.add(tintPass.material.uniforms.uTint.value, 'z').min(-1).max(1).step(0.001).name('blue')

// ----------------------------------------

const DisplacementSheader = {
  uniforms: {
    tDiffuse: { value: null },
    uNormalMap: { value: null}  
  },
  vertexShader: `
  varying vec2 vUv;

  void main() 
  {
    gl_Position = projectionMatrix * 
    modelViewMatrix * vec4(position, 1.0);

    vUv = uv;
  }
  `,
  fragmentShader: `
  uniform sampler2D tDiffuse;
  uniform sampler2D uNormalMap;

  varying vec2 vUv;

    void main()
    {
      vec3 normalColor = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      vec2 newUv = vUv + normalColor.xy * 0.1;
      vec4 color = texture2D(tDiffuse, newUv);

      vec3 lightDirection = normalize(vec3(-1.0, 1.0, 0.0));
      float ligtness = clamp(dot(normalColor, lightDirection), 0.0, 1.0);
      color.rgb += ligtness * 2.0;
      gl_FragColor = color;
    }
  `
}

const displacementPass = new ShaderPass(DisplacementSheader)
displacementPass.material.uniforms.uNormalMap.value = textureLoader.load('./interfaceNormalMap.png')
effectComposer.addPass(displacementPass)

// ----------------------------------------


if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) 
{
  const smaaPass = new SMAAPass()
  effectComposer.addPass(smaaPass)
}


const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  //Unifroms
  // Update controls
  controls.update();

  // Render
// renderer.render(scene, camera)
effectComposer.render()
  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();