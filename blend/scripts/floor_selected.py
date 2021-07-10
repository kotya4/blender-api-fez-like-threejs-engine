import bpy
context = bpy.context

for obj in context.selected_objects:
    mx = obj.matrix_world
    minz = min((mx @ v.co)[2] for v in obj.data.vertices)
    mx.translation.z -= minz