"""Pixel-preserving image conversion; invoked by import-reference.mjs with JSON stdin."""
import json
import shutil
import sys
import uuid
from pathlib import Path
from PIL import Image

args = json.load(sys.stdin)
root, source = Path(args['root']), Path(args['source'])
namespace = uuid.UUID('0969f3d6-d175-56ed-830e-e080d41d0784')
images = {}

# Validate all fighter crops before writing any images. A valid rectangle can still
# point at empty sheet space; that caused Ryu's body-hit animation to disappear.
for item in args['crops']:
    if not item['sprite'].startswith('fighters/'):
        continue
    name = item['image']
    if name not in images:
        images[name] = Image.open(source / 'images' / name).convert('RGBA')
    x, y, w, h = item['rect']
    assert w > 0 and h > 0, f"Empty fighter rectangle: {item['sprite']}"
    assert x >= 0 and y >= 0 and x+w <= images[name].width and y+h <= images[name].height, item
    assert images[name].crop((x, y, x+w, y+h)).getchannel('A').getbbox(), f"Transparent fighter crop: {item['sprite']} {item['rect']}"

def meta(path, importer, settings):
    relative = path.relative_to(root).as_posix()
    guid = uuid.uuid5(namespace, relative)
    Path(str(path) + '.gmeta').write_text(f'guid = "{guid}"\nimporter = "{importer}"\n\n[settings]\n{settings}\n')

for item in args['crops']:
    name = item['image']
    if name not in images:
        images[name] = Image.open(source / 'images' / name).convert('RGBA')
    x, y, w, h = item['rect']
    if w == 0 or h == 0:
        image = Image.new('RGBA', (1, 1))
    else:
        assert x >= 0 and y >= 0 and x+w <= images[name].width and y+h <= images[name].height, item
        image = images[name].crop((x, y, x+w, y+h))
    if 'key' in item:
        key = tuple(item['key'])
        image.putdata([(r, g, b, 0 if (r, g, b) == key else a) for r, g, b, a in image.getdata()])
    if 'canvas' in item:
        px, py = item['pivot']
        ox, oy = item['origin']
        assert px-ox >= 0 and py-oy >= 0 and px-ox+image.width <= item['canvas'][0] and py-oy+image.height <= item['canvas'][1], item
        canvas = Image.new('RGBA', tuple(item['canvas']))
        canvas.paste(image, (px-ox, py-oy))
        image = canvas
    path = root / 'assets' / (item['sprite'] + '.png')
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=False)
    atlas = item['sprite'].split('/')[0]
    if atlas == 'fighters':
        atlas += '-' + item['sprite'].split('/')[1]
    meta(path, 'texture', f'atlas = "{atlas}"\ncompression = "none"\nmipmaps = false')

for sound in args['sounds']:
    path = root / 'assets' / 'audio' / sound
    path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source / 'sounds' / sound, path)
    music = sound.startswith('theme-')
    meta(path, 'audio', 'codec = "opus"\nnormalize = false' if music else 'mono = true\ncooldown = 0.03')
