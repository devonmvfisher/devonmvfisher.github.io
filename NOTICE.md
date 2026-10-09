# Notice

Copyright (c) 2026 Devon Fisher.

This file says what the MIT licence in `LICENSE` covers in this repository, what it does not cover, and where the parts that came from other people come from.

## What the MIT licence covers

The MIT licence covers the code written for these pages: the page markup, with the scripts and styles inside the pages, and the JavaScript and CSS in `_next/static/` and `legacy/`, apart from the third-party libraries listed below. This is compiled output. The source files are not in this repository.

It also covers the short interface text inside that code: button labels, menu words and short status lines.

## What it does not cover

These are not under the MIT licence. Devon Fisher keeps them: films, art and pictures, written pages and page copy, story, lore and companion lines, in or linked from this repository. In this repository that means:

- The written text: the page copy, the guide, the review and the library text for Alder & Water. The library text sits inside `_next/static/chunks/library-books-BsX332oK.js` and cites the sources it names there. The MIT licence covers the code around those words, not the words. Whether any of its wording was taken from those sources is not yet confirmed.
- Images in `art/`: AI-generated images, not covered by the MIT licence. They are `art/cottage-floral-wallpaper.png` and `art/motorcycle-hollyhock-print.png`.
- Pictures in `guide/` (`cottage.png`, `hearth.png`, `retreat.png` and `spark.png`; the index page says room pictures are captures of the actual demos) and `alder/worktable-preview.png` (the attempt-five page calls it a Blender render, not a gameplay screenshot).
- The models, drawings, textures and data made for the retreat and for Alder & Water: see "Made for this project" below.

Pieces that came from other people keep their own licences. They are listed under "Third-party pieces" below, and the MIT licence does not change them.

## Where each group of files came from

Words used below:
- ESTABLISHED: a page, a file or a source record says so in plain words, and it was opened. For "original" files this is the maker's own label, not an outside check.
- LIKELY: only indirect evidence (same build, same exporter, same bytes as a labelled file, or a matching name).
- NOT FOUND: nothing found.

A source search of 9 October 2026 looked for the making or download record of 27 room files: the retreat sky, ground and tree, the Alder bench, cup, shards, work table and library path, the 12 phone textures, the 3 plates and the 2 favicons. It matched 25 of them, by exact content (SHA-256), to files in the room project (the working files these pages were built from, which are not in this repository), and read the project's own records for those. It did not find a record for the 2 favicons. A match shows where a file came from. It is not a licence by itself.

### Third-party pieces

#### Poly Haven (ESTABLISHED, CC0 1.0)

Licence: CC0, https://polyhaven.com/license. Credits are kept unchanged in `retreat/credits.json`, which names each source and author. Files were bundled into GLB form and re-encoded; the changes are listed in that file. Items from Poly Haven are CC0 and stay CC0.

- Sofa 03, by Fran Calvente: `retreat/sofa_03_1k.glb`, `retreat/sofa_03_4k.glb`
- Gothic Coffee Table, by Ulan Cabanilla: `retreat/gothic_coffee_table_1k.glb`
- Potted Plant 02, by Rico Cilliers: `retreat/potted_plant_02_1k.glb`
- Vintage Oil Lamp, by Monsta3D: `retreat/vintage_oil_lamp_1k.glb`
- Oak Wood Planks, by Dimitrios Savva: `retreat/oak_wood_planks/`
- White Plaster 02, by Rob Tuytel: `retreat/white_plaster_02/`
- Rough Linen, photography by colormass, processing by Rico Cilliers: `retreat/rough_linen/`. Two of its three files (`rough_linen_diff_1k.jpg` and `rough_linen_nor_gl_1k.jpg`) are not byte for byte the download recorded in `retreat/credits.json`; why they differ is not yet confirmed.
- Monbachtal Riverbank (HDR sky, 1k), by Andreas Mischok: `retreat/forest.hdr`. The source search matched the file byte for byte to the 1k download named in the room project's download record. `retreat/credits.json` does not list it.
- Forest Floor, by eye-candy.xyz: `retreat/forest_floor/1k/forest_floor_diff_1k.jpg`, `retreat/forest_floor/1k/forest_floor_nor_gl_1k.jpg` and `retreat/forest_floor/1k/forest_floor_rough_1k.jpg`. The source search matched each file to a 1k download re-encoded as JPEG (quality 88, and 92 for the normal map). `retreat/credits.json` does not list them.
- `retreat/real-fir-tree.glb`. The file's own notice reads: "CC0 Poly Haven. Artist: Rob Tuytel, Rico Cilliers". It is not listed in `retreat/credits.json`. It is a separate file from `retreat/woodland-tree.glb`.

