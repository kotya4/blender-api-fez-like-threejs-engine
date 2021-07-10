import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';


// Each movable object has to have own instance of ProjectedObjects.
export class ProjectedObjects {
  constructor(objects) {

    // TODO: т.к. проекций всего 4, то можно каждую из них предвычислить в Level.
    //       Однако что тогда делать с растущими объектами? Ведь они зависят от
    //       положения игрока.

    // props list:
    // SOLID           runs "proc_intersection" and deny depthing
    // DO_NOT_SHRINK   deny MUST_BE_SHRINKED applying

    this.FLGS = {

      COVERS_PLAYER:    0b00000010,
      MUST_BE_SHRINKED: 0b00000100,
      FULLY_COVERED:    0b00001000,

    };

    this.objects = objects.map(o => ({

      ...o,
      link: o,
      oldflgs: 0,
      flgs: 0,
      obox: null,

    }));

    this.z_as_x     = null;
    this.z_inverted = null;

  }


  create_orthobox(bbox, z_as_x, z_inverted) {
    const obox = new THREE.Box3();
    obox.min.x = bbox.min.x;
    obox.max.x = bbox.max.x;
    obox.min.y = bbox.min.y;
    obox.max.y = bbox.max.y;
    obox.min.z = bbox.min.z;
    obox.max.z = bbox.max.z;
    if (z_as_x) {
      obox.min.x = bbox.min.z;
      obox.max.x = bbox.max.z;
      obox.min.z = bbox.min.x;
      obox.max.z = bbox.max.x;
    }
    if (z_inverted) {
      [obox.min.z, obox.max.z] = [obox.max.z, obox.min.z];
    }
    return obox;
  }


  recalc_projection(p_bbox, ndx, ndz) {
    const z_as_x     = Math.round(ndz) === 0;
    const z_inverted = Math.round(ndx) > 0 || Math.round(ndz) > 0;
    this.z_as_x      = z_as_x;
    this.z_inverted  = z_inverted;

    const p_obox = this.create_orthobox(p_bbox, z_as_x, z_inverted);

    for (let i = 0; i < this.objects.length; ++i) {
      const o = this.objects[i];
      o.oldflgs = o.flgs;
      o.flgs = 0;
      o.obox = this.create_orthobox(o.bbox, z_as_x, z_inverted);;

      const intersects_x = o.obox.min.x < p_obox.min.x && p_obox.min.x < o.obox.max.x
                        || o.obox.min.x < p_obox.max.x && p_obox.max.x < o.obox.max.x
                        || p_obox.min.x < o.obox.min.x && o.obox.min.x < p_obox.max.x
                        || p_obox.min.x < o.obox.max.x && o.obox.max.x < p_obox.max.x;
      const intersects_y = o.obox.min.y < p_obox.min.y && p_obox.min.y < o.obox.max.y
                        || o.obox.min.y < p_obox.max.y && p_obox.max.y < o.obox.max.y
                        || p_obox.min.y < o.obox.min.y && o.obox.min.y < p_obox.max.y
                        || p_obox.min.y < o.obox.max.y && o.obox.max.y < p_obox.max.y;

      if (intersects_x && intersects_y) {
        // if player at least partially covered by object then object is flimsy
        o.flgs |= this.FLGS.COVERS_PLAYER;

        if (o.obox.min.z < p_obox.min.z ^ z_inverted) {

          // if object nearer than player then object must be shrinked
          if (!o.prop.DO_NOT_SHRINK) {
            o.flgs |= this.FLGS.MUST_BE_SHRINKED;
          }

        }
      }

      this.proc_object_covering(o, i, z_as_x, z_inverted);

    }

    // sort by depth (far index < near index)
    this.objects = this.objects.sort((a,b) =>
      z_inverted ?
        a.obox.min.z - b.obox.min.z :
        b.obox.min.z - a.obox.min.z);
  }


