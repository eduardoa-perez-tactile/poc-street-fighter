#!/usr/bin/env python3
"""Rebuild audited SFII crops from hash-pinned, unmodified source sheets.

Requires Pillow. Raw sheets are excluded from runtime bundles. If a source file
is absent the importer attempts its pinned URL; sites may require downloading
through a normal browser instead. Supply those files with --source-dir PATH.
Only exact rectangular crops and exact background-key removal are performed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import urllib.request
import uuid
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'scripts/arcade-art-provenance.json'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def check_or_write_meta(path, text, verify):
    metadata = path.with_name(path.name + '.gmeta')
    if verify:
        if not metadata.exists() or metadata.read_text() != text:
            raise SystemExit(f'Generated metadata differs: {metadata}')
    else:
        metadata.write_text(text)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, default=ROOT / 'assets/source/arcade-ui')
    parser.add_argument('--verify', action='store_true', help='Verify sources and generated output without writing')
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text())
    sheets = {}
    for source in manifest['sources']:
        path = args.source_dir / source['file']
        if not path.exists():
            if args.verify:
                raise SystemExit(f'Missing source: {path}')
            path.parent.mkdir(parents=True, exist_ok=True)
            try:
                with urllib.request.urlopen(source['mediaUrl'], timeout=30) as response:
                    path.write_bytes(response.read())
            except Exception as error:
                raise SystemExit(f'Could not download {source["pageUrl"]}: {error}. Download its PNG in a browser to {path}, then rerun.') from error
        if digest(path) != source['sha256']:
            raise SystemExit(f'Source hash mismatch: {path}; refusing changed source art')
        source_guid = uuid.uuid5(uuid.NAMESPACE_URL, 'poc-street-fighter/arcade-ui/source/' + source['file'])
        check_or_write_meta(path,
            f'guid = "{source_guid}"\nimporter = "texture"\n\n[settings]\natlas = "none"\ncompression = "none"\nmipmaps = false\nart_check = false\n', args.verify)
        sheets[source['id']] = Image.open(path).convert('RGBA')
    total = 0
    for crop in manifest['crops']:
        x, y, w, h = crop['rect']
        result = sheets[crop['source']].crop((x, y, x + w, y + h))
        if 'key' in crop or 'keys' in crop:
            keys = {tuple(key) for key in crop.get('keys', [crop.get('key')])}
            result.putdata([(r, g, b, 0 if (r, g, b) in keys else a) for r, g, b, a in result.getdata()])
        path = ROOT / crop['file']
        if not args.verify:
            path.parent.mkdir(parents=True, exist_ok=True)
        guid = uuid.uuid5(uuid.NAMESPACE_URL, 'poc-street-fighter/arcade-ui/' + path.stem)
        atlas = 'ui-combat' if crop.get('combat') else 'ui-menu'
        check_or_write_meta(path,
            f'guid = "{guid}"\nimporter = "texture"\n\n[settings]\natlas = "{atlas}"\ncompression = "none"\nmipmaps = false\n' +
            ('art_check = false\n' if crop.get('opaqueBackground') else ''), args.verify)
        if args.verify:
            if not path.exists() or Image.open(path).convert('RGBA').tobytes() != result.tobytes():
                raise SystemExit(f'Generated pixels differ: {path}')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            result.save(path)
            crop['sha256'] = digest(path)
        if digest(path) != crop['sha256']:
            raise SystemExit(f'Generated hash mismatch: {path}')
        total += w * h * 4
    if not args.verify:
        MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{"Verified" if args.verify else "Imported"} {len(manifest["crops"])} exact crops; {total:,} uncompressed RGBA bytes before atlas padding.')

if __name__ == '__main__':
    main()
