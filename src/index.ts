// Thanks to a blog post below: https://naokeyzmt.com/rogue/three-typescript/
import * as THREE from "three"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"

import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass'
import {LuminosityHighPassShader} from 'three/examples/jsm/shaders/LuminosityHighPassShader'
import { Light, Plane, PlaneBufferGeometry } from "three"

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

class PostProsessingDemo {
  constructor() {
    this._initialize()
  }

  _renderer = new THREE.WebGLRenderer({
    antialias: true
  })
  
  _camera = (() => {
    const fov = 60
    const aspect = 1920 / 1080
    const near = 1.0
    const far = 500.
    return new THREE.PerspectiveCamera(fov, aspect, near, far)
  })()

  _scene = new THREE.Scene()

  _composer = new EffectComposer(this._renderer)

  _initialize = () => {
    this._renderer.shadowMap.enabled = true
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this._renderer.setPixelRatio(window.devicePixelRatio)
    this._renderer.setSize(window.innerWidth, window.innerHeight)

    // これがないと描画されない
    document.body.appendChild(this._renderer.domElement)

    // Windowサイズ変更コールバック
    window.addEventListener('resize', this._onWindowResize, false)

    this._camera.position.set(75, 20, 0)

    this._composer.addPass(new RenderPass(this._scene, this._camera))
    this._composer.addPass(new UnrealBloomPass(new THREE.Vector2(1024, 1024), 2.0, 0.0, 0.75))
    this._composer.addPass(new GlitchPass())
    this._composer.addPass(new ShaderPass(CrapShader))

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

    this._scene.add(_light)

    const controls = new OrbitControls(this._camera, this._renderer.domElement)
    controls.target.set(0, 20, 0)
    controls.update()

    this._scene.background = new THREE.TextureLoader().load('../assets/ramen.jpeg')

    // 3Dオブジェクトの下の平面
    // const plane = (() => {
    //   const p = new THREE.Mesh(
    //     new THREE.PlaneGeometry(1000, 1000, 10, 10),
    //     new THREE.MeshStandardMaterial({
    //       color: 0x808080
    //     }))
    //   p.castShadow = false
    //   p.receiveShadow = true
    //   p.rotation.x = -Math.PI / 2
    //   return p
    // })()
    // this._scene.add(plane)

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
    this._scene.add(knot)

    // 箱型の物体を並べて表示
    // for (let x = -8; x < 8; x++) {
    //   for (let y = -8; y < 8; y++) {
    //     const box = new THREE.Mesh(
    //       new THREE.BoxGeometry(2, 10, 2),
    //       new THREE.MeshStandardMaterial({
    //         color: 0x808080
    //       }))
    //     box.position.set(Math.random() * 20, Math.random() * 4.0 + 5.0, Math.random() + y * 20)
    //     box.castShadow = true
    //     box.receiveShadow = true
    //     this._scene.add(box)
    //   }
    // }

    this._requestAnimationFrame()
  }

  _onWindowResize = () => {
    const {innerWidth, innerHeight} = window
    this._camera.aspect = innerWidth / innerHeight
    this._camera.updateProjectionMatrix()
    this._renderer.setSize(innerWidth, innerHeight)
    this._composer.setSize(innerWidth, innerHeight)
  }

  _requestAnimationFrame = () => {
    requestAnimationFrame(() => {
      this._composer.render()
      this._requestAnimationFrame()
    })
  }
}

let app = null

window.addEventListener('DOMContentLoaded', () => {
  app = new PostProsessingDemo()
  console.log(app)
})
