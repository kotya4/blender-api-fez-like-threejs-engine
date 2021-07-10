import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';

import { Settings } from './settings.js';
import { Keyboard } from './utils.js';
import { DebugInfo } from './utils.js';
import { Ortho } from './ortho.js';
import { ProjectedObjects } from './projectedobjects.js';


export class Player {
  constructor({ level, orthocamera }) {

    const camera_width  = 20;
    const camera_height = 20;
    this.camera = new THREE.OrthographicCamera(
      -camera_width/2, +camera_width/2,
      +camera_height/2, -camera_height/2,
      1, 1000);

    this.ortho = new Ortho(camera_width, camera_height, 50);

    this.keyboard = new Keyboard({ listening: true });

    console.log(Settings);

    this.url      = Settings.blend['a_erle_1'].glb;
    this.mesh     = null;
    this.level    = null;
    this.po       = null;

    this.size = new THREE.Vector3(1, 2, 1);
    this.bbox = new THREE.Box3();

    // HACK: hardcoded player preparition, must be changed later?
    (new GLTFLoader()).load(
      this.url,
      // on success
      gltf => {
        console.log(`Player prepared`);
        this.mesh = gltf.scene; // apply mesh, same as is_prepared === true
        this.mesh.name = 'playermesh';
        console.log(this.mesh);

        level.load_for(this); // request for the certain level to be loaded
      },
      // on progress
      xhr  => {

      },
      // on error
      err  => {
        console.log(`Player cannot be prepared`);
        console.log(err);
      },
    );
  }


  init_projected_objects(objects) {
    this.po = new ProjectedObjects(objects);
    this.update_bounding_box();
    this.po.recalc_projection(this.bbox, this.ortho.normal.x, this.ortho.normal.z);
  }


  get is_prepared() {
    return this.mesh !== null && this.level && this.level.is_loaded;
  }


  get position() {
    return this.mesh.position;
  }


  start_rotation(direction) {
    if (this.ortho.start_rotation_routine(direction)) {
      const ndx = Math.sin(this.ortho.rotates_to);
      const ndz = Math.cos(this.ortho.rotates_to);
      this.po.recalc_projection(this.bbox, ndx, ndz);
    }
  }


  move(x, y, deltas) {
    const speed = 5;
    deltas.x += x * Math.round(this.ortho.tangent.x) * speed;
    deltas.y += y * speed;
    deltas.z += x * Math.round(this.ortho.tangent.z) * speed;
    return deltas;
  }


  proc_moving(deltas) {
    if (deltas.x || deltas.y || deltas.z) {
      const p_bbox_min_y = this.bbox.min.y;
      const p_bbox_max_y = this.bbox.max.y;
      // horisontal test
      this.position.x += deltas.x;
      this.position.z += deltas.z;
      this.update_bounding_box();
      this.po.collision_test('HORISONTAL', this.bbox, this.size, this.position, deltas);
      // vertical test
      this.position.y += deltas.y;
      this.update_bounding_box();
      this.po.collision_test('VERTICAL', this.bbox, this.size, this.position, deltas, p_bbox_min_y, p_bbox_max_y);
      // update bounding box after tests
      this.update_bounding_box();
    }
  }


  update(elapsed) {
    // camera is rotating
    if (this.ortho.update_rotation_routine(elapsed)) {

      this.po.update_projection(this.ortho.ndr);

    }
    // camera not rotating
    else {

      const deltas = new THREE.Vector3(0, 0, 0); // delta position
      if (this.keyboard.keys['KeyA']) this.move(+1, +0, deltas);
      if (this.keyboard.keys['KeyD']) this.move(-1, +0, deltas);
      if (this.keyboard.keys['KeyW']) this.move(+0, +1, deltas);
      if (this.keyboard.keys['KeyS']) this.move(+0, -1, deltas);
      deltas.x *= elapsed;
      deltas.y *= elapsed;
      deltas.z *= elapsed;
      this.proc_moving(deltas);

      if (this.keyboard.keys['KeyQ']) this.start_rotation(-1);
      if (this.keyboard.keys['KeyE']) this.start_rotation(+1);

    }

    this.ortho.translate_to(this.position);
    this.ortho.apply_to_camera(this.camera);

    if (this.keyboard.get_password('ABC')) {
      console.log('abc pass');
    } else {
      this.keyboard.is_password_updated = false;
    }

    // DEBUG:
    // if (this.bboxhelper == null) {
    //   this.bboxhelper = new THREE.Box3Helper(this.bbox, 0xffff00);
    //   this.level.scene.add(this.bboxhelper);
    // }
    // this.bboxhelper.box = this.bbox;
  }


  update_bounding_box(dx=0, dy=0, dz=0) {
    this.bbox.min.x = dx + this.mesh.position.x - this.size.x * 0.5;
    this.bbox.min.y = dy + this.mesh.position.y - this.size.y * 0.0;
    this.bbox.min.z = dz + this.mesh.position.z - this.size.z * 0.5;
    this.bbox.max.x = dx + this.mesh.position.x + this.size.x * 0.5;
    this.bbox.max.y = dy + this.mesh.position.y + this.size.y * 1.0;
    this.bbox.max.z = dz + this.mesh.position.z + this.size.z * 0.5;
  }
}
