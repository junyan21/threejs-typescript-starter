import * as THREE from "three"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass'
import { LuminosityHighPassShader } from 'three/examples/jsm/shaders/LuminosityHighPassShader'

import SimplexNoise from 'simplex-noise'

import { TorusMesh, TorusMaterial } from './components/torus'

const noise = new SimplexNoise()

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
    // Onにするとめっちゃ重い
    // antialias: true,
    // alpha: true
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
controls.autoRotate = true

// 背景
_scene.background = new THREE.TextureLoader().load('../assets/ramen.jpeg')

// Torus
_scene.add(TorusMesh)
const _clock = new THREE.Clock()

const animate = () => {
      requestAnimationFrame(() => {
        _composer.render()
        TorusMaterial.uniforms.uTime.value = _clock.getElapsedTime()
        animate()

        if (_audio.isPlaying) {
          const freqs = _analyzeAudio()
          console.log(` ${freqs.lowerAvgFr}, ${freqs.lowerMaxFr}, ${freqs.upperAvgFr}, ${freqs.upperMaxFr} `)
          _mapFreqsToTorus(TorusMesh, modulate(Math.pow(freqs.lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(freqs.upperAvgFr, 0, 1, 0, 4))
        }
    })
}

const _audio = new THREE.Audio(new THREE.AudioListener())
const _analyzer = new THREE.AudioAnalyser(_audio, 128) // Analyzerは毎回の描画ループで再生成せずに同じものを保持する

const _loadAudio = (sound: THREE.Audio<GainNode>) => {
  const audioLoader = new THREE.AudioLoader()
  audioLoader.load('../assets/herb.mp3', buffer => {
    sound.setBuffer(buffer)
    sound.setLoop(true)
    sound.setVolume(1)
    sound.play()
  }, req => {
    console.log(req.loaded / req.total)
  },error => {
    console.log("file read error: " + error)
  })
}

const _analyzeAudio = () => {
  const dataArray = _analyzer.getFrequencyData()

  // ここからは波形データから加工
  // ref: https://codepen.io/prakhar625/pen/zddKRj?editors=1010
  const lowerHalf = dataArray.slice(0, dataArray.length / 2 - 1)
  const upperHalf = dataArray.slice(dataArray.length / 2 - 1, dataArray.length - 1)
  
  const overallAvg = avg(dataArray)
  const lowerMax = max(lowerHalf)
  const lowerAvg = avg(lowerHalf)
  const upperMax = max(upperHalf)
  const upperAvg = avg(upperHalf)

  const lowerMaxFr = lowerMax / lowerHalf.length
  const lowerAvgFr = lowerAvg / lowerHalf.length
  const upperMaxFr = upperMax / upperHalf.length
  const upperAvgFr = upperAvg / upperHalf.length

  return { lowerMaxFr, lowerAvgFr, upperMaxFr, upperAvgFr }
}

const _mapFreqsToTorus = (mesh:  THREE.Mesh<THREE.TorusGeometry, THREE.ShaderMaterial>, bassFr: number, treFr: number) => {  
  // 最新バージョンのthreeでは、THREE.GeometoryからTHREE.BufferGeometryにIFが切り替わっているので、それ用の値のセットの仕方でやる
  // https://sbcode.net/threejs/geometry-to-buffergeometry/#explode-points
  const positions = mesh.geometry.attributes.position.array as Array<number>
  for (let i = 0; i < positions.length; i += 3) {
    // Vector3型で再現
    const v = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2])

    // 頂点座標の距離を変えて拡縮した見た目にする
    const offset = mesh.geometry.parameters.radius
    const amp = 7
    const time = window.performance.now()
    v.normalize()
    const rf = 0.00001
    const distance = (offset + bassFr) + noise.noise3D(v.x + time*rf*7, v.y + time*rf*8, v.z+time*rf*9) * amp * treFr
    v.multiplyScalar(distance)

    // Bufferに戻す
    positions[i] = v.x
    positions[i + 1] = v.y
    positions[i + 2 ] = v.z
  }
  mesh.geometry.attributes.position.needsUpdate = true
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
  _loadAudio(_audio)
    animate()
})



/*
 Helper Functions
 */
function fractionate(val: number, minVal: number, maxVal: number) {
    return (val - minVal)/(maxVal - minVal);
}

function modulate(val: number, minVal: number, maxVal: number, outMin: number, outMax: number) {
    var fr = fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    return outMin + (fr * delta);
}

function avg(arr: Uint8Array){
    var total = arr.reduce(function(sum, b) { return sum + b; });
    return (total / arr.length);
}

function max(arr: Uint8Array){
    return arr.reduce(function(a, b){ return Math.max(a, b); })
}