  proc_object_covering(o, i, z_as_x, z_inverted) {
    if (o.flgs & this.FLGS.MUST_BE_SHRINKED) return; // shrinked cannot cover, so skip.
    for (let k = 0; k < i; ++k) {
      const u = this.objects[k];
      if (u.flgs & this.FLGS.FULLY_COVERED || u.flgs & this.FLGS.MUST_BE_SHRINKED) continue; // already shrinked or covered, skip.
      const OminXinU = u.obox.min.x <= o.obox.min.x && o.obox.min.x <= u.obox.max.x;
      const OmaxXinU = u.obox.min.x <= o.obox.max.x && o.obox.max.x <= u.obox.max.x;
      const OminYinU = u.obox.min.y <= o.obox.min.y && o.obox.min.y <= u.obox.max.y;
      const OmaxYinU = u.obox.min.y <= o.obox.max.y && o.obox.max.y <= u.obox.max.y;
      const UminXinO = o.obox.min.x <= u.obox.min.x && u.obox.min.x <= o.obox.max.x;
      const UmaxXinO = o.obox.min.x <= u.obox.max.x && u.obox.max.x <= o.obox.max.x;
      const UminYinO = o.obox.min.y <= u.obox.min.y && u.obox.min.y <= o.obox.max.y;
      const UmaxYinO = o.obox.min.y <= u.obox.max.y && u.obox.max.y <= o.obox.max.y;
      // another object nearer than current object
      if (u.obox.min.z < o.obox.min.z ^ z_inverted) {
        // current object fully covered with another object
        if (OminXinU && OminYinU && OmaxXinU && OmaxYinU) {

          o.flgs |= this.FLGS.FULLY_COVERED;
          break;

        }
        // current object partially covered with another object
        if ((OminXinU || OmaxXinU || UminXinO || UmaxXinO)
        &&  (OminYinU || OmaxYinU || UminYinO || UmaxYinO))
        {

          // TODO: remove from o.obox part of u.obox

        }
      }
      // current object nearer than another object
      else {
        // another object fully covered with current object
        if (UminXinO && UminYinO && UmaxXinO && UmaxYinO) {

          u.flgs |= this.FLGS.FULLY_COVERED;
          continue;

        }
        // another object partially covered with current object
        if ((OminXinU || OmaxXinU || UminXinO || UmaxXinO)
        &&  (OminYinU || OmaxYinU || UminYinO || UmaxYinO))
        {

          // TODO: remove from u.obox part of o.obox

        }
      }
    }
  }


  collision_test(dir, p_bbox, p_size, p_pos, p_dpos, p_bbox_min_y, p_bbox_max_y) {
    const z_as_x      = this.z_as_x;
    const z_inverted  = this.z_inverted;
    const p_obox      = this.create_orthobox(p_bbox, z_as_x, z_inverted);
    const p_offset    = (z_as_x ? p_size.x : p_size.z) / 2 * (z_inverted ? +1 : -1);

    for (let i = 0; i < this.objects.length; ++i) {
      const o = this.objects[i];

      const intersects_x = o.obox.min.x < p_obox.min.x && p_obox.min.x < o.obox.max.x
                        || o.obox.min.x < p_obox.max.x && p_obox.max.x < o.obox.max.x
                        || p_obox.min.x < o.obox.min.x && o.obox.min.x < p_obox.max.x
                        || p_obox.min.x < o.obox.max.x && o.obox.max.x < p_obox.max.x;
      const intersects_y = o.obox.min.y < p_obox.min.y && p_obox.min.y < o.obox.max.y
                        || o.obox.min.y < p_obox.max.y && p_obox.max.y < o.obox.max.y
                        || p_obox.min.y < o.obox.min.y && o.obox.min.y < p_obox.max.y
                        || p_obox.min.y < o.obox.max.y && o.obox.max.y < p_obox.max.y;

      if (intersects_x && intersects_y) {

        if (!(o.flgs & this.FLGS.COVERS_PLAYER)
        &&  !(o.flgs & this.FLGS.MUST_BE_SHRINKED)
        &&  !(o.flgs & this.FLGS.FULLY_COVERED))
        {
          // collision test
          if (o.prop.SOLID) {
            this.proc_intersection(o, dir, p_bbox, p_size, p_pos, p_dpos, p_bbox_min_y, p_bbox_max_y);
          }
          // depthing
          else {
            if (z_as_x) p_pos.x = o.obox.min.z + p_offset;
            else        p_pos.z = o.obox.min.z + p_offset;
          }
        }

      } else {

        o.flgs &= ~this.FLGS.COVERS_PLAYER;

      }
    }
  }


  proc_intersection(o, dir, p_bbox, p_size, p_pos, p_dpos, p_bbox_min_y, p_bbox_max_y) {
    if (dir === 'HORISONTAL') {
      if (this.z_as_x) {
        const PmaxZinO = o.bbox.min.z < p_bbox.max.z && p_bbox.max.z < o.bbox.max.z;
        const PminZinO = o.bbox.min.z < p_bbox.min.z && p_bbox.min.z < o.bbox.max.z;
        const OminZinP = p_bbox.min.z < o.bbox.min.z && o.bbox.min.z < p_bbox.max.z;
        if      (p_dpos.z > 0 && (PmaxZinO || OminZinP)) {
          p_pos.z = o.bbox.min.z - p_size.z / 2;
        }
        else if (p_dpos.z < 0 && (PminZinO || OminZinP)) {
          p_pos.z = o.bbox.max.z + p_size.z / 2;
        }
      } else {
        const PmaxXinO = o.bbox.min.x < p_bbox.max.x && p_bbox.max.x < o.bbox.max.x;
        const PminXinO = o.bbox.min.x < p_bbox.min.x && p_bbox.min.x < o.bbox.max.x;
        const OminXinP = p_bbox.min.x < o.bbox.min.x && o.bbox.min.x < p_bbox.max.x;
        if      (p_dpos.x > 0 && (PmaxXinO || OminXinP)) {
          p_pos.x = o.bbox.min.x - p_size.x / 2;
        }
        else if (p_dpos.x < 0 && (PminXinO || OminXinP)) {
          p_pos.x = o.bbox.max.x + p_size.x / 2;
        }
      }
    }
    else if (dir === 'VERTICAL') {
      const PmaxYinO = o.bbox.min.y < p_bbox.max.y && p_bbox.max.y < o.bbox.max.y;
      const PminYinO = o.bbox.min.y < p_bbox.min.y && p_bbox.min.y < o.bbox.max.y;
      const OminYinP = p_bbox.min.y < o.bbox.min.y && o.bbox.min.y < p_bbox.max.y;
      const OminYinB = p_bbox_min_y < o.bbox.min.y && o.bbox.min.y < p_bbox_max_y;
      const BmaxYinO = o.bbox.min.y < p_bbox_max_y && p_bbox_max_y < o.bbox.max.y;
      const BminYinO = o.bbox.min.y < p_bbox_min_y && p_bbox_min_y < o.bbox.max.y;
      if      (p_dpos.y > 0 && (!BmaxYinO && PmaxYinO || !OminYinB && OminYinP)) {
        p_pos.y = o.bbox.min.y - p_size.y;
      }
      else if (p_dpos.y < 0 && (!BminYinO && PminYinO || !OminYinB && OminYinP)) {
        p_pos.y = o.bbox.max.y;
      }
    }
    else {
      throw Error(`dir must be HORISONTAL or VERTICAL, not ${dir}`);
    }
  }


  update_projection(ndr) {
    for (let i = 0; i < this.objects.length; ++i) {
      const o = this.objects[i];

      // TODO: uncomment this

      // const  is_FULLY_COVERED = o.flgs    & this.FLGS.FULLY_COVERED;
      // const was_FULLY_COVERED = o.oldflgs & this.FLGS.FULLY_COVERED;

      // if (!is_FULLY_COVERED && was_FULLY_COVERED) {

      //   o.mesh.scale.x = 1;
      //   o.mesh.scale.y = 1;
      //   o.mesh.scale.z = 1;

      // }

      // if (is_FULLY_COVERED && !was_FULLY_COVERED) {

      //   o.mesh.scale.x = Math.ceil(ndr);
      //   o.mesh.scale.y = Math.ceil(ndr);
      //   o.mesh.scale.z = Math.ceil(ndr);

      // }

      const  is_MUST_BE_SHRINKED = o.flgs    & this.FLGS.MUST_BE_SHRINKED;
      const was_MUST_BE_SHRINKED = o.oldflgs & this.FLGS.MUST_BE_SHRINKED;

      if (is_MUST_BE_SHRINKED && !was_MUST_BE_SHRINKED) {

        o.mesh.scale.x = ndr;
        o.mesh.scale.y = ndr;
        o.mesh.scale.z = ndr;

      }

      if (!is_MUST_BE_SHRINKED && was_MUST_BE_SHRINKED) {

        o.mesh.scale.x = 1 - ndr;
        o.mesh.scale.y = 1 - ndr;
        o.mesh.scale.z = 1 - ndr;

      }
    }
  }
}
