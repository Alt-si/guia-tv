// Clasifica un programa de TV en deporte + torneo a partir de título/descripción/canal.
import { normName } from "./match.mjs";

const n = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Orden importa: lo más específico primero.
const SPORTS = [
  ["motor", /\b(formula ?(1|one|e|2|3)|f1|f2|f3|motogp|moto ?gp|moto2|moto3|nascar|indycar|rally|wrc|dakar|turismo carretera|tc ?2000|top race|supercars|wec|le mans|superbike|wsbk|motocross|supercross|karting|automovilismo|automobilismo|motociclismo|gran premio|gp de)\b/],
  ["tennis", /\b(tenis|tennis|atp|wta|roland garros|wimbledon|us open|australian open|masters 1000|davis cup|copa davis|billie jean king|challenger|itf)\b/],
  ["padel", /\b(padel|premier padel|world padel tour|wpt)\b/],
  ["basketball", /\b(basquet|basquete|basket|basketball|nba|wnba|euroliga|eurocup|fiba|liga nacional de basquet|lnb|liga acb|acb)\b/],
  ["volleyball", /\b(voley|volei|voleibol|volleyball|volley|vnl)\b/],
  ["rugby", /\b(rugby|six nations|super rugby|the rugby championship|los pumas|pumas)\b/],
  ["golf", /\b(golf|pga|lpga|ryder cup|liv golf|dp world tour|masters de augusta)\b/],
  ["combat", /\b(boxeo|boxing|ufc|mma|kickboxing|muay thai|lucha libre|wwe|aew|bellator|combate)\b/],
  ["cycling", /\b(ciclismo|cycling|tour de france|giro d italia|vuelta a|mountain bike|mtb|bmx)\b/],
  ["americanfootball", /\b(nfl|futbol americano|american football|ncaa football|college football|super bowl)\b/],
  ["baseball", /\b(beisbol|baseball|mlb|serie del caribe|liga mexicana de beisbol)\b/],
  ["hockey", /\b(hockey|nhl)\b/],
  ["handball", /\b(handball|balonmano)\b/],
  ["athletics", /\b(atletismo|athletics|maraton|marathon|diamond league)\b/],
  ["swimming", /\b(natacion|swimming|waterpolo|water polo)\b/],
  ["football", /\b(futbol|futebol|football|soccer|liga|copa|libertadores|sudamericana|champions|premier league|laliga|la liga|bundesliga|serie a|ligue 1|eliminatorias|primera division|superliga|brasileirao|campeonato|mundial|fecha \d+|gol)\b/],
];
const CHANNEL_HINT = [
  ["basketball", /\bnba\b/], ["golf", /golf/], ["tennis", /tenn?is/], ["motor", /motor|racing|f1/],
  ["football", /futbol|futebol|football|soccer|\bgol\b/], ["combat", /combate|fight|ufc/],
];

// [regex, nombre canónico, deporte]
const TOURNAMENTS = [
  [/champions league|uefa champions/, "UEFA Champions League", "football"],
  [/europa league/, "UEFA Europa League", "football"], [/conference league/, "UEFA Conference League", "football"],
  [/copa libertadores|libertadores/, "Copa Libertadores", "football"], [/sudamericana/, "Copa Sudamericana", "football"],
  [/recopa/, "Recopa Sudamericana", "football"], [/premier league/, "Premier League", "football"],
  [/laliga|la liga/, "LaLiga", "football"], [/serie a/, "Serie A", "football"], [/bundesliga/, "Bundesliga", "football"],
  [/ligue 1/, "Ligue 1", "football"], [/liga profesional|torneo betano|superliga/, "Liga Profesional (ARG)", "football"],
  [/copa argentina/, "Copa Argentina", "football"], [/copa de la liga/, "Copa de la Liga (ARG)", "football"],
  [/primera nacional/, "Primera Nacional (ARG)", "football"], [/eliminatorias/, "Eliminatorias", "football"],
  [/copa america/, "Copa América", "football"], [/mundial de clubes|club world cup/, "Mundial de Clubes", "football"],
  [/copa del mundo|world cup|mundial/, "Mundial", "football"], [/brasileirao|serie a brasil/, "Brasileirao", "football"],
  [/liga mx/, "Liga MX", "football"], [/mls/, "MLS", "football"], [/concacaf/, "Concacaf", "football"],
  [/roland garros/, "Roland Garros", "tennis"], [/wimbledon/, "Wimbledon", "tennis"], [/us open/, "US Open", "tennis"],
  [/australian open/, "Australian Open", "tennis"], [/masters 1000/, "Masters 1000", "tennis"], [/davis cup|copa davis/, "Copa Davis", "tennis"],
  [/\batp\b/, "ATP", "tennis"], [/\bwta\b/, "WTA", "tennis"], [/premier padel/, "Premier Padel", "padel"],
  [/world padel tour|\bwpt\b/, "World Padel Tour", "padel"], [/\bnba\b/, "NBA", "basketball"], [/euroliga/, "Euroliga", "basketball"],
  [/liga nacional de basquet|\blnb\b/, "Liga Nacional de Básquet", "basketball"], [/\bfiba\b/, "FIBA", "basketball"],
  [/formula ?1|formula one|\bf1\b/, "Fórmula 1", "motor"], [/formula e/, "Fórmula E", "motor"], [/moto ?gp/, "MotoGP", "motor"],
  [/nascar/, "NASCAR", "motor"], [/indycar/, "IndyCar", "motor"], [/\bwrc\b|rally/, "Rally", "motor"], [/dakar/, "Dakar", "motor"],
  [/turismo carretera/, "Turismo Carretera", "motor"], [/tc ?2000/, "TC2000", "motor"],
  [/\bnfl\b/, "NFL", "americanfootball"], [/\bmlb\b/, "MLB", "baseball"], [/\bnhl\b/, "NHL", "hockey"],
  [/six nations/, "Six Nations", "rugby"], [/rugby championship/, "The Rugby Championship", "rugby"], [/super rugby/, "Super Rugby", "rugby"],
  [/\bufc\b/, "UFC", "combat"], [/\bwwe\b/, "WWE", "combat"], [/\bpga\b/, "PGA Tour", "golf"], [/ryder cup/, "Ryder Cup", "golf"],
  [/tour de france/, "Tour de Francia", "cycling"], [/\bvnl\b/, "VNL", "volleyball"],
  [/juegos olimpicos|olympic/, "Juegos Olímpicos", null],
];

export const SPORT_NAMES = {
  football: "Fútbol", tennis: "Tenis", padel: "Pádel", basketball: "Básquet", volleyball: "Vóley", motor: "Motor",
  rugby: "Rugby", golf: "Golf", combat: "Combate", cycling: "Ciclismo", americanfootball: "Fútbol americano",
  baseball: "Béisbol", hockey: "Hockey", handball: "Handball", athletics: "Atletismo", swimming: "Natación", other: "Otros",
};

export function classify(title, desc, channelName) {
  const text = n(`${title} ${desc}`);
  let p = null;
  for (const [id, re] of SPORTS) if (re.test(text)) { p = id; break; }
  if (!p) { const c = n(channelName); for (const [id, re] of CHANNEL_HINT) if (re.test(c)) { p = id; break; } }
  let r = "";
  for (const [re, name, sp] of TOURNAMENTS) {
    if (!re.test(text)) continue;
    if (sp && p && sp !== p && p !== "football") continue; // evita cruces (ej. "us open" golf vs tenis)
    r = name; if (sp && !p) p = sp; break;
  }
  return { p: p || "other", r };
}

export const SPORTS_CHANNEL_RE =
  /sport|deport|espn|tyc|tudn|premiere|combate|golf|nba|nfl|mlb|nhl|\bf1\b|motor|\bwin\b|dazn|bein|eurosport|\bgol\b|futbol|futebol|tennis|tenis|racing|stadium|fox deportes|teledeporte|sportv|\bnbc sn\b/;
export const isSportsChannel = (name) => SPORTS_CHANNEL_RE.test(n(name));
