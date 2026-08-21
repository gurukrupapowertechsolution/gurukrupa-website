#!/usr/bin/env python3
"""
optimize_gallery.py
===================
Prepares the 316 site photos for the website.

Reads : frontend/public/projects/gallery/*.jpeg   (your originals)
Writes: frontend/public/projects/gallery/thumbs/*.webp  (grid, ~500px)
        frontend/public/projects/gallery/full/*.webp    (lightbox, ~1600px)
        frontend/src/data/galleryImages.json            (list for React)

Originals are NEVER modified or deleted -- you delete them manually once
you've confirmed the output looks right.

SETUP
-----
    pip install Pillow

RUN (from inside your project root, i.e. the folder containing "frontend")
-----
    python optimize_gallery.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is not installed. Run:  pip install Pillow")


# ---------------------------------------------------------------------------
# CONFIG -- adjust only if your folder layout differs
# ---------------------------------------------------------------------------

SOURCE_DIR = Path("frontend/public/projects/gallery")
THUMBS_DIR = SOURCE_DIR / "thumbs"
FULL_DIR = SOURCE_DIR / "full"
JSON_OUT = Path("frontend/src/data/galleryImages.json")

# Grid thumbnails: small and fast. 500px is plenty for a bento/grid cell.
THUMB_MAX_WIDTH = 500
THUMB_QUALITY = 75

# Lightbox images: sharp when opened full-screen, still far smaller than source.
FULL_MAX_WIDTH = 1600
FULL_QUALITY = 82

SOURCE_EXTENSIONS = {".jpeg", ".jpg", ".png"}


# ---------------------------------------------------------------------------

def human_mb(num_bytes: int) -> str:
    return f"{num_bytes / (1024 * 1024):.1f} MB"


def resize_and_save(img: Image.Image, max_width: int, dest: Path, quality: int) -> None:
    """Resize preserving aspect ratio (only downscales) and save as WebP."""
    working = img.copy()

    if working.width > max_width:
        ratio = max_width / working.width
        new_size = (max_width, int(working.height * ratio))
        working = working.resize(new_size, Image.LANCZOS)

    # WebP doesn't support some source modes (e.g. P, CMYK) -- normalise to RGB.
    if working.mode not in ("RGB", "RGBA"):
        working = working.convert("RGB")

    working.save(dest, "WEBP", quality=quality, method=6)


def main() -> None:
    if not SOURCE_DIR.exists():
        sys.exit(
            f"Source folder not found: {SOURCE_DIR.resolve()}\n"
            "Run this script from your PROJECT ROOT (the folder that contains "
            '"frontend"), not from inside frontend/.'
        )

    sources = sorted(
        p for p in SOURCE_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in SOURCE_EXTENSIONS
    )

    if not sources:
        sys.exit(f"No images found in {SOURCE_DIR.resolve()}")

    THUMBS_DIR.mkdir(parents=True, exist_ok=True)
    FULL_DIR.mkdir(parents=True, exist_ok=True)
    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)

    print(f"Found {len(sources)} images ({human_mb(sum(p.stat().st_size for p in sources))})")
    print("Converting to WebP...\n")

    entries = []
    failures = []

    for index, source_path in enumerate(sources, start=1):
        stem = source_path.stem
        thumb_path = THUMBS_DIR / f"{stem}.webp"
        full_path = FULL_DIR / f"{stem}.webp"

        try:
            with Image.open(source_path) as img:
                # Honour EXIF orientation so nothing appears sideways.
                img = ImageOps.exif_transpose(img)
                resize_and_save(img, THUMB_MAX_WIDTH, thumb_path, THUMB_QUALITY)
                resize_and_save(img, FULL_MAX_WIDTH, full_path, FULL_QUALITY)
        except Exception as err:  # noqa: BLE001 - report and continue
            failures.append((source_path.name, str(err)))
            print(f"  [{index}/{len(sources)}] FAILED {source_path.name}: {err}")
            continue

        # Dealer name is the part before the "__" separator in the filename.
        dealer_raw = stem.split("__")[0] if "__" in stem else ""
        dealer_label = dealer_raw.replace("_", " ").strip()

        entries.append({
            "id": stem,
            "thumb": f"/projects/gallery/thumbs/{stem}.webp",
            "full": f"/projects/gallery/full/{stem}.webp",
            "dealer": dealer_label,
            # Deliberately no customer name -- see privacy note in the README.
            "alt": "Rooftop solar installation by Gurukrupa Powertech Solutions",
        })

        if index % 25 == 0 or index == len(sources):
            print(f"  [{index}/{len(sources)}] done")

    with open(JSON_OUT, "w", encoding="utf-8") as fh:
        json.dump(entries, fh, indent=2, ensure_ascii=False)

    thumbs_size = sum(p.stat().st_size for p in THUMBS_DIR.glob("*.webp"))
    full_size = sum(p.stat().st_size for p in FULL_DIR.glob("*.webp"))
    original_size = sum(p.stat().st_size for p in sources)

    print("\n" + "=" * 60)
    print("DONE")
    print(f"  Images processed : {len(entries)}")
    if failures:
        print(f"  Failed           : {len(failures)}")
        for name, err in failures[:5]:
            print(f"      - {name}: {err}")
    print(f"  Originals        : {human_mb(original_size)}")
    print(f"  Thumbnails       : {human_mb(thumbs_size)}")
    print(f"  Full (lightbox)  : {human_mb(full_size)}")
    print(f"  New total        : {human_mb(thumbs_size + full_size)}")
    print(f"  Manifest         : {JSON_OUT}")
    print("=" * 60)
    print("\nNEXT: open a few files in thumbs/ and full/ to confirm they look")
    print("right, THEN delete the original .jpeg files from")
    print(f"{SOURCE_DIR} (keep the thumbs/ and full/ subfolders).")


if __name__ == "__main__":
    main()
