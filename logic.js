// Shared mapping + scoring logic (used by index.html and by score.js for verification)
const REGIONS = {
  brain:        "Brain (fore/mid/hindbrain)",
  eye:          "Eye / retina",
  olfactory:    "Olfactory placode",
  otic:         "Otic vesicle",
  spinal_cord:  "Spinal cord",
  notochord:    "Notochord",
  somites:      "Somites / muscle",
  psm:          "Presomitic mesoderm / tail bud",
  pronephros:   "Pronephros",
  heart:        "Heart",
  blood:        "Blood / ICM",
  vasculature:  "Vasculature",
  myeloid:      "Myeloid cells",
  liver:        "Liver",
  gut:          "Gut / endoderm",
  skin:         "Skin (periderm/epidermis)",
  pigment:      "Neural crest / pigment cells",
  arches:       "Pharyngeal arches / head mesenchyme",
  lateral_line: "Lateral line",
  fins:         "Fins / fin fold",
  hatching:     "Hatching gland"
};

// Daniocell tissue group -> cartoon region (null = no cartoon region; flagged as unmapped)
const CLUSTER_TO_REGION = {
  "axial meso. (other)": "notochord", "blastomeres": null, "endocrine pancreas": "gut",
  "endoderm (other)": "gut", "epidermis": "skin", "erythrocytes": "blood",
  "exocrine pancreas": "gut", "eye": "eye", "fast muscle": "somites", "fin epithelia": "skin",
  "fin mesenchyme": "fins", "glia": "spinal_cord", "gut": "gut", "hatching gland": "hatching",
  "heart": "heart", "immune cells": "myeloid", "ionocytes": "skin", "iridophores": "pigment",
  "lateral line": "lateral_line", "liver": "liver", "melanocytes": "pigment",
  "mesenchyme": "arches", "mucous-secreting": "skin", "mural cells": "vasculature",
  "muscle": "somites", "neural": "brain", "notochord": "notochord", "olfactory": "olfactory",
  "otic": "otic", "paraxial mesoderm": "psm", "pericytes": "vasculature", "periderm": "skin",
  "PGCs": null, "presomitic mesoderm": "psm", "pronephros": "pronephros",
  "slow muscle": "somites", "somites": "somites", "spinal cord": "spinal_cord", "taste": null,
  "vascular smooth muscle": "vasculature", "vasculature": "vasculature",
  "visceral smooth muscle": "gut", "xanthophores": "pigment"
};

// ZFIN anatomy term -> cartoon region(s). Terms marked fine:true are finer than any Daniocell cluster.
const TERM_TO_REGION = {
  "pronephric duct": {r: ["pronephros"]}, "cloaca": {r: ["pronephros"]},
  "epiphysis": {r: ["brain"], fine: true}, "eye": {r: ["eye"]}, "immature eye": {r: ["eye"]},
  "optic vesicle": {r: ["eye"]}, "retina": {r: ["eye"]}, "optic stalk": {r: ["eye"], fine: true},
  "hindbrain": {r: ["brain"], fine: true}, "midbrain hindbrain boundary": {r: ["brain"], fine: true},
  "neural tube": {r: ["brain", "spinal_cord"]}, "neuron": {r: ["brain", "spinal_cord"]},
  "spinal cord": {r: ["spinal_cord"]}, "neural crest": {r: ["pigment"]},
  "lateral line system": {r: ["lateral_line"]}, "liver": {r: ["liver"]},
  "ventral mesoderm": {r: ["blood"]}, "intermediate cell mass of mesoderm": {r: ["blood"]},
  "blood": {r: ["blood"]}, "segmental plate": {r: ["psm"]}, "tail bud": {r: ["psm"]},
  "somite": {r: ["somites"]}, "periderm": {r: ["skin"]}, "epidermis": {r: ["skin"]},
  "macrophage": {r: ["myeloid"]}, "otic placode": {r: ["otic"]}, "otic vesicle": {r: ["otic"]},
  "pharyngeal arch 3-7 skeleton": {r: ["arches"]}, "notochord": {r: ["notochord"]},
  "mesoderm": {r: []}, "unspecified": {r: []}
};

const STRONG = {p: 20, e: 0.4};   // predicted "on": >=20% cells AND >=0.4 relative mean expression
const SHOWN  = {p: 10, e: 0.15};  // drawn faintly on the map, not scored

// Per-region predicted intensity = max over its clusters of e * min(1, p/60)
function predictRegions(dcList) {
  const regions = {}; const unmapped = [];
  for (const [cl, p, e] of dcList) {
    const r = CLUSTER_TO_REGION[cl];
    if (r === undefined || r === null) { if (p >= SHOWN.p && e >= SHOWN.e) unmapped.push(cl); continue; }
    const inten = e * Math.min(1, p / 60);
    const strong = p >= STRONG.p && e >= STRONG.e;
    const shown = p >= SHOWN.p && e >= SHOWN.e;
    if (!shown) continue;
    const cur = regions[r] || {inten: 0, strong: false, clusters: []};
    cur.inten = Math.max(cur.inten, inten);
    cur.strong = cur.strong || strong;
    cur.clusters.push({cl, p, e});
    regions[r] = cur;
  }
  return {regions, unmapped};
}

function observedRegions(terms) {
  const regions = {}; let fine = []; const unmapped = [];
  for (const t of terms) {
    const m = TERM_TO_REGION[t];
    if (!m || !m.r.length) { unmapped.push(t); continue; }
    if (m.fine) fine.push(t);
    for (const r of m.r) (regions[r] = regions[r] || []).push(t);
  }
  return {regions, fine, unmapped};
}

function scoreCell(gene, stage) {
  const pred = predictRegions(gene.dc[stage] || []);
  const obs = observedRegions(gene.ish[stage] || []);
  const P = new Set(Object.keys(pred.regions).filter(r => pred.regions[r].strong));
  const O = new Set(Object.keys(obs.regions));
  const inter = [...P].filter(r => O.has(r));
  const union = new Set([...P, ...O]);
  let verdict, jaccard = null;
  if (O.size === 0) verdict = "No ISH data";
  else {
    jaccard = union.size ? inter.length / union.size : 0;
    verdict = jaccard >= 0.67 ? "Concordant" : jaccard >= 0.25 ? "Partial" : "Discordant";
  }
  const missed = [...O].filter(r => !P.has(r));
  const extra = [...P].filter(r => !O.has(r));
  // failure-mode tags (which approach could fix it)
  const tags = [];
  if (obs.fine.length) tags.push("resolution");            // ISH is finer than clusters -> approach 2/3 helps
  if (missed.some(r => pred.regions[r] && !pred.regions[r].strong)) tags.push("weak-signal");
  if (missed.some(r => !pred.regions[r])) tags.push("not-detected"); // dropout/sensitivity -> 2/3 does not help
  if (extra.length) tags.push("extra-prediction");          // ambient RNA/doublets/annotation gaps
  if (pred.unmapped.length) tags.push("unmapped-cluster");
  return {P: [...P], O: [...O], inter, jaccard, verdict, missed, extra, tags, pred, obs};
}

if (typeof module !== "undefined") module.exports = {REGIONS, CLUSTER_TO_REGION, TERM_TO_REGION, STRONG, SHOWN, predictRegions, observedRegions, scoreCell};
