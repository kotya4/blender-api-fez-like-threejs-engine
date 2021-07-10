import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/controls/OrbitControls.js';

import { Settings } from './settings.js';
import { Level } from './level.js';
import { Player } from './player.js';

import { DebugInfo } from './utils.js';

window.onload = async function main() {
  if ('seedrandom' in Math) Math.seedrandom('0');

  // =====================
  // display
  // =====================

  const width  = 600;
  const height = 300;

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  renderer.setScissorTest(true);

  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.imageSmoothingEnabled = false;

  const render_container = document.createElement('div');
  render_container.style.width  = `${width}px`;
  render_container.style.height = `${height}px`;

  const textarea = document.createElement('div');
  textarea.style.width    = '300px';
  textarea.style.height   = '300px';
  textarea.style.overflow = 'scroll';
  textarea.style.background = '#122';
  textarea.innerText = '';
  let textarea_tid = null;

  render_container.appendChild(renderer.domElement);
  render_container.appendChild(ctx.canvas);
  document.body.appendChild(render_container);
  // document.body.appendChild(textarea);

  // ====================
  // scenes
  // ====================


  const levels = [

    new Level({ name: 'map_town_1' }),

  ];


  const player = new Player({ level: levels[0] });


  // DEBUG:
  const debug_camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
  debug_camera.position.set(0, 10, 50);
  const debug_camera_controls = new OrbitControls(debug_camera, ctx.canvas);


  // ======================
  // render cicle
  // ======================

  let old_timestamp = null;
  (function render(timestamp) {
    window.requestAnimationFrame(render);
    const elapsed = (timestamp - old_timestamp || 0) / 1000;
    old_timestamp = timestamp;

    // ======================
    // process game
    // ======================

    // do nothing until player and level are prepared
    if (player.is_prepared) {

      // update all
      player.level.process_all(elapsed);

      // ======================
      // render active scene
      // ======================

      renderer.setViewport(0, 0, width/2, height);
      renderer.setScissor(0, 0, width/2, height);
      renderer.render(player.level.scene, player.camera);

      // DEBUG:
      renderer.setViewport(width/2, 0, width/2, height);
      renderer.setScissor(width/2, 0, width/2, height);
      renderer.render(player.level.scene, debug_camera);
    }

    // ======================
    // information
    // ======================

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(`${elapsed}  SPF`,                         width - 10, height - 12);
    ctx.fillText(`${renderer.info.render.triangles} tria`,  width - 10, height - 24);
    ctx.fillText(`${renderer.info.render.frame} fram`,      width - 10, height - 36);
    ctx.fillText(`${renderer.info.render.calls} call`,      width - 10, height - 48);
    ctx.fillText(`${renderer.info.memory.geometries} geom`, width - 10, height - 60);
    ctx.fillText(`${renderer.info.memory.textures} txtr`,   width - 10, height - 72);
    ctx.fillText(`${renderer.info.programs.length} prog`,   width - 10, height - 84);

    ctx.fillStyle = 'black';
    ctx.fillRect(width/2, 0, 2, height);

    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    for (let i = 0; i < DebugInfo.queue.length; ++i) {
      const o = DebugInfo.queue[i];
      ctx.fillText(`${JSON.stringify(o)}`, 10, 12 * (1 + i));
    }
    DebugInfo.queue.length = 0;

    ctx.restore();
  })();
}
