import Canvas from './Canvas';

export default class Page {
  constructor() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    const dpr = window.devicePixelRatio;

    this.canvas = new Canvas({
      w: this.w,
      h: this.h,
      dpr: dpr,
      eContainer: document.getElementById('canvas-container')
    });

    window.addEventListener('mousemove', e => { this.canvas.mouseMoved(e.clientX, e.clientY); });
    window.addEventListener('mousedown', e => { this.canvas.mousePressed(e.clientX, e.clientY); });
    window.addEventListener('mouseup', e => { this.canvas.mouseReleased(e.clientX, e.clientY); });
    window.addEventListener('resize', e => { this.resized(); });
  }

  resized() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;

    this.canvas.resize( this.w, this.h );
  }
};