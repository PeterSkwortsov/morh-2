import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import GUI from "lil-gui";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import Stats from "stats.js";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const scene = new THREE.Scene()


const gui = new GUI()
const global = {}

const cubeTextureLoader = new THREE.CubeTextureLoader()
const rgbeLoader = new RGBELoader()



rgbeLoader.load('./urban_alley_01_1k.hdr', (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping
  scene.background = environmentMap
})



const ambientLight = new THREE.AmbientLight(0xffffff, 1)
ambientLight.visible = true
scene.add(ambientLight)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 7)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.setSize(window.innerWidth, window.innerHeight
)
document.body.appendChild(renderer.domElement)
renderer.shadowMap.enabled = true
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const directionalLight = new THREE.DirectionalLight('#ffffff', 3.3)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 3, 2.25)
scene.add(directionalLight)

// directionalLight.shadow.camera.top = 3
// directionalLight.shadow.camera.right = 6
// directionalLight.shadow.camera.left = -6
// directionalLight.shadow.camera.bottom = -3
// directionalLight.shadow.camera.far = 10


// material.envMapIntensity = 3
// material.roughness = 0.17
// material.metalness = 0.07
// material.clearcoat = 0.43
// material.iridescence = 1
// material.transmission = 1
// material.thickness = 5.12
// material.ior = 1.78

global.envMapIntensity = scene.environmentIntensity

// const updateAllMaterial = () => {
//   scene.traverse((child) => {
//     if (child.isMesh && child.material.isMeshStandardMaterial) {
//       child.material.environmentIntensity = global.environmentIntensity
//       child.scale.set(2.5, 2.5, 2.5)
//     }
//   })
// }

scene.environmentIntensity = 3

const cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial())
cube.castShadow = true
cube.receiveShadow = true
cube.position.set(-5, 0, 0)
scene.add(cube)

const torusKnot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1, 0.4, 128, 32),
  new THREE.MeshStandardMaterial()
)
torusKnot.castShadow = true
torusKnot.receiveShadow = true
scene.add(torusKnot)

const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshStandardMaterial())
sphere.position.set(5, 0, 0)
sphere.castShadow = true
sphere.receiveShadow = true
scene.add(sphere)

const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial())
floor.position.set(0, -2, 0)
floor.rotation.x = -Math.PI * 0.5
floor.castShadow = true
floor.receiveShadow = true
scene.add(floor)

cube.castShadow = true
cube.receiveShadow = false

torusKnot.castShadow = true
torusKnot.receiveShadow = true

sphere.castShadow = true
sphere.receiveShadow = false

floor.castShadow = false
floor.receiveShadow = true


// const geometries = []
// const material = new THREE.MeshNormalMaterial()

// for (let i = 0; i < 50; i++) {


//   const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)

//   geometry.rotateX(10 * Math.random())
//   geometry.rotateY(10 * Math.random())

//   geometry.translate(
//     (Math.random() - 0.5) * 10,
//     (Math.random() - 0.5) * 10,
//     (Math.random() - 0.5) * 10,
//     (Math.random() - 0.5) * Math.PI,
   
//   )

//   geometries.push(geometry)
// }

// const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries) // с помощью BufferGeometryUtils НЕ ЗАБУДЬ ИМПОРТИРОВАТЬ ЕЕ! Можно все оптимизировать
// const mesh = new THREE.Mesh(mergedGeometry, material)
// scene.add(mesh)


const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
const material = new THREE.MeshNormalMaterial()
const mesh = new THREE.InstancedMesh(geometry, material, 50)

for (let i = 0; i < 50; i++) {

  const position = new THREE.Vector3(
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
  )

  const quaternion = new THREE.Quaternion()
  quaternion.setFromEuler(new THREE.Euler(
    (Math.random() - 0.5) * Math.PI * 2, 
    (Math.random() - 0.5) * Math.PI * 2,
    0
  ))

  const matrix = new THREE.Matrix4()
  matrix.makeRotationFromQuaternion(quaternion)
  matrix.setPosition(position)
  mesh.setMatrixAt(i, matrix)

}
scene.add(mesh)











renderer.shadowMap.autoUpdate = false
renderer.shadowMap.needsUpdate = true



gui.add(renderer, 'toneMappingExposure').min(0).max(5).step(0.01)


gui.add(scene, 'backgroundBlurriness').min(0).max(2).step(0.01)
const clock = new THREE.Clock()

function animate() {
  stats.begin();

  const elapsedTime = clock.getElapsedTime()

  requestAnimationFrame(animate)

  if (torusKnot) {
    torusKnot.rotation.y = elapsedTime * 0.1

  }

  controls.update()

  renderer.render(scene, camera)
  stats.end();

}

animate()