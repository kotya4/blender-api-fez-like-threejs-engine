import bpy

ob_sel = bpy.context.selected_editable_objects
ob_act = bpy.context.object

try:
    props = ob_act["_RNA_UI"]
except KeyError:
    pass
else:
    for ob in ob_sel:
        if ob == ob_act:
            continue
        for p in props.keys():
            print(p, ob_act[p])
            ob[p] = ob_act[p]
            