import * as THREE from 'three'
// @ts-ignore
import vertexShader from './shaders/vertex.vert'
// @ts-ignore
import fragmentShader from './shaders/fragment.frag'

const geometry = new THREE.TorusGeometry(3, 1, 100, 100)

const texture = new THREE.TextureLoader().load('../../assets/profile.jpg', (texture) => {
  texture.minFilter = THREE.NearestFilter
})

export const TorusMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uTexture: { value: texture },
  },
  transparent: true,
  side: THREE.DoubleSide
})

export const TorusMesh = new THREE.Mesh(geometry, TorusMaterial)

