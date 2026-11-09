#!/usr/bin/env node
// Renders the marketing comparison boards in assets/marketing/.
//
// These are documentation artwork that restate the before/after comparison. They are rendered
// from source rather than hand-edited as binaries, so they can be regenerated and diffed.
// Every figure, name and line of copy is data-true to the Plotline example: the values match
// demo/after/src/ and the real captures in assets/examples/. The colour tokens are copied from
// demo/after/src/index.css so the boards cannot drift from the product.
//
// Usage: npm i --no-save sharp && node benchmarks/marketing-boards.mjs [--out DIR]
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = process.argv.includes("--out")
  ? path.resolve(process.argv[process.argv.indexOf("--out") + 1])
  : path.join(root, "assets/marketing");
fs.mkdirSync(outDir, { recursive: true });

// Copied from demo/after/src/index.css. Keep them in sync with the product theme.
const P = { paper:"#f4efe4", deep:"#ebe4d3", surface:"#fffcf6", rule:"#ddd4bf", ruleStrong:"#8a8372",
  ink:"#1c1a16", muted:"#5d584b", faint:"#6f6959", vermilion:"#d6451f", primary:"#a52801",
  primarySoft:"#fde5dc", ultra:"#2a4f8f", ultraSoft:"#e3ebf8", danger:"#c73833", dangerSoft:"#fee8e5",
  success:"#036f37", successSoft:"#def5e3", warning:"#9e650a", warningSoft:"#feead4" };
const SERIF = "Liberation Serif, DejaVu Serif, serif";
const SANS = "Liberation Sans, DejaVu Sans, sans-serif";

// Counted from the rule engine itself, never hardcoded: a board that states the wrong number of
// enforced rules is a false claim, and this repo already shipped one at 17 when the engine had 18.
const a11yRuleCount = [...new Set(
  [...fs.readFileSync(path.join(root, "skills/glowup-ui/scripts/a11y.mjs"), "utf8")
    .matchAll(/push\(\s*"([a-z0-9-]+)"/g)].map((m) => m[1]),
)].length;

const render = async (svg, file) => {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(outDir, file));
  console.log("wrote " + path.relative(root, path.join(outDir, file)));
};

// --------------------------------------------------------------- desktop board: 1600 x 900
const W = 1600, H = 900;
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
    <path d="M28 0H0V28" fill="none" stroke="${P.rule}" stroke-width="0.9" opacity="0.55"/>
  </pattern>
  <filter id="lift" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#1c1a16" flood-opacity="0.16"/>
  </filter>
  <filter id="liftSm" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#1c1a16" flood-opacity="0.14"/>
  </filter>
</defs>

<rect width="${W}" height="${H}" fill="${P.paper}"/>
<rect width="${W}" height="${H}" fill="url(#grid)"/>

<!-- eyebrow -->
<g font-family="${SANS}" font-size="14" letter-spacing="2.6" fill="${P.vermilion}" font-weight="bold">
  <text x="80" y="72">GLOWUP UI</text>
</g>
<text x="80" y="150" font-family="${SERIF}" font-size="72" fill="${P.ink}" font-weight="bold">Same app. Same data.</text>
<text x="80" y="222" font-family="${SERIF}" font-size="72" fill="${P.primary}" font-weight="bold" font-style="italic">Twice the conviction.</text>
<text x="82" y="266" font-family="${SANS}" font-size="20" fill="${P.muted}">One pass of the skill. Routes, copy, APIs and behaviour untouched.</text>

<!-- BEFORE panel -->
<g>
  <rect x="80" y="310" width="700" height="470" rx="6" fill="${P.surface}" filter="url(#liftSm)" stroke="${P.rule}"/>
  <rect x="80" y="310" width="700" height="52" rx="6" fill="${P.deep}"/>
  <rect x="80" y="352" width="700" height="10" fill="${P.deep}"/>
  <text x="104" y="343" font-family="${SANS}" font-size="15" letter-spacing="1.8" fill="${P.faint}" font-weight="bold">BEFORE</text>

  <!-- crude app chrome -->
  <rect x="104" y="388" width="652" height="1" fill="${P.rule}"/>
  <text x="104" y="376" font-family="${SANS}" font-size="13" fill="${P.muted}">Plotline &#160; Dashboard &#160; Projects &#160; Team</text>
  <text x="104" y="416" font-family="${SANS}" font-size="22" font-weight="bold" fill="${P.ink}">Dashboard</text>
  <text x="104" y="438" font-family="${SANS}" font-size="12" fill="${P.muted}">Welcome back, Ana. Here is what is happening at the studio.</text>

  <!-- four flat boxes -->
  ${[0,1,2,3].map(i=>`<rect x="${104+i*163}" y="452" width="151" height="58" fill="none" stroke="${P.rule}"/>
    <text x="${116+i*163}" y="470" font-family="${SANS}" font-size="9.5" fill="${P.faint}">${["Active projects","At risk","Open tasks","Pipeline"][i]}</text>
    <text x="${116+i*163}" y="494" font-family="${SANS}" font-size="16" font-weight="bold" fill="${P.ink}">${["2","1","7","$276,000"][i]}</text>`).join("")}

  <text x="104" y="540" font-family="${SANS}" font-size="12" font-weight="bold" fill="${P.ink}">Recent activity</text>
  ${[
    "Ana Ruiz uploaded 4 files to Harbor rebrand",
    "Ben Okafor flagged a blocker on Atlas mobile app",
    "Dev Patel completed \u201cInformation architecture\u201d",
    "Chlo\u00e9 Martin archived the final files",
    "Felix Wagner commented on Atlas mobile app",
  ].map((t,i)=>`<rect x="104" y="${550+i*26}" width="440" height="1" fill="${P.rule}"/>
    <text x="104" y="${568+i*26}" font-family="${SANS}" font-size="10" fill="${P.ink}">${t}</text>
    <text x="${396+i*3}" y="${568+i*26}" font-family="${SANS}" font-size="8" fill="${P.faint}">${["12m","1h","3h","1d","1d"][i]}</text>`).join("")}
  <text x="560" y="540" font-family="${SANS}" font-size="12" font-weight="bold" fill="${P.ink}">Needs attention</text>
  <rect x="560" y="548" width="196" height="46" fill="none" stroke="#e0a9a4"/>
  <text x="568" y="566" font-family="${SANS}" font-size="10" fill="${P.ink}">Atlas mobile app</text>
  <rect x="664" y="556" width="38" height="13" fill="${P.dangerSoft}"/>
  <text x="669" y="566" font-family="${SANS}" font-size="8.5" fill="${P.danger}">At risk</text>
  <rect x="568" y="572" width="120" height="3" fill="${P.dangerSoft}"/><rect x="568" y="572" width="49" height="3" fill="${P.danger}"/>
  <text x="568" y="588" font-family="${SANS}" font-size="9" fill="${P.muted}">41% complete</text>
  <!-- empty void -->
  <rect x="104" y="700" width="440" height="52" fill="none" stroke="#c9c2b0" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="112" y="722" font-family="${SANS}" font-size="10" fill="#a8a294" font-style="italic">315px of the fold, doing nothing</text>
</g>

<!-- AFTER panel -->
<g>
  <rect x="820" y="310" width="700" height="470" rx="6" fill="${P.surface}" filter="url(#lift)" stroke="${P.rule}"/>
  <rect x="820" y="310" width="700" height="52" rx="6" fill="${P.vermilion}"/>
  <rect x="820" y="352" width="700" height="10" fill="${P.vermilion}"/>
  <text x="844" y="343" font-family="${SANS}" font-size="15" letter-spacing="1.8" fill="#ffffff" font-weight="bold">AFTER</text>

  <!-- top bar -->
  <circle cx="852" cy="392" r="11" fill="${P.ink}"/>
  <text x="846" y="397" font-family="${SERIF}" font-size="12" fill="${P.paper}" font-weight="bold">P</text>
  <text x="872" y="398" font-family="${SERIF}" font-size="17" fill="${P.ink}" font-weight="bold">Plotline</text>
  <rect x="958" y="378" width="112" height="27" rx="13.5" fill="${P.ink}"/>
  <text x="974" y="396" font-family="${SANS}" font-size="11" fill="${P.paper}">Dashboard</text>
  <text x="1086" y="396" font-family="${SANS}" font-size="11" fill="${P.muted}">Projects</text>
  <text x="1150" y="396" font-family="${SANS}" font-size="11" fill="${P.muted}">Team</text>
  <rect x="1444" y="378" width="58" height="27" rx="13.5" fill="none" stroke="${P.rule}"/>
  <text x="1454" y="396" font-family="${SANS}" font-size="10" fill="${P.muted}">Log out</text>
  <rect x="820" y="418" width="700" height="1" fill="${P.ink}"/>

  <!-- hero figure -->
  <text x="852" y="470" font-family="${SERIF}" font-size="40" fill="${P.ink}" font-weight="bold">Dashboard</text>
  <text x="852" y="490" font-family="${SANS}" font-size="11" fill="${P.muted}">Welcome back, Ana. Here is what is happening at the studio.</text>
  <rect x="852" y="508" width="636" height="1" fill="${P.rule}"/>

  <text x="852" y="534" font-family="${SANS}" font-size="9" letter-spacing="1.7" fill="${P.faint}">PIPELINE HEALTH</text>
  <text x="848" y="600" font-family="${SERIF}" font-size="62" fill="${P.ink}" font-weight="bold">$276,000</text>
  <text x="852" y="622" font-family="${SANS}" font-size="10.5" fill="${P.muted}">Excludes completed work</text>
  <line x1="1290" y1="536" x2="1290" y2="616" stroke="${P.rule}"/>
  <text x="1312" y="556" font-family="${SERIF}" font-size="26" fill="${P.ink}" font-weight="bold">2</text>
  <text x="1312" y="572" font-family="${SANS}" font-size="9.5" fill="${P.muted}">active</text>
  <text x="1380" y="556" font-family="${SERIF}" font-size="26" fill="${P.danger}" font-weight="bold">1</text>
  <text x="1380" y="572" font-family="${P.danger}" font-size="9.5" fill="${P.danger}">at risk</text>
  <text x="1440" y="556" font-family="${SERIF}" font-size="26" fill="${P.ink}" font-weight="bold">7</text>
  <text x="1440" y="572" font-family="${SANS}" font-size="9.5" fill="${P.muted}">open</text>
  <rect x="852" y="636" width="636" height="1" fill="${P.ink}"/>

  <!-- chart card -->
  <rect x="852" y="652" width="406" height="112" rx="3" fill="${P.surface}" stroke="${P.ruleStrong}"/>
  <text x="870" y="678" font-family="${SERIF}" font-size="15" fill="${P.ink}" font-weight="bold">Studio line</text>
  <text x="1176" y="678" font-family="${SANS}" font-size="8" fill="${P.muted}">Progress by due date</text>
  <polyline points="884,700 962,724 1040,706 1118,730 1196,728 1240,732" fill="none" stroke="${P.ink}" stroke-width="1.8"/>
  <circle cx="884" cy="700" r="3.4" fill="${P.muted}"/><circle cx="962" cy="724" r="3.4" fill="${P.danger}"/>
  <circle cx="1040" cy="706" r="3.4" fill="${P.success}"/><circle cx="1118" cy="730" r="3.4" fill="${P.success}"/>
  <circle cx="1240" cy="732" r="3.4" fill="${P.warning}"/>
  <text x="880" y="694" font-family="${SANS}" font-size="7.5" fill="${P.ink}">Quarry report</text>
  <text x="1030" y="700" font-family="${SANS}" font-size="7.5" fill="${P.ink}">Harbor rebrand</text>
  <text x="1110" y="724" font-family="${SANS}" font-size="7.5" fill="${P.ink}">Nimbus docs</text>

  <!-- needs attention -->
  <text x="1290" y="678" font-family="${SERIF}" font-size="15" fill="${P.ink}" font-weight="bold">Needs attention</text>
  <rect x="1290" y="690" width="198" height="70" rx="3" fill="${P.dangerSoft}" stroke="#e8b6ae"/>
  <text x="1300" y="710" font-family="${SERIF}" font-size="12.5" fill="${P.ink}" font-weight="bold">Atlas mobile app</text>
  <text x="1444" y="710" font-family="${SANS}" font-size="8.5" fill="${P.danger}">At risk</text>
  <rect x="1300" y="718" width="178" height="3.5" fill="#f6cfc8"/><rect x="1300" y="718" width="73" height="3.5" fill="${P.danger}"/>
  <text x="1300" y="734" font-family="${SANS}" font-size="9" fill="${P.ink}">41% complete</text>
  <text x="1300" y="750" font-family="${SANS}" font-size="8.5" fill="${P.faint}">Due Nov 2, 2026</text>
</g>

<!-- footer stats -->
<line x1="80" y1="822" x2="1520" y2="822" stroke="${P.ruleStrong}"/>
<g font-family="${SANS}" font-size="13" fill="${P.muted}">
  <text x="80" y="856"><tspan font-family="${SERIF}" font-size="26" fill="${P.ink}" font-weight="bold">0</tspan>  routes changed</text>
  <text x="330" y="856"><tspan font-family="${SERIF}" font-size="26" fill="${P.ink}" font-weight="bold">0</tspan>  API calls touched</text>
  <text x="610" y="856"><tspan font-family="${SERIF}" font-size="26" fill="${P.ink}" font-weight="bold">12</tspan>  original tests still green</text>
  <text x="960" y="856"><tspan font-family="${SERIF}" font-size="26" fill="${P.ink}" font-weight="bold">${a11yRuleCount}</tspan>  a11y rules enforced</text>
</g>
<text x="80" y="886" font-family="${SANS}" font-size="10.5" fill="${P.faint}">Maintainer-directed example from benchmarks/showcase.mjs — a controlled fixture edit, not a model A/B benchmark.</text>
</svg>`;
await render(svg, "comparison-desktop.png");

// --------------------------------------------------------------- phone board: 1080 x 1350
const W2 = 1080, H2 = 1350;
const PW = 304, PH = 658, GAP = 84;
const x1 = (W2 - (PW*2+GAP))/2, x2 = x1 + PW + GAP, py = 400;


const phone = (x, after) => {
  const chrome = after
    ? `<rect x="${x}" y="${py}" width="${PW}" height="${PH}" rx="34" fill="${P.ink}"/>`
    : `<rect x="${x}" y="${py}" width="${PW}" height="${PH}" rx="34" fill="#8f8878"/>`;
  const screen = `<rect x="${x+7}" y="${py+7}" width="${PW-14}" height="${PH-14}" rx="28" fill="${P.surface}"/>`;
  return chrome + screen;
};

const beforeInner = (x) => `
  <g>
    <text x="${x+22}" y="${py+46}" font-family="${SANS}" font-size="13" font-weight="bold" fill="${P.ink}">Plotline</text>
    <text x="${x+232}" y="${py+46}" font-family="${SANS}" font-size="10" fill="${P.muted}">Log out</text>
    <rect x="${x+18}" y="${py+60}" width="${PW-36}" height="1" fill="${P.rule}"/>
    <text x="${x+22}" y="${py+96}" font-family="${SANS}" font-size="24" font-weight="bold" fill="${P.ink}">Dashboard</text>
    <text x="${x+22}" y="${py+120}" font-family="${SANS}" font-size="9" fill="${P.muted}">Welcome back, Ana. Here is what is</text>
    <text x="${x+22}" y="${py+133}" font-family="${SANS}" font-size="9" fill="${P.muted}">happening at the studio.</text>
    ${[0,1,2,3].map(i=>{const cx=x+18+(i%2)*128, cy=py+156+Math.floor(i/2)*62;
      return `<rect x="${cx}" y="${cy}" width="120" height="52" fill="none" stroke="${P.rule}"/>
      <text x="${cx+8}" y="${cy+18}" font-family="${SANS}" font-size="7" fill="${P.faint}">${["Active projects","At risk","Open tasks","Pipeline"][i]}</text>
      <text x="${cx+8}" y="${cy+38}" font-family="${SANS}" font-size="14" font-weight="bold" fill="${P.ink}">${["2","1","7","$276,000"][i]}</text>`;}).join("")}
    <text x="${x+22}" y="${py+318}" font-family="${SANS}" font-size="10" font-weight="bold" fill="${P.ink}">Recent activity</text>
    ${["Ana Ruiz uploaded 4 files","Ben Okafor flagged a blocker","Dev Patel completed IA","Chlo\u00e9 Martin archived files"]
      .map((t,i)=>`<rect x="${x+18}" y="${py+330+i*26}" width="${PW-36}" height="1" fill="${P.rule}"/>
      <text x="${x+22}" y="${py+348+i*26}" font-family="${SANS}" font-size="8" fill="${P.ink}">${t}</text>`).join("")}
    <rect x="${x+18}" y="${py+470}" width="${PW-36}" height="120" fill="none" stroke="#c9c2b0" stroke-dasharray="4 4"/>
    <text x="${x+26}" y="${py+496}" font-family="${SANS}" font-size="8.5" fill="#a8a294" font-style="italic">empty below the fold</text>
    <rect x="${x+7}" y="${py+PH-60}" width="${PW-14}" height="53" fill="${P.surface}"/>
    <rect x="${x+7}" y="${py+PH-60}" width="${PW-14}" height="1" fill="${P.rule}"/>
    ${["Dashboard","Projects","Team","Settings"].map((t,i)=>`<text x="${x+20+i*72}" y="${py+PH-30}" font-family="${SANS}" font-size="7.5" fill="${P.muted}">${t}</text>`).join("")}
  </g>`;

const afterInner = (x) => `
  <g>
    <circle cx="${x+30}" cy="${py+40}" r="10" fill="${P.ink}"/>
    <text x="${x+26}" y="${py+44}" font-family="${SERIF}" font-size="10" fill="${P.paper}" font-weight="bold">P</text>
    <text x="${x+46}" y="${py+45}" font-family="${SERIF}" font-size="14" fill="${P.ink}" font-weight="bold">Plotline</text>
    <circle cx="${x+252}" cy="${py+40}" r="12" fill="none" stroke="${P.rule}"/>
    <text x="${x+249}" y="${py+44}" font-family="${SANS}" font-size="9" fill="${P.muted}">&#8594;</text>
    <rect x="${x+7}" y="${py+58}" width="${PW-14}" height="1" fill="${P.ink}"/>

    <text x="${x+22}" y="${py+100}" font-family="${SERIF}" font-size="27" fill="${P.ink}" font-weight="bold">Dashboard</text>
    <text x="${x+22}" y="${py+120}" font-family="${SANS}" font-size="8.5" fill="${P.muted}">Welcome back, Ana. Here is what is happening</text>
    <text x="${x+22}" y="${py+132}" font-family="${SANS}" font-size="8.5" fill="${P.muted}">at the studio.</text>

    <rect x="${x+22}" y="${py+148}" width="${PW-44}" height="1" fill="${P.rule}"/>
    ${[0,1,2,3].map(i=>{const cx=x+22+(i%2)*126, cy=py+162+Math.floor(i/2)*56;
      const accent = i===1;
      return `<text x="${cx}" y="${cy+12}" font-family="${SANS}" font-size="7.5" fill="${accent?P.danger:P.faint}">${["Active projects","At risk","Open tasks","Pipeline"][i]}</text>
      <text x="${cx}" y="${cy+40}" font-family="${SERIF}" font-size="22" font-weight="bold" fill="${accent?P.danger:P.ink}">${["2","1","7","$276,000"][i]}</text>`;}).join("")}
    <rect x="${x+22}" y="${py+288}" width="${PW-44}" height="1" fill="${P.ink}"/>

    <rect x="${x+22}" y="${py+304}" width="${PW-44}" height="120" rx="3" fill="${P.surface}" stroke="${P.ruleStrong}"/>
    <text x="${x+34}" y="${py+324}" font-family="${SERIF}" font-size="12" fill="${P.ink}" font-weight="bold">Studio line</text>
    <text x="${x+180}" y="${py+324}" font-family="${SANS}" font-size="7" fill="${P.muted}">Progress by due date</text>
    <polyline points="${x+38},${py+350} ${x+100},${py+374} ${x+162},${py+356} ${x+224},${py+382} ${x+276},${py+378}" fill="none" stroke="${P.ink}" stroke-width="1.5"/>
    <circle cx="${x+38}" cy="${py+350}" r="2.8" fill="${P.muted}"/>
    <circle cx="${x+100}" cy="${py+374}" r="2.8" fill="${P.danger}"/>
    <circle cx="${x+162}" cy="${py+356}" r="2.8" fill="${P.success}"/>
    <circle cx="${x+224}" cy="${py+382}" r="2.8" fill="${P.success}"/>
    <circle cx="${x+276}" cy="${py+378}" r="2.8" fill="${P.warning}"/>

    <text x="${x+22}" y="${py+452}" font-family="${SERIF}" font-size="12" fill="${P.ink}" font-weight="bold">Needs attention</text>
    <rect x="${x+22}" y="${py+462}" width="${PW-44}" height="64" rx="3" fill="${P.dangerSoft}" stroke="#e8b6ae"/>
    <text x="${x+32}" y="${py+480}" font-family="${SERIF}" font-size="10.5" fill="${P.ink}" font-weight="bold">Atlas mobile app</text>
    <text x="${x+206}" y="${py+480}" font-family="${SANS}" font-size="7" fill="${P.danger}">At risk</text>
    <rect x="${x+32}" y="${py+488}" width="${PW-64}" height="3" fill="#f6cfc8"/>
    <rect x="${x+32}" y="${py+488}" width="76" height="3" fill="${P.danger}"/>
    <text x="${x+32}" y="${py+506}" font-family="${SANS}" font-size="7.5" fill="${P.ink}">41% complete</text>

    <rect x="${x+7}" y="${py+PH-60}" width="${PW-14}" height="53" fill="${P.surface}"/>
    <rect x="${x+7}" y="${py+PH-60}" width="${PW-14}" height="1" fill="${P.rule}"/>
    ${["Dashboard","Projects","Team","Settings"].map((t,i)=>`<text x="${x+16+i*72}" y="${py+PH-30}" font-family="${SANS}" font-size="7.5" fill="${i===0?P.vermilion:P.muted}" font-weight="${i===0?"bold":"normal"}">${t}</text>`).join("")}
  </g>`;

const svg2 = `<svg width="${W2}" height="${H2}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse">
    <path d="M30 0H0V30" fill="none" stroke="${P.rule}" stroke-width="0.9" opacity="0.5"/>
  </pattern>
  <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#1c1a16" flood-opacity="0.20"/>
  </filter>
