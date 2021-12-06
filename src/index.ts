// Thanks to a blog post below: https://naokeyzmt.com/rogue/three-typescript/
import * as THREE from "three"

window.addEventListener('DOMContentLoaded', () => {
  
  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(640, 480)
  document.body.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(45, 640 / 480, 1, 10000)
  camera.position.set(0, 0, 1000)
  
  // Cube生成
  const geometry = new THREE.BoxGeometry(100, 100, 100)
  const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 })
  const cube = new THREE.Mesh(geometry, material)

  scene.add(cube)

  // Lightの生成
  const light = new THREE.DirectionalLight(0xffffff)
  light.position.set(1, 1, 1)
  scene.add(light)

  const tick = () => {
    requestAnimationFrame(tick)
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
    cube.rotation.z += 0.01

    renderer.render(scene, camera)
  }

  tick();

  
})
