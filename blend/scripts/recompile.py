import bpy
import glob
import os
import datetime

filepath = bpy.path.abspath('//').replace('\\', '/')

jsms = [ os.path.basename(fn)[:-3] for fn in glob.glob(filepath + 'jsm/*') if fn.endswith('.js') ]
glbs = [ os.path.basename(fn)[:-4] for fn in glob.glob(filepath + 'glb/*') if fn.endswith('.glb') ]

data = f'// Generated at {datetime.datetime.now()}\n\n'
for name in jsms:
    data += f'import {name} from "./jsm/{name}.js";\n'
data += '\nexport default {\n'
for name in glbs:
    data += f'  {name}: {{ glb: "../blend/glb/{name}.glb", props: {name if name in jsms else "null"} }},\n'
data += '}\n'

with open(filepath + 'blend.js', 'w', encoding='utf-8') as f:
    f.write(data)
