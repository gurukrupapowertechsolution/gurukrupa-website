#!/usr/bin/env python3
"""
prune_gallery.py
================
Re-syncs frontend/src/data/galleryImages.json with the image files that are
actually on disk, after you have manually deleted photos you did not want.

WHY THIS EXISTS
---------------
optimize_gallery.py cannot do this job any more. It rebuilds the manifest from
the original .jpeg files in frontend/public/projects/gallery/ -- and those
originals have already been deleted (that was the documented last step of the
original import). With no sources to read it aborts on "No images found" before
it writes anything. It is harmless to run, but it will not help you.

So the manifest is now hand-maintained, and this script is the safe way to
maintain it: you delete the pictures you can see, then run this and it makes the
JSON agree with reality.

THE PROBLEM IT PREVENTS
-----------------------
Nothing in the frontend has an onError fallback on gallery images. If the JSON
still lists a photo whose file you deleted, the visitor gets a broken-image icon
in the grid -- not a blank space, not a skipped tile. That is the only way this
cleanup can break the site, and it is exactly what --apply fixes.

USAGE (from the project root, the folder containing "frontend")
--------------------------------------------------------------
    python prune_gallery.py                      # report only, changes nothing
    python prune_gallery.py --apply              # rewrite the JSON to match disk
    python prune_gallery.py --apply --delete-orphans
                                                 # also delete image files that
                                                 # the JSON no longer lists

The default is a dry run. --apply writes galleryImages.json and always saves a
timestamped .bak next to it first.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
from pathlib import Path

GALLERY_DIR = Path("frontend/public/projects/gallery")
THUMBS_DIR = GALLERY_DIR / "thumbs"
FULL_DIR = GALLERY_DIR / "full"
JSON_PATH = Path("frontend/src/data/galleryImages.json")

# The homepage carousel renders galleryImages.slice(0, 9). Fewer than this and
# that row starts to look thin -- it still renders correctly, it just gets
# sparse, so this is a warning and never an error.
HOMEPAGE_CAROUSEL_COUNT = 9


def rel(path: Path) -> str:
    """Manifest paths are site-absolute ("/projects/gallery/..."), not filesystem
    paths. Convert a real file back to the form the JSON uses."""
    return "/" + path.relative_to(Path("frontend/public")).as_posix()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Re-sync galleryImages.json with the files on disk."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write the pruned manifest. Without this the script only reports.",
    )
    parser.add_argument(
        "--delete-orphans",
        action="store_true",
        help="Also delete .webp files that the manifest no longer references.",
    )
    args = parser.parse_args()

    if not JSON_PATH.exists():
        print(f"ERROR: manifest not found at {JSON_PATH.resolve()}")
        print("Run this from the PROJECT ROOT (the folder containing 'frontend').")
        return 1
    for directory in (THUMBS_DIR, FULL_DIR):
        if not directory.exists():
            print(f"ERROR: {directory.resolve()} does not exist.")
            return 1

    # utf-8-sig, not utf-8: this file may have been hand-edited, and Notepad and
    # PowerShell's Set-Content both prepend a UTF-8 BOM on Windows. Plain utf-8
    # rejects a BOM with a JSONDecodeError that looks like a corrupt file, which
    # is a confusing way to fail for something this harmless. utf-8-sig reads
    # both; the rewrite below always writes without one.
    try:
        entries = json.loads(JSON_PATH.read_text(encoding="utf-8-sig"))
    except json.JSONDecodeError as err:
        print(f"ERROR: {JSON_PATH} is not valid JSON -- {err}")
        print("       A hand edit has most likely left a trailing comma or a")
        print("       missing bracket. Fix that, or restore a .bak, then re-run.")
        return 1
    thumbs = {p.stem for p in THUMBS_DIR.glob("*.webp")}
    fulls = {p.stem for p in FULL_DIR.glob("*.webp")}

    keep, broken = [], []
    for entry in entries:
        stem = entry["id"]
        missing = []
        if stem not in thumbs:
            missing.append("thumb")
        if stem not in fulls:
            missing.append("full")
        if missing:
            broken.append((stem, missing))
        else:
            keep.append(entry)

    referenced = {e["id"] for e in keep}
    orphan_thumbs = sorted(thumbs - referenced)
    orphan_fulls = sorted(fulls - referenced)

    print("=" * 66)
    print("GALLERY MANIFEST CHECK")
    print("=" * 66)
    print(f"  manifest entries      : {len(entries)}")
    print(f"  files in thumbs/      : {len(thumbs)}")
    print(f"  files in full/        : {len(fulls)}")
    print()

    if broken:
        print(f"  {len(broken)} entry(ies) point at files that no longer exist.")
        print("  These are what would render as broken images. They will be")
        print("  removed from the manifest:")
        for stem, missing in broken[:40]:
            print(f"      - {stem}  (missing: {', '.join(missing)})")
        if len(broken) > 40:
            print(f"      ... and {len(broken) - 40} more")
    else:
        print("  No broken entries. Every listed photo has both its files.")
    print()

    if orphan_thumbs or orphan_fulls:
        print("  Image files present but not listed in the manifest (dead weight;")
        print("  they ship in the build but nothing renders them):")
        for stem in orphan_thumbs[:20]:
            print(f"      - thumbs/{stem}.webp")
        if len(orphan_thumbs) > 20:
            print(f"      ... and {len(orphan_thumbs) - 20} more in thumbs/")
        for stem in orphan_fulls[:20]:
            print(f"      - full/{stem}.webp")
        if len(orphan_fulls) > 20:
            print(f"      ... and {len(orphan_fulls) - 20} more in full/")
    else:
        print("  No orphaned files.")
    print()

    print(f"  Result: {len(entries)} -> {len(keep)} photos in the gallery.")
    if len(keep) < HOMEPAGE_CAROUSEL_COUNT:
        print(
            f"  NOTE: the homepage carousel shows the first {HOMEPAGE_CAROUSEL_COUNT}. "
            f"With {len(keep)} it will render correctly but look sparse."
        )
    if not keep:
        print("  NOTE: with zero photos the /projects page shows its empty state.")
        print("        Nothing crashes, but the gallery will be blank.")
    print("=" * 66)

    if not args.apply:
        print("\nDRY RUN -- nothing was changed.")
        if broken or orphan_thumbs or orphan_fulls:
            print("Re-run with --apply to write the pruned manifest.")
        return 0

    if broken:
        backup = JSON_PATH.with_suffix(f".json.{time.strftime('%Y%m%d-%H%M%S')}.bak")
        shutil.copy2(JSON_PATH, backup)
        # indent=2 + ensure_ascii=False matches optimize_gallery.py's output, so
        # applying this produces no incidental diff noise.
        JSON_PATH.write_text(
            json.dumps(keep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print(f"\nWrote {JSON_PATH} ({len(keep)} entries).")
        print(f"Backup saved to {backup.name}")
    else:
        print("\nManifest already matches the files on disk -- not rewritten.")

    if args.delete_orphans:
        removed = 0
        for stem in orphan_thumbs:
            (THUMBS_DIR / f"{stem}.webp").unlink(missing_ok=True)
            removed += 1
        for stem in orphan_fulls:
            (FULL_DIR / f"{stem}.webp").unlink(missing_ok=True)
            removed += 1
        print(f"Deleted {removed} orphaned image file(s).")
    elif orphan_thumbs or orphan_fulls:
        print("Orphaned files were left in place. Add --delete-orphans to remove them.")

    print("\nNEXT: restart the dev server (or reload) and open /projects to confirm.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
