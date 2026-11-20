# Virtual ISH from single-cell data (prototype)

**Research and hypothesis generation only.** The maps are predictions from cluster-level scRNA-seq averages, not images of embryos.

This interactive page paints [Daniocell](https://daniocell.nichd.nih.gov/) expression onto a cartoon zebrafish embryo ("approach 1"). It then scores each prediction against Thisse high-throughput whole-mount ISH annotations from [ZFIN](https://zfin.org/downloads).

- **Genes (10):** cdh17, crx, egr2b, fabp10a, gata1a, her1, krt4, mpx, pax2a, tbxta
- **Stages (3):**

| Stage | Daniocell scRNA-seq | Thisse ISH |
|---|---|---|
| Segmentation | 14–21 hpf | 14–19 somites |
| Pharyngula | 24–34 hpf | 20–25 somites to Prim-25 |
| Hatching | 48–58 hpf | High-pec to Long-pec |

- **Score:** Jaccard overlap of cartoon regions. Concordant ≥ 0.67, Partial 0.25–0.66, Discordant < 0.25.

## Files

| File | Purpose |
|---|---|
| `index.html` | The site: one self-contained file with no external dependencies |
| `data.json` | Daniocell values (% cells, relative mean) and ZFIN Thisse terms per gene × stage |
| `logic.js` | Cluster→region and term→region maps, calling thresholds, scoring |
| `template.html` | Page source before data and logic are inlined |
| `build.py` | `python3 build.py` inlines `data.json` + `logic.js` into `index.html` |
| `score.js` | `node score.js` prints the agreement matrix in the terminal |

## Deploy on GitHub Pages

1. Create a repository and add these files. `index.html` must be at the repository root.
2. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
3. The site goes live at `https://<user>.github.io/<repo>/`.

## Add a gene or stage

1. Add an entry to `data.json`:
   - `dc`: `[group, % cells, relative mean 0–1]` from the Daniocell dot plot (`gene/<L>/<gene>/<gene>_dotplot_all.svg`)
   - `ish`: ZFIN anatomy terms from the Thisse publications (ZDB-PUB-010810-1, -040907-1, -051025-1, -080227-22)
2. Map any new ZFIN terms in `logic.js`.
3. Run `python3 build.py`.

## Caveats

- Relative mean expression is estimated from the dot colors on Daniocell's per-gene color scale.
- "No ISH data" isn't proof of absence.
- The single body plan is schematic and reused across stages.
- Known biases: ambient RNA (e.g., *krt4*), dissociation loss, dropout, and incomplete ISH annotation.

Data © their providers (Daniocell: Sur et al. 2023, *Dev Cell*; ZFIN; Thisse et al.). Prototype by Anil K. Challa.
