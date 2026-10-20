#!/usr/bin/env python3
"""Extract audited arcade stage layers. Requires Pillow; sources are not runtime assets.

Save the original PNGs using their source-page Download links into a directory, then:
  python scripts/import-arcade-stages.py --source-dir .gameengine/arcade-stage-sources
The site can require browser downloads; this script never bypasses access challenges.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
import uuid
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PROVENANCE = ROOT / 'scripts/arcade-stage-provenance.json'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True)
    args = parser.parse_args()
    records = json.loads(PROVENANCE.read_text())
    total = 0
    for stage in records['stages']:
        path = args.source_dir / f"{stage['assetId']}.png"
        data = path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        if digest != stage['sha256']:
            raise ValueError(f'{path}: source hash changed; audit the sheet before updating crops')
        sheet = Image.open(path).convert('RGBA')
        if list(sheet.size) != stage['size']:
            raise ValueError(f'{path}: unexpected source dimensions')
        key = tuple(stage['keyColor'])
        out = ROOT / 'assets/stages' / stage['key']
        out.mkdir(parents=True, exist_ok=True)
        layers = []
        for layer in stage['layers']:
            if 'canvas' in layer:
                image = Image.new('RGBA', tuple(layer['canvas']), tuple(layer.get('fill', [0, 0, 0, 0])))
                for part in layer['parts']:
                    x, y, w, h = part['crop']
                    patch = sheet.crop((x, y, x + w, y + h))
                    if part.get('key', False):
                        patch.putdata([(r, g, b, 0 if (r,g,b) == key else a) for r,g,b,a in patch.getdata()])
                    for color in part.get('borderKeyColors', []):
                        # Sheet layout backgrounds are removed only when connected to an
                        # edge; identical palette colors inside the artwork stay intact.
                        target_color = tuple(color) + (255,)
                        for edge in [(x,0) for x in range(patch.width)] + [(x,patch.height-1) for x in range(patch.width)] + [(0,y) for y in range(patch.height)] + [(patch.width-1,y) for y in range(patch.height)]:
                            if patch.getpixel(edge) == target_color:
                                ImageDraw.floodfill(patch,edge,tuple(color)+(0,),thresh=0)
                    image.alpha_composite(patch, tuple(part['at']))
            else:
                x,y,w,h = layer['crop']
                image = sheet.crop((x,y,x+w,y+h))
                if layer.get('key', False):
                    image.putdata([(r,g,b,0 if (r,g,b) == key else a) for r,g,b,a in image.getdata()])
            target = out / f"{layer['name']}.png"
            image.save(target, optimize=True)
            write_meta(target, stage['key'])
            total += image.width * image.height * 4
            if not layer.get('animationOnly'):
                layers.append((image, layer['position']))
        preview = Image.new('RGBA', (768,256), tuple(stage['clearColor']))
        for image, (x,y) in layers:
            # Preview uses the same centered baseline and native pixels as the renderer.
            preview.alpha_composite(image,(x,y+16))
        preview = preview.crop((128,0,640,256))
        preview.save(out / 'preview.png', optimize=True)
        write_meta(out / 'preview.png',stage['key'])
        total += preview.width * preview.height * 4
    create_ken_preview()
    print(f'Extracted four layered stages; decoded RGBA bytes including previews: {total} ({total / 1048576:.2f} MiB)')

def create_ken_preview():
    """Render the existing audited Ken data into a menu-only still at camera 448."""
    source = (ROOT / 'src/data/stage.ts').read_text()
    def read(name):
        return json.loads(re.search(r'export const ' + name + r' = (.*?) as const;', source, re.S).group(1))
    frames, animations, placements = (read(name) for name in ('STAGE_FRAMES','STAGE_ANIMATIONS','STAGE_PLACEMENTS'))
    canvas = Image.new('RGBA',(768,256),(101,84,73,255))
    layers = []
    for index, p in enumerate(placements):
        if p.get('frame') == 'stage-floor':
            continue
        key = p.get('frame') or p.get('frames',[None])[0] or animations[p['animation']][0][0]
        parent = p.get('parent')
        px,ratio = (16,1/2.157303) if parent == 'stage-background' else (150,1/1.613445) if parent == 'stage-boat' else (0,p.get('cameraMultiplier',1/p.get('cameraDivisor',1)))
        x = p['x'] + px + 448*(1-ratio)-256
        y = p['y']
        order = 30 if p['layer']=='floor' else 40 if p['layer']=='background-props' else index
        layers.append((p['layer']=='foreground',order,frames[key]['sprite'],round(x),y))
    for strip,sprite in enumerate(read('STAGE_FLOOR_STRIPS')):
        x=32+448*(1-1/1.55)-256+(-5.15-(448-1024)/112)*strip
        layers.append((False,25,sprite,round(x),176+strip))
    for _,_,sprite,x,y in sorted(layers):
        image = Image.open(ROOT / 'assets' / (sprite+'.png')).convert('RGBA')
        canvas.alpha_composite(image,(x,y+16))
    target = ROOT / 'assets/stages/ken/preview.png'
    target.parent.mkdir(parents=True,exist_ok=True)
    canvas.crop((128,0,640,256)).save(target,optimize=True)
    write_meta(target,'ken')


def write_meta(path, key):
    guid = uuid.uuid5(uuid.NAMESPACE_URL, f'streetfighter/arcade-stages/{key}/{path.name}')
    path.with_suffix(path.suffix + '.gmeta').write_text(f'guid = "{guid}"\nimporter = "texture"\n\n[settings]\natlas = "arcade-stages"\ncompression = "none"\nmipmaps = false\ntrim = false\nart_check = false\n')

if __name__ == '__main__':
    main()
