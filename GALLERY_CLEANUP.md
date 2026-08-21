# Manual Gallery Cleanup — Step-by-Step

How to delete unwanted photos (old, blurry, badly framed, duplicates) from the
Project Gallery without breaking the frontend.

Current state: **316 photos**, all in sync — 316 manifest entries, 316 files in
`thumbs/`, 316 in `full/`.

---

## The three places a photo exists

Every photo exists in **three** places. All three must agree, or the gallery
breaks.

| # | What | Path |
|---|------|------|
| 1 | Grid thumbnail (~500px) | `frontend/public/projects/gallery/thumbs/<NAME>.webp` |
| 2 | Lightbox image (~1600px) | `frontend/public/projects/gallery/full/<NAME>.webp` |
| 3 | The manifest entry | `frontend/src/data/galleryImages.json` |

The filename **stem is the shared key**. `BHARAT__002.webp` in `thumbs/` and in
`full/` are the same photo, and the manifest entry ties them together:

```json
{
  "id": "BHARAT__002",
  "thumb": "/projects/gallery/thumbs/BHARAT__002.webp",
  "full": "/projects/gallery/full/BHARAT__002.webp",
  "dealer": "BHARAT",
  "alt": "Rooftop solar installation by Gurukrupa Powertech Solutions"
}
```

### ⚠ The one way this breaks the site

**Nothing in the frontend has an `onError` fallback on gallery images.** If the
manifest still lists a photo whose file you deleted, the visitor gets a
**broken-image icon** in the grid — not a blank space, not a skipped tile.

So the rule is: *never leave the manifest listing a file you deleted.* Step 4
below is what guarantees that.

### ⚠ Do NOT run `optimize_gallery.py` to fix this

That script rebuilds the manifest from the original `.jpeg` files in
`frontend/public/projects/gallery/` — and **those originals are already gone**
(deleting them was the documented last step of the original import). With no
sources to read it aborts on `No images found` before writing anything.

It is harmless to run, but it cannot help you, and it is not the tool for this
job. Use `prune_gallery.py` (step 4).

---

## The cleanup, start to finish

### Step 1 — Review the photos visually

Open this folder in File Explorer:

```
frontend\public\projects\gallery\thumbs\
```

Switch the view to **Extra large icons** (View ▸ Extra large icons, or
`Ctrl` + mouse wheel up). You can now see all 316 photos as a contact sheet and
judge them at a glance.

Use `thumbs/` for reviewing, not `full/` — same pictures, ~10 MB instead of
~42 MB, so it loads instantly.

> Filenames are grouped by dealer (`BHARAT__001`, `BHARAT__002`, …), so
> duplicates and near-duplicates from the same site sit next to each other.
> That is usually where the easy wins are.

### Step 2 — Write down the names you want gone

Note the filename **stems** (without `.webp`), e.g.:

```
BHARAT__004
SONI_ELE_DAYAPAR__011
IRSHAD_BHAI__003
```

### Step 3 — Delete the files from BOTH folders

For each name, delete it from **both**:

```
frontend\public\projects\gallery\thumbs\<NAME>.webp
frontend\public\projects\gallery\full\<NAME>.webp
```

A quick way to do both at once — from the **project root** in PowerShell:

```powershell
# Put the names you decided on in step 2 here:
$names = 'BHARAT__004','SONI_ELE_DAYAPAR__011','IRSHAD_BHAI__003'

foreach ($n in $names) {
  Remove-Item "frontend\public\projects\gallery\thumbs\$n.webp" -ErrorAction SilentlyContinue
  Remove-Item "frontend\public\projects\gallery\full\$n.webp"   -ErrorAction SilentlyContinue
}
```

If you forget one of the two folders, step 4 catches it and cleans up the
leftover — you do not have to be perfect here.

### Step 4 — Re-sync the manifest (this is the safety step)

From the **project root** (the folder containing `frontend`):

```powershell
python prune_gallery.py
```

This changes nothing. It prints what it found:

- entries pointing at files you deleted → these would render as broken images
- image files no longer listed in the manifest → dead weight in the build
- the resulting photo count

When the report looks right, apply it:

```powershell
python prune_gallery.py --apply --delete-orphans
```

- `--apply` rewrites `galleryImages.json` to list only photos whose files exist.
  It saves a timestamped `.bak` next to the file first, every time.
- `--delete-orphans` removes any leftover `.webp` whose manifest entry is gone
  (this is what covers a half-finished step 3).

### Step 5 — Confirm in the browser

```powershell
cd frontend
npm run dev
```

Open **http://localhost:5173/projects** and check:

- no broken-image icons anywhere in the grid
- "Load more" still works (it pages 24 at a time)
- clicking a tile opens the lightbox and the arrows move through the set
- the homepage "Recent installations" carousel still looks full

---

## You do not need to hand-edit the JSON

Step 4 rewrites it for you. But if you ever do open
`frontend/src/data/galleryImages.json` by hand:

- Delete the **whole 7-line block** for a photo, including the trailing comma
  from the previous entry if you removed the last item in the array. A stray
  comma makes the file invalid JSON, and the whole gallery fails to import — the
  page goes blank rather than showing a broken tile. `prune_gallery.py` detects
  this and tells you which problem it is, and there is always a `.bak`.
- A UTF-8 BOM is **not** a problem, so Notepad is safe here. Both were checked:
  `prune_gallery.py` reads the file as `utf-8-sig`, and a production build with a
  BOM-prefixed manifest succeeds. (Worth stating because a BOM breaks plenty of
  other JSON tooling on Windows — it just doesn't break this.)

---

## Good to know

- **Nothing else references individual photos.** No hardcoded counts, no
  hardcoded filenames anywhere. Everything is derived from the manifest at
  runtime: `/projects` reads `galleryImages.length`, the homepage carousel takes
  `slice(0, 9)`. So deleting is safe from the frontend's point of view once the
  manifest agrees with the disk.
- **Deleting the first few entries changes the homepage carousel**, because it
  takes the first 9 in manifest order. If you delete several early ones, glance
  at the homepage too.
- **The floor is zero.** `/projects` has a real empty state, so even deleting
  everything will not crash — the gallery just renders blank. Below 9 photos the
  homepage carousel still works but looks thin; the script warns you.
- **Dealer names never reach the page.** The `dealer` field is used for grouping
  only, deliberately never displayed, so you do not need to think about it.
- **Restoring.** Deleted `.webp` files are not recoverable from the repo unless
  they are committed to git — check `git status` before deleting if you want an
  undo path. The manifest itself always has a `.bak`.
