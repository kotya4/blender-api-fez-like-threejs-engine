import bpy

filepath = bpy.path.abspath('//').replace('\\', '/') + 'scripts/'

src_export_glb   = filepath + 'export_glb.py'
src_export_props = filepath + 'export_props.py'
src_recompile    = filepath + 'recompile.py'

exec(compile(open(src_export_glb).read(), src_export_glb, 'exec'))
exec(compile(open(src_export_props).read(), src_export_props, 'exec'))
exec(compile(open(src_recompile).read(), src_recompile, 'exec'))
