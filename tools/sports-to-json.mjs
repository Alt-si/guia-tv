// Uso: node tools/sports-to-json.mjs xmltv-sports/a.xml [b.xml ...]
// Genera data/sports.json con todos los eventos de canales deportivos (hoy + 4 días).
import { readFileSync, writeFileSync } from "node:fs";
import { classify } from "./sports-classify.mjs";

const files = process.argv.slice(2);
if (!files.length) { console.error("Falta XMLTV"); process.exit(1); }
const TZ = -3 * 3600, DAYS = 5;
const now = Math.floor(Date.now() / 1000);
const from = Math.floor((now + TZ) / 86400) * 86400 - TZ, to = from + DAYS * 86400;

const unesc = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&apos;|&#39;/g, "'").replace(/&#(\d+);/g, (_, c) => String.fromCodePoint(+c)).replace(/&amp;/g, "&").trim();
const tag = (b, t) => { const m = new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`).exec(b); return m ? unesc(m[1]) : ""; };
function ts(s) {
  const m = /^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)?\s*([+-]\d{4})?/.exec(s || "");
  if (!m) return NaN;
  const off = m[7] ? (m[7][0] === "-" ? -1 : 1) * (+m[7].slice(1, 3) * 3600 + +m[7].slice(3, 5) * 60) : 0;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)) / 1000 - off;
}
const FILLER = /^(programacion|programa[cç]ao|a confirmar|sin programacion|fuera de aire|no hay programacion|off air|to be announced|tba)\b/i;
const strip = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

const events = [], seen = new Set(), countries = new Set(), chans = new Set();
for (const f of files) {
  let map = {};
  try { map = JSON.parse(readFileSync(f.replace(/\.xml$/, ".map.json"), "utf8")); } catch {}
  const xml = readFileSync(f, "utf8");
  const dn = new Map();
  for (const c of xml.matchAll(/<channel\s+id="([^"]*)"[^>]*>([\s\S]*?)<\/channel>/g)) dn.set(c[1], tag(c[2], "display-name"));
  const re = /<programme\s([^>]*)>([\s\S]*?)<\/programme>/g;
  let m;
  while ((m = re.exec(xml))) {
    const a = m[1];
    const s = ts((/start="([^"]*)"/.exec(a) || [])[1]), e = ts((/stop="([^"]*)"/.exec(a) || [])[1]);
    const xid = (/channel="([^"]*)"/.exec(a) || [])[1] || "";
    const info = map[xid] || map[xid.replace(/@.*$/, "")] || { name: dn.get(xid) || xid, cc: "??" };
    if (!(e > s) || e <= from || s >= to) continue;
    const title0 = tag(m[2], "title"), sub = tag(m[2], "sub-title");
    if (!title0 || FILLER.test(strip(title0).toLowerCase())) continue;
    const title = sub ? `${title0}: ${sub}` : title0;
    const desc = tag(m[2], "desc").slice(0, 180);
    const key = `${info.name}|${info.cc}|${s}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { p, r } = classify(title, desc, info.name);
    events.push({ s, e, t: title, d: desc, c: info.name, k: info.cc, p, r });
    countries.add(info.cc); chans.add(info.name + info.cc);
  }
}
if (!events.length) { console.error("Sin eventos: no se sobreescribe sports.json"); process.exit(2); }
events.sort((x, y) => x.s - y.s);
writeFileSync(new URL("../data/sports.json", import.meta.url), JSON.stringify({ meta: { generated: now, demo: false }, events }));
const by = {}; for (const ev of events) by[ev.p] = (by[ev.p] || 0) + 1;
console.log(`${events.length} eventos, ${chans.size} canales, países: ${[...countries].join(",")}`);
console.log("Por deporte:", JSON.stringify(by));