The sky and the ground entries rest on the room project's own records. Poly Haven's pages were not checked against them.

#### Code libraries

The bundler removed most licence headers from the compiled files. The libraries below are identified by the names and version strings inside the compiled files. The full licence texts are in `THIRD-PARTY-LICENSES.txt`.

- Tailwind CSS v4.2.1 (ESTABLISHED), MIT. Its notice is kept at the top of two CSS files: `_next/static/css/index.1NtnbC9W.css` and `legacy/hearth/_next/static/css/index.3rRAxT49.css`.
- React and React DOM 19.2.6 (ESTABLISHED by the version string), MIT, Copyright (c) Meta Platforms, Inc. and affiliates. File: `framework-D_rUT4EX.js` (two copies, in `_next/static/chunks/` and `legacy/hearth/_next/static/chunks/`). The React server-components client (the react-server-dom-webpack package, same licence text) is inside `index-*.js`, in both `_next/` and `legacy/hearth/_next/`. Its exact version is not yet confirmed.
- three.js r180 and its example modules (GLTFLoader, GLTFExporter, RoundedBoxGeometry, Sky, Reflector and others) (ESTABLISHED by the exporter string "THREE.GLTFExporter r180"), MIT, Copyright (c) three.js authors. Files: `RoundedBoxGeometry-BKm3lc1j.js`, `GLTFExporter-Dr_KpxZZ.js`, `Sky--XMlP2yy.js`, `retreat-smxMBszs.js` (HDR loader), `cottage-Cn5v0_Zu.js` (orbit controls), `engine-CYy8SyOp.js` (the Reflector example module) and `legacy/hearth/_next/static/chunks/room-BC1m_o2K.js`.
- Rapier physics (WebAssembly) (ESTABLISHED by the name `rapier_wasm3d_bg.wasm` inside the file), embedded in `_next/static/chunks/Sky--XMlP2yy.js`. Rapier's licence is not yet confirmed: Rapier's own licence file, with its copyright line and any NOTICE file, was not available. `THIRD-PARTY-LICENSES.txt` carries the standard Apache License 2.0 text as a stand-in until it is replaced.
- Base UI (ESTABLISHED by its name and its error page address `https://base-ui.com/production-error`, both inside the files), MIT, Copyright (c) 2019 Material-UI SAS. Files: `_next/static/chunks/sheet-yA2WYJKH.js` and `legacy/hearth/_next/static/chunks/page-rukks7Wi.js`. The exact version inside the compiled files is not yet confirmed; the licence text in `THIRD-PARTY-LICENSES.txt` is from @base-ui/react 1.5.0.
- Lucide icons (ESTABLISHED by the name inside `Icon-*.js`, `sheet-*.js` and `legacy/hearth/_next/static/chunks/page-*.js`), ISC, Copyright (c) Lucide Icons and Contributors. Some Lucide icons come from Feather, MIT, Copyright (c) Cole Bemis. Files: `Icon-*.js`, `sheet-*.js`, `download-*.js`, `lightbulb-*.js`, `moon-*.js` and `legacy/hearth/_next/static/chunks/page-*.js`. The three small icon files do not hold the name. They hold icon shapes built with the icon code in `sheet-*.js`. The exact version inside the compiled files is not yet confirmed.
- vinext (ESTABLISHED by the name inside the files), MIT, Copyright (c) Cloudflare, Inc. Page runtime in `index-*.js`, `app-route-prefetch-policy-*.js` and `streamed-icons-*.js`, in both `_next/` and `legacy/hearth/_next/`. The exact version inside the compiled files is not yet confirmed.
- rolldown (LIKELY, by the file name `rolldown-runtime-C60lm6uB.js`; the file holds no library name inside), MIT, Copyright (c) 2024-present VoidZero Inc. & Contributors. This is the bundler's helper code. File: `rolldown-runtime-C60lm6uB.js` (two copies, in `_next/static/chunks/` and `legacy/hearth/_next/static/chunks/`). The exact version that built these pages is not yet confirmed; the licence text in `THIRD-PARTY-LICENSES.txt` is from rolldown 1.0.1.

Three more pieces sit in the same two files as Base UI (`_next/static/chunks/sheet-yA2WYJKH.js` and `legacy/hearth/_next/static/chunks/page-rukks7Wi.js`). None has a licence text here, because none is confirmed:
- tailwind-merge: the two files hold a class-merging table that works like the tailwind-merge library, but the library's name is not inside the files, so the match and its licence are not yet confirmed.
- class-variance-authority: the two files hold a variants helper that works like the class-variance-authority library, but the library's name is not inside the files, so the match and its licence are not yet confirmed.
- Small interface parts marked `data-slot` (buttons in both files, sheet parts in `sheet-yA2WYJKH.js`, radio group parts in `page-rukks7Wi.js`): where they came from, and under what licence, is not yet confirmed.

