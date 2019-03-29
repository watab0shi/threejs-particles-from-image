import { loadImageData } from '../../loadImageData';

import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera';
import { Scene } from 'three/src/scenes/Scene';
import { BufferGeometry } from 'three/src/core/BufferGeometry';
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute';
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial';
import { Points } from 'three/src/objects/Points';
import { Vector2 } from 'three/src/math/Vector2';
import { Vector3 } from 'three/src/math/Vector3';
import { _Math } from 'three/src/math/Math';
import { OrbitControls } from './OrbitControls';

import vertexSource from './shaders/shader.vert';
import fragmentSource from './shaders/shader.frag';

export default class Canvas {
  constructor({ w, h, dpr, eContainer }) {
    // ウィンドウサイズ
    this.w = window.innerWidth;
    this.h = window.innerHeight;

    this.mouse = new Vector2(.5, .5);

    // レンダラーを作成
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(this.w, this.h);// 描画サイズ
    this.renderer.setPixelRatio(dpr);// ピクセル比

    // eContainerにレンダラーのcanvasを追加
    eContainer.appendChild(this.renderer.domElement);

    const fov    = 60;
    const fovRad = (fov / 2) * (Math.PI / 180);// 視野角をラジアンに変換
    const dist   = (this.h / 2) / Math.tan(fovRad);// ウィンドウぴったりのカメラ距離
    // カメラを作成 (視野角, 画面のアスペクト比, カメラに映る最短距離, カメラに映る最遠距離)
    this.camera = new PerspectiveCamera(60, this.w / this.h, 1, dist * 3);
    this.camera.position.z = dist;// カメラを遠ざける

    this.controls = new OrbitControls(this.camera);
    this.controls.update();

    loadImageData('/resource/img/logo_512.png')
      .then(imageData => {
        // console.log(imageData);
        this.start(imageData);
      })
      .catch(e => {
        console.log('loadImageData', e);
      });
  }

  start(imageData) {
    const pixels = imageData.data;
    const imgW = imageData.width;
    const imgH = imageData.height;

    const geo = new BufferGeometry();
    this.defaultPositions = [];
    this.randomPositions = [];
    const colors = [];
    const sizes = [];
    this.easings = [];

    const pixelScale = 1.;

    for(let i = 0; i < (imgW * imgH); ++i) {
      const r = pixels[i * 4    ] / 255;
      const g = pixels[i * 4 + 1] / 255;
      const b = pixels[i * 4 + 2] / 255;
      const a = pixels[i * 4 + 3] / 255;
      if(a < 0.2) continue;

      let x = (i % imgH) * pixelScale;
      let y = parseInt(i / imgW) * pixelScale;

      const yy = Math.floor(i / imgW) * .05;

      this.easings.push(.05 + yy * 0.02);

      x -= imgW * .5 * pixelScale;
      y = -y + imgH * .5 * pixelScale;

      this.defaultPositions.push(x, y, 0.);
      colors.push(r, g, b);
      sizes.push(1 * a);

      const tx = _Math.randFloatSpread(this.w * .5);
      const ty = _Math.randFloatSpread(this.w * .5);
      const tz = _Math.randFloatSpread(this.w * .5);
      this.randomPositions.push(tx, ty, tz);
    }

    const vertices = this.defaultPositions;
    this.targets = this.defaultPositions;

    geo.addAttribute('position', new Float32BufferAttribute(vertices, 3));
    geo.addAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.addAttribute('size', new Float32BufferAttribute(sizes, 1));

    geo.attributes.position.setDynamic(true);

    this.uniforms = {
      uTime: {
        value: 0.0
      },
      uMouse: {
        value: new Vector2(.5, .5)
      }
    };

    const mat = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexSource,
      fragmentShader: fragmentSource,
      transparent: true
    });

    this.points = new Points( geo, mat );

    this.scene = new Scene();
    this.scene.add( this.points );
    
    // 画面に表示
    this.render();

    console.log( this );
  }

  get numParticles() {
    return this.points.geometry.attributes.position.array.length;
  }

  render() {
    requestAnimationFrame( () => { this.render(); } );

    this.controls.update();

    const pos = this.points.geometry.attributes.position;

    for(let i = 0; i < pos.array.length; ++i) {
      pos.array[i] += ( this.targets[i] - pos.array[i] ) * this.easings[parseInt(i / 4)];
    }
    pos.needsUpdate = true;

    const sec = performance.now() * .001;

    this.uniforms.uTime.value = sec;
    this.uniforms.uMouse.value.lerp(this.mouse, .2);

    this.renderer.render(this.scene, this.camera);
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
    this.renderer.setSize(this.w, this.h);

    const fov    = this.camera.fov;
    const fovRad = (fov / 2) * (Math.PI / 180);
    const dist   = (this.h / 2) / Math.tan(fovRad);
    this.camera.position.z = dist;
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
  }

  mouseMoved(x, y) {
    this.mouse.x =  x - (this.w / 2);// 原点を中心に持ってくる
    this.mouse.y = -y + (this.h / 2);// 軸を反転して原点を中心に持ってくる
  }
  mousePressed(x, y) {
    this.mouseMoved(x, y);
    this.targets = (this.targets === this.randomPositions) ? this.defaultPositions : this.randomPositions;
  }
  mouseReleased(x, y) {
    this.mouseMoved(x, y);
    // this.targets = this.defaultPositions;
  }
};
