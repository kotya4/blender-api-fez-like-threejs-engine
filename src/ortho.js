import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';


// Ortho manages the objects projection, provides rotation routines, etc.
export class Ortho {
  constructor(width, height, radius) {

    this.width  = width;
    this.height = height;
    this.radius = radius;

    this.ndr        = 0;
    this.rotation   = 0;
    this.rotates_to = 0;

    this.origin  = new THREE.Vector3(0, 0, 0);
    this.tangent = new THREE.Vector3(0, 0, 0);
    this.normal  = new THREE.Vector3(0, 0, 0);

    // updates tangent and normal vectors
    this.tangent.x = Math.sin(this.rotation - Math.PI / 2);
    this.tangent.z = Math.cos(this.rotation - Math.PI / 2);
    this.normal.x  = Math.sin(this.rotation);
    this.normal.z  = Math.cos(this.rotation);

  }


  start_rotation_routine(direction) {
    if (this.ndr !== 0) return false; // do not start if already rotating
    this.rotates_to = this.rotation + (Math.PI / 2) * direction;
    this.ndr = 1;
    return true;
  }


  update_rotation_routine(elapsed) {
    if (this.ndr === 0) return false; // do not update anything if not rotating
    const speed = 2 * elapsed;
    // delta rotation
    const dr = Math.abs(this.rotates_to - this.rotation);
    if (dr > 0.1) {
      this.rotation += Math.sign(this.rotates_to - this.rotation) * speed;
      // normalized delta rotation
      this.ndr = dr / (Math.PI / 2);
    } else {
      this.rotation = this.rotates_to % (Math.PI * 2);
      this.ndr = 0;
      // update tangent vector
      this.tangent.x = Math.sin(this.rotation - Math.PI / 2);
      this.tangent.z = Math.cos(this.rotation - Math.PI / 2);
    }
    // update normal vector
    this.normal.x = Math.sin(this.rotation);
    this.normal.z = Math.cos(this.rotation);
    return true;
  }


  apply_to_camera(camera) {
    camera.position.x = this.origin.x + this.radius * this.normal.x;
    camera.position.y = this.origin.y;
    camera.position.z = this.origin.z + this.radius * this.normal.z;
    camera.lookAt(this.origin);
  }


  translate_to(pos) {
    this.origin.x = pos.x;
    this.origin.y = pos.y;
    this.origin.z = pos.z;
  }
}