### Made for this project

#### Files whose own records say they are original (ESTABLISHED)

Not covered by the MIT licence. Devon Fisher keeps them.

Retreat:
- `retreat/woodland-tree.glb`: a tree model with no textures. Its own label is "Original_Woodland_Tree". The source search matched it byte for byte to the room project's tree file, whose record reads "Original generated asset". The Poly Haven fir tree is a separate file (see above).

Alder & Water, models:
- `alder/worktable-hero.glb`: the file names `author_worktable.py` as its source, and the attempt-five page lists "Original worktable and pottery, with editable source files". The source search matched it to the optimized work table export, whose record lists no third-party models or textures. The page code no longer loads this file. It is still public.
- `alder/cup.glb`, `alder/cup-fragments.glb`, `alder/cup-fragments-colliders.json`: the stoneware cup from the work table, and its shards. The source search matched the cup and the shards byte for byte to the room project's cup and shard exports; the shards are cut from the cup in the work table scene. The shard files label themselves "original ceramic decoration visual" and "original-cup-fragment-convex-colliders-v1". The attempt-five page calls the pottery original. The collider file was not in the search; it is graded by its own label.
- `alder/bench.glb`: the source search matched it byte for byte to the room project's cottage bench file, whose record lists no third-party inputs. The file's own record has no origin words, so this rests on that match.
- `alder/landscape/landscape-compact.glb`, `alder/landscape/landscape-hero.glb` and their manifests `alder/landscape/landscape-compact-manifest.json` and `alder/landscape/landscape-hero-manifest.json`: the models say "Script-created terrain, branching trees, explicit leaf meshes, grass, ferns and procedural raster materials; no stock imports". The manifests say "Original procedural landscape first pass, not photogrammetry or a surveyed Canadian ecosystem."
- `alder/library/library-compact.glb`, `alder/library/library-hero.glb` and their manifests `alder/library/library-compact-manifest.json` and `alder/library/library-hero-manifest.json`: the models say "Original code-authored tower and furnishings; no stock models or maps". The manifests say "Original first architectural pass".
- `alder/library/library-path.glb`: the source search matched it byte for byte to the library path export of the same tower build. The tower's authoring file begins "Original two-storey scientific reading tower. No imported models or textures."
- `alder/library-book/bound-field-journal-compact.glb`: the file says "author_book.py and author_maps.py, original procedural geometry and maps".
- `alder/reading-bench-v3/reading-bench-v3-compact.glb`: the file says "Original Blender mesh authoring with this project's original materials-v3 procedural wood maps; no third-party assets."

Alder & Water, textures and drawings:
- `alder/materials-v2/phone/` (12 texture files, in the folders `building-stone`, `lime-plaster`, `oak-end` and `oak-side`): procedural surface maps. The source search matched all 12 byte for byte to the room project's phone maps. The project's note on them says no photographs, downloaded textures, extracted models or image generators went in.
- `alder/library-book/plates/` (three SVG drawings): the library text calls each "An original construction drawing". The source search matched all three to the project's editable drawings. The project's source register says no outside photograph, illustration or traced artwork is included. It names public pages by the University of Copenhagen, the University of Nottingham, the Getty, Hagley and the National Diet Library of Japan as sources of facts for the drawings and the library text.

#### Not covered until its source is confirmed (LIKELY or NOT FOUND)

Each file or group below is not covered by the MIT licence until its source is confirmed.

LIKELY, from the Alder & Water build:
- `alder/library/library-path-colliders.json`: three boxes named after the three paving stones in `alder/library/library-path.glb`. The tower build's finishing step reads a file of this name beside the path model. It has no origin words of its own and was not in the source search.

Not traced:
- The other data files in `alder/`: the collider `.bin` files (`alder/landscape/terrain-compact-collider.bin` and `alder/landscape/terrain-hero-collider.bin`), `alder/library/library-character-ramps.json`, `alder/library-book/runtime-contract.json` and `alder/reading-bench-v3/reading-bench-v3-compact-contract.json`. They sit beside files from the same builds.

LIKELY, from the Hearth page:
- `legacy/hearth/favicon.svg`: a small cream house outline on a green square; the green is the Hearth page's main colour. The source search found no record of how it was made.

NOT FOUND:
- `favicon.svg` (site root): a small four-tile blue icon that matches nothing else on the site. No page links it. The source search found no record of how it was made.
