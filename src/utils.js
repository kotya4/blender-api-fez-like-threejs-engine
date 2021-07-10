import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';


export const DebugInfo = {
  queue: [],
};


export class Keyboard {
  constructor({ parent, listening }) {
    this.keys = {};
    this.onkeydown = (e) => {
      this.keys[e.code] = true;
      this.password = this.password.slice(1) + e.code[e.code.length-1];
      this.is_password_updated = true;
    };
    this.onkeyup = (e) => {
      this.keys[e.code] = false;
    };
    this.parent = parent || document;
    if (listening) this.listen();
    this.password = 'PASSWORDCAPACITY';
    this.is_password_updated = false;
  }


  listen() {
    this.parent.addEventListener('keydown', this.onkeydown);
    this.parent.addEventListener('keyup', this.onkeyup);
  }


  forget() {
    this.parent.removeEventListener('keydown', this.onkeydown);
    this.parent.removeEventListener('keyup', this.onkeyup);
  }


  get_password(str) {
    if (!this.is_password_updated) return false;
    if (this.password.lastIndexOf(str) === this.password.length - str.length) {
      this.is_password_updated = false;
      return true;
    }
    return false;
  }
}


export class GLTFAnimation {
  constructor(mesh, animations) {
    this.mixer = new THREE.AnimationMixer(mesh);
    this.actions = {};
    for (let a of animations) this.actions[a.name] = this.mixer.clipAction(a);
    this.current_action = this.actions[Object.keys(this.actions)[0]];
    this.current_action.play();
    this.tid = null;
  }


  change(name, fadeout_secs, fadein_secs) {
    if (this.actions[name] === this.current_action) return; // prevent multi-call

    if (null != this.tid) {
      clearTimeout(this.tid);
      this.tid = null;
    }

    if (!(name in this.actions)) {
      this.current_action.stop();
      return false;
    }

    const prev_action = this.current_action.fadeOut(fadeout_secs);
    this.tid = setTimeout(() => {
      prev_action.stop();
      this.tid = null;
    }, fadeout_secs * 1000);
    this.current_action = this.actions[name];
    this.current_action.fadeIn(fadein_secs);
    this.current_action.play();
    return true;
  }


  update(elapsed) {
    this.mixer.update(elapsed);
  }
}
