import * as THREE from "three"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass'
import {LuminosityHighPassShader} from 'three/examples/jsm/shaders/LuminosityHighPassShader'

const _VS = `
varying vec2 vUv;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  vUv = uv;
}
`

const _FS = `
#include <common>
uniform sampler2D tDiffuse;
varying vec2 vUv;
void main() {
  vec4 diffuse = texture2D(tDiffuse, vUv);
  gl_FragColor = (diffuse - 0.5) * 4.0 + 0.5;
}
`

const CrapShader = {
  uniforms: {
    tDiffuse: null,
  },
  vertexShader: _VS,
  fragmentShader: _FS,
};

// GLRenderer
const _renderer = (() => {
  const r = new THREE.WebGLRenderer({
    antialias: true
  })
  r.shadowMap.enabled = true
  r.shadowMap.type = THREE.PCFSoftShadowMap
  r.setPixelRatio(window.devicePixelRatio)
  r.setSize(window.innerWidth, window.innerHeight)
  return r
})()
// これがないと描画されない
document.body.appendChild(_renderer.domElement)

// カメラ
const _camera = (() => {
  const fov = 60
  const aspect = 1920 / 1080
  const near = 1.0
  const far = 500.
  return new THREE.PerspectiveCamera(fov, aspect, near, far)
})()

// シーン
const _scene = new THREE.Scene()

// コンポーザー
const _composer = new EffectComposer(_renderer)
_composer.addPass(new RenderPass(_scene, _camera))
_composer.addPass(new UnrealBloomPass(new THREE.Vector2(1024, 1024), 2.0, 0.0, 0.75))
_composer.addPass(new GlitchPass())
_composer.addPass(new ShaderPass(CrapShader))

// ライト
const _light = (() => {
  const l = new THREE.DirectionalLight(0xffffff, 1.0)
  l.position.set(20, 100, 10)
  l.target.position.set(0, 0, 0)
  l.castShadow = true
  l.shadow.bias = -0.001
  // l.shadow.map.width = 2048
  // l.shadow.map.height = 2048
  l.shadow.camera.near = 0.5
  l.shadow.camera.far = 500.0
  l.shadow.camera.left = 100
  l.shadow.camera.right = -100
  l.shadow.camera.top = 100
  l.shadow.camera.bottom = -100
  return l
})()
_scene.add(_light)
 
// マウスでのインタラクティブ操作
const controls = new OrbitControls(_camera, _renderer.domElement)
controls.target.set(0, 20, 0)
controls.update()

// 背景
_scene.background = new THREE.TextureLoader().load('../assets/ramen.jpeg')

// 3Dオブジェクト
const knot = (() => {
  const k = new THREE.Mesh(
    new THREE.TorusKnotGeometry(5, 1.5, 100, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  )
  k.position.set(0, 15, 0)
  k.castShadow = true
  k.receiveShadow = true
  return k
})()
_scene.add(knot)

const animate = () => {
      requestAnimationFrame(() => {
        _composer.render()
        animate()
    })
}

// Windowサイズ変更コールバック
window.addEventListener('resize', () => {
  const {innerWidth, innerHeight} = window
  _camera.aspect = innerWidth / innerHeight
  _camera.updateProjectionMatrix()
  _renderer.setSize(innerWidth, innerHeight)
  _composer.setSize(innerWidth, innerHeight)
}, false)


let app = null
window.addEventListener('DOMContentLoaded', () => {
  animate()
})