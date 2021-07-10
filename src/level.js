import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';

import { Settings } from './settings.js';


export class Level {
  constructor({ name }) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbfb395);
    this.add_default_light();

    this.name  = name;
    this.url   = Settings.blend[name].glb;
    this.props = Settings.blend[name].props;

    this.gltfxhr  = null; // see ".loaded" and ".total"
    this.gltf     = null;

    this.is_loaded = false;

    this.objects = null;

  }


  async load_for(player) {
    this.is_loaded = false;
    await this.prepare();     // load model if needed
    this.player = player;
    this.player.level = this;
    this.init_scene();        // add objects in scene
    this.is_loaded = true;    // now level is loaded
    // TODO: add player.level in a queue to free allocated memory.
    //       scene has to be cleared too, objects disposed.
  }


  // Asynchronously loads gltf model.
  prepare() {
    if (this.gltf !== null) return true; // models are already loaded

    return new Promise(res =>
      (new GLTFLoader()).load(
        this.url,
        // on success
        gltf => {
          console.log(`Level ${this.name} prepared`);
          this.gltf = gltf;
          res();
        },
        // on progress
        xhr  => {
          this.gltfxhr = xhr;
        },
        // on error
        err  => {
          console.log(`Level ${this.name} cannot be prepared`);
          console.log(err);
        },
      )
    );
  }


  init_scene() {
    this.scene.add(this.gltf.scene);
    this.scene.add(this.player.mesh);

    this.objects = this.gltf.scene.children.map((e,i) => ({
      name: e.name,
      prop: this.props[e.name],
      mesh: e,
      bbox: new THREE.Box3().setFromObject(e),
    }));

    this.player.init_projected_objects(this.objects);

    // DEBUG:
    this.scene.add(new THREE.AxesHelper());
  }


  process_all(elapsed) {
    this.player.update(elapsed);
  }


  add_default_light() {
    const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient_light);

    // const directional_light = new THREE.DirectionalLight(0xffffff, 1.0);
    // directional_light.position.set(1, 1, 1);
    // this.scene.add(directional_light);

    const point_light = new THREE.PointLight(0xffffff, 1, 50);
    point_light.position.set(0, 3, 0);
    this.scene.add(point_light);
  }
}