</defs>
<rect width="${W2}" height="${H2}" fill="${P.paper}"/>
<rect width="${W2}" height="${H2}" fill="url(#g)"/>

<text x="${W2/2}" y="104" text-anchor="middle" font-family="${SANS}" font-size="15" letter-spacing="3.4" fill="${P.vermilion}" font-weight="bold">GLOWUP UI</text>
<text x="${W2/2}" y="182" text-anchor="middle" font-family="${SERIF}" font-size="66" fill="${P.ink}" font-weight="bold">The phone</text>
<text x="${W2/2}" y="254" text-anchor="middle" font-family="${SERIF}" font-size="66" fill="${P.primary}" font-weight="bold" font-style="italic">got the same pass.</text>
<text x="${W2/2}" y="308" text-anchor="middle" font-family="${SANS}" font-size="19" fill="${P.muted}">Illustrative render of the Plotline example \u2014 before and after.</text>

<g filter="url(#s)">${phone(x1,false)}${phone(x2,true)}</g>
${beforeInner(x1)}
${afterInner(x2)}

<text x="${x1+PW/2}" y="${py-22}" text-anchor="middle" font-family="${SANS}" font-size="13" letter-spacing="2.4" fill="${P.faint}" font-weight="bold">BEFORE</text>
<text x="${x2+PW/2}" y="${py-22}" text-anchor="middle" font-family="${SANS}" font-size="13" letter-spacing="2.4" fill="${P.vermilion}" font-weight="bold">AFTER</text>

<line x1="${x1-40}" y1="1150" x2="${x2+PW+40}" y2="1150" stroke="${P.ruleStrong}"/>
<text x="${W2/2}" y="1204" text-anchor="middle" font-family="${SANS}" font-size="17" fill="${P.muted}"><tspan font-family="${SERIF}" font-size="30" font-weight="bold" fill="${P.ink}">44px</tspan> touch targets   ·   <tspan font-family="${SERIF}" font-size="30" font-weight="bold" fill="${P.ink}">${a11yRuleCount}</tspan> a11y rules   ·   <tspan font-family="${SERIF}" font-size="30" font-weight="bold" fill="${P.ink}">0</tspan> routes changed</text>
<text x="${W2/2}" y="1290" text-anchor="middle" font-family="${SANS}" font-size="12.5" fill="${P.faint}">Illustrative render of the Plotline example in benchmarks/showcase.mjs.</text>
</svg>`;
await render(svg2, "comparison-phone.png");
