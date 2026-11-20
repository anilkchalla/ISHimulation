// node score.js  -> prints the agreement matrix used in the README
const L = require("./logic.js");
const D = require("./data.json");
const rows = []; const tally = {}; const tagCount = {}; let js = [];
for (const [g, gene] of Object.entries(D.genes)) {
  for (const s of ["A", "B", "C"]) {
    const r = L.scoreCell(gene, s);
    tally[r.verdict] = (tally[r.verdict] || 0) + 1;
    if (r.jaccard !== null) { js.push(r.jaccard); r.tags.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1); }
    rows.push(`${g.padEnd(8)} ${s} ${r.verdict.padEnd(11)} J=${r.jaccard === null ? " -  " : r.jaccard.toFixed(2)}  P=[${r.P}] O=[${r.O}] tags=[${r.tags}]`);
  }
}
console.log(rows.join("\n"));
console.log("\nVerdicts:", tally);
console.log("Mean Jaccard (scored cells):", (js.reduce((a, b) => a + b, 0) / js.length).toFixed(2), "n=", js.length);
console.log("Failure-mode tags among scored cells:", tagCount);
