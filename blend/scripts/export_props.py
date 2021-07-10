import bpy
import json

filepath = bpy.path.abspath('//').replace('\\', '/')
basename = bpy.path.basename(bpy.data.filepath)[:-6]

data = { o.name.replace('.', '') : { k : o[k] for k in o.keys() if k not in '_RNA_UI' } for o in bpy.data.objects if o.type not in ('CAMERA', 'LAMP', 'ARMATURE') }

jsondata = json.dumps(data, ensure_ascii=False, indent=2)
jsmdata = 'export default ' + jsondata

with open(filepath + 'json/' + basename + '.json', 'w', encoding='utf-8') as f:
    f.write(jsondata)

with open(filepath + 'jsm/' + basename + '.js', 'w', encoding='utf-8') as f:
    f.write(jsmdata)
