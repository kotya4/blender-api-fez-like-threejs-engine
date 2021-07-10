import bpy

filepath = bpy.path.abspath('//').replace('\\', '/') + 'glb/'
basename = bpy.path.basename(bpy.data.filepath)[:-6]

# https://docs.blender.org/api/current/bpy.ops.export_scene.html#bpy.ops.export_scene.gltf
bpy.ops.export_scene.gltf(
  export_format='GLB',
  ui_tab='GENERAL',
  export_copyright='',
  export_image_format='AUTO',
  export_texture_dir='',
  export_texcoords=True,
  export_normals=True,
  export_draco_mesh_compression_enable=False,
  export_draco_mesh_compression_level=6,
  export_draco_position_quantization=14,
  export_draco_normal_quantization=10,
  export_draco_texcoord_quantization=12,
#  export_draco_color_quantization=10,
  export_draco_generic_quantization=12,
  export_tangents=False,
  export_materials=True,
  export_colors=True,
  export_cameras=False,
  export_selected=False,
  use_selection=False,
  export_extras=False, # do not work
  export_yup=True,
  export_apply=False,
  export_animations=True,
  export_frame_range=True,
  export_frame_step=1,
  export_force_sampling=True,
  export_nla_strips=True,
  export_def_bones=False,
  export_current_frame=False,
  export_skins=True,
  export_all_influences=False,
  export_morph=True,
  export_morph_normal=True,
  export_morph_tangent=False,
  export_lights=False,
  export_displacement=False,
  will_save_settings=False,
  filepath=filepath + basename,
  check_existing=True,
  filter_glob='*.glb;*.gltf')