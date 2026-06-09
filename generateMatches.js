import fs from 'fs';

const groups = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"]
};

const venues = ["Mexico City", "New York/New Jersey", "Los Angeles", "Dallas", "Miami", "Atlanta"];
let matchId = 1;
const matches = [];

// Base date: June 11, 2026 15:00 ARG time (18:00 UTC)
let currentDate = new Date('2026-06-11T18:00:00Z');

// Group Stage (72 matches)
Object.entries(groups).forEach(([group, teams]) => {
  // Round 1
  matches.push(createMatch(teams[0], teams[1], `Grupo ${group}`, "Group Stage"));
  matches.push(createMatch(teams[2], teams[3], `Grupo ${group}`, "Group Stage"));
  // Round 2
  matches.push(createMatch(teams[0], teams[2], `Grupo ${group}`, "Group Stage"));
  matches.push(createMatch(teams[1], teams[3], `Grupo ${group}`, "Group Stage"));
  // Round 3
  matches.push(createMatch(teams[3], teams[0], `Grupo ${group}`, "Group Stage"));
  matches.push(createMatch(teams[1], teams[2], `Grupo ${group}`, "Group Stage"));
});

// Knockouts (32 matches)
// Round of 32
for (let i = 0; i < 16; i++) matches.push(createMatch("TBD", "TBD", "Round of 32", "Round of 32"));
// Round of 16
for (let i = 0; i < 8; i++) matches.push(createMatch("TBD", "TBD", "Round of 16", "Round of 16"));
// Quarterfinals
for (let i = 0; i < 4; i++) matches.push(createMatch("TBD", "TBD", "Cuartos de final", "Quarterfinals"));
// Semifinals
for (let i = 0; i < 2; i++) matches.push(createMatch("TBD", "TBD", "Semifinal", "Semifinals"));
// Third Place
matches.push(createMatch("TBD", "TBD", "Tercer Puesto", "Third Place"));
// Final
matches.push(createMatch("TBD", "TBD", "Final", "Final"));

function createMatch(home, away, round, stage) {
  const m = {
    id: matchId++,
    homeTeam: home,
    awayTeam: away,
    date: currentDate.toISOString(),
    round,
    stage,
    venue: venues[matchId % venues.length],
    status: "scheduled",
    homeScore: null,
    awayScore: null
  };
  // Increment date by 4 hours for next match
  currentDate.setHours(currentDate.getHours() + 4);
  return m;
}

const content = `// Auto-generated matches data
export const matches = ${JSON.stringify(matches, null, 2)};
`;

fs.writeFileSync('./src/data/matches.js', content);
console.log('matches.js generated successfully.');
