import json
from datetime import datetime, timedelta

# Fechas de Fase de Grupos
# J1: Jun 11 - Jun 17
# J2: Jun 18 - Jun 23
# J3: Jun 24 - Jun 27
# Ro32: Jun 28 - Jul 3
# Ro16: Jul 4 - Jul 7
# QF: Jul 9 - Jul 11
# SF: Jul 14 - Jul 15
# 3rd: Jul 18
# Final: Jul 19

groups = {
  "A": ["MEX", "RSA", "KOR", "CZE"],
  "B": ["CAN", "BIH", "QAT", "SUI"],
  "C": ["BRA", "MAR", "HAI", "SCO"],
  "D": ["USA", "PAR", "AUS", "TUR"],
  "E": ["GER", "CUW", "CIV", "ECU"],
  "F": ["NED", "JPN", "SWE", "TUN"],
  "G": ["BEL", "EGY", "IRN", "NZL"],
  "H": ["ESP", "CPV", "KSA", "URU"],
  "I": ["FRA", "SEN", "IRQ", "NOR"],
  "J": ["ARG", "ALG", "AUT", "JOR"],
  "K": ["POR", "COD", "UZB", "COL"],
  "L": ["ENG", "CRO", "GHA", "PAN"]
}

venues = [
    "Estadio Azteca, Mexico City", "Estadio Akron, Guadalajara", "BMO Field, Toronto",
    "SoFi Stadium, Los Angeles", "Levi's Stadium, San Francisco", "MetLife Stadium, New York/New Jersey",
    "Gillette Stadium, Boston", "BC Place, Vancouver", "NRG Stadium, Houston",
    "Lumen Field, Seattle", "Lincoln Financial Field, Philadelphia", "Mercedes-Benz Stadium, Atlanta",
    "Hard Rock Stadium, Miami", "AT&T Stadium, Dallas", "Arrowhead Stadium, Kansas City", "Estadio BBVA, Monterrey"
]

match_dates = {
    # Matchday 1
    "A1": ("2026-06-11T19:00:00Z", venues[0]), "A2": ("2026-06-11T23:00:00Z", venues[1]),
    "B1": ("2026-06-12T19:00:00Z", venues[2]), "B2": ("2026-06-12T23:00:00Z", venues[3]),
    "C1": ("2026-06-13T19:00:00Z", venues[5]), "C2": ("2026-06-13T23:00:00Z", venues[6]),
    "D1": ("2026-06-14T19:00:00Z", venues[3]), "D2": ("2026-06-14T23:00:00Z", venues[4]),
    "E1": ("2026-06-15T19:00:00Z", venues[5]), "E2": ("2026-06-15T23:00:00Z", venues[10]),
    "F1": ("2026-06-15T16:00:00Z", venues[11]), "F2": ("2026-06-15T20:00:00Z", venues[12]),
    "G1": ("2026-06-16T19:00:00Z", venues[13]), "G2": ("2026-06-16T23:00:00Z", venues[8]),
    "H1": ("2026-06-16T16:00:00Z", venues[12]), "H2": ("2026-06-16T20:00:00Z", venues[11]),
    "I1": ("2026-06-17T19:00:00Z", venues[5]), "I2": ("2026-06-17T23:00:00Z", venues[6]),
    "J1": ("2026-06-17T16:00:00Z", venues[11]), "J2": ("2026-06-17T20:00:00Z", venues[12]),
    "K1": ("2026-06-18T19:00:00Z", venues[13]), "K2": ("2026-06-18T23:00:00Z", venues[8]),
    "L1": ("2026-06-18T16:00:00Z", venues[12]), "L2": ("2026-06-18T20:00:00Z", venues[11]),
    
    # Matchday 2
    "A3": ("2026-06-18T19:00:00Z", venues[0]), "A4": ("2026-06-19T23:00:00Z", venues[1]),
    "B3": ("2026-06-19T19:00:00Z", venues[2]), "B4": ("2026-06-19T23:00:00Z", venues[7]),
    "C3": ("2026-06-20T19:00:00Z", venues[5]), "C4": ("2026-06-20T23:00:00Z", venues[6]),
    "D3": ("2026-06-20T16:00:00Z", venues[10]), "D4": ("2026-06-21T20:00:00Z", venues[11]),
    "E3": ("2026-06-21T19:00:00Z", venues[13]), "E4": ("2026-06-21T23:00:00Z", venues[8]),
    "F3": ("2026-06-22T19:00:00Z", venues[5]), "F4": ("2026-06-22T23:00:00Z", venues[10]),
    "G3": ("2026-06-22T16:00:00Z", venues[11]), "G4": ("2026-06-22T20:00:00Z", venues[12]),
    "H3": ("2026-06-23T19:00:00Z", venues[13]), "H4": ("2026-06-23T23:00:00Z", venues[8]),
    "I3": ("2026-06-23T16:00:00Z", venues[12]), "I4": ("2026-06-24T20:00:00Z", venues[11]),
    "J3": ("2026-06-24T19:00:00Z", venues[5]), "J4": ("2026-06-24T23:00:00Z", venues[6]),
    "K3": ("2026-06-25T19:00:00Z", venues[3]), "K4": ("2026-06-25T23:00:00Z", venues[4]),
    "L3": ("2026-06-25T16:00:00Z", venues[11]), "L4": ("2026-06-25T20:00:00Z", venues[12]),

    # Matchday 3
    "A5": ("2026-06-24T19:00:00Z", venues[0]), "A6": ("2026-06-24T19:00:00Z", venues[1]),
    "B5": ("2026-06-25T19:00:00Z", venues[2]), "B6": ("2026-06-25T19:00:00Z", venues[7]),
    "C5": ("2026-06-26T16:00:00Z", venues[5]), "C6": ("2026-06-26T16:00:00Z", venues[6]),
    "D5": ("2026-06-26T19:00:00Z", venues[3]), "D6": ("2026-06-26T19:00:00Z", venues[4]),
    "E5": ("2026-06-26T22:00:00Z", venues[13]), "E6": ("2026-06-26T22:00:00Z", venues[8]),
    "F5": ("2026-06-27T16:00:00Z", venues[11]), "F6": ("2026-06-27T16:00:00Z", venues[12]),
    "G5": ("2026-06-27T19:00:00Z", venues[5]), "G6": ("2026-06-27T19:00:00Z", venues[10]),
    "H5": ("2026-06-27T22:00:00Z", venues[13]), "H6": ("2026-06-27T22:00:00Z", venues[8]),
    "I5": ("2026-06-28T16:00:00Z", venues[11]), "I6": ("2026-06-28T16:00:00Z", venues[12]),
    "J5": ("2026-06-28T19:00:00Z", venues[5]), "J6": ("2026-06-28T19:00:00Z", venues[6]),
    "K5": ("2026-06-28T22:00:00Z", venues[3]), "K6": ("2026-06-28T22:00:00Z", venues[4]),
    "L5": ("2026-06-29T19:00:00Z", venues[13]), "L6": ("2026-06-29T19:00:00Z", venues[8]),
}

knockouts = {
    # Round of 32
    73: ("2026-06-28T19:00:00Z", "Los Angeles"), 74: ("2026-06-29T20:00:00Z", "Boston"),
    75: ("2026-06-29T23:00:00Z", "Monterrey"), 76: ("2026-06-30T17:00:00Z", "Houston"),
    77: ("2026-06-30T20:00:00Z", "New York/New Jersey"), 78: ("2026-06-30T23:00:00Z", "Dallas"),
    79: ("2026-07-01T17:00:00Z", "Miami"), 80: ("2026-07-01T20:00:00Z", "Atlanta"),
    81: ("2026-07-01T23:00:00Z", "San Francisco"), 82: ("2026-07-02T17:00:00Z", "Seattle"),
    83: ("2026-07-02T20:00:00Z", "Toronto"), 84: ("2026-07-02T23:00:00Z", "Los Angeles"),
    85: ("2026-07-03T17:00:00Z", "Philadelphia"), 86: ("2026-07-03T20:00:00Z", "Kansas City"),
    87: ("2026-07-03T23:00:00Z", "Miami"), 88: ("2026-07-03T23:00:00Z", "Dallas"),

    # Round of 16
    89: ("2026-07-04T19:00:00Z", "Philadelphia"), 90: ("2026-07-04T23:00:00Z", "Houston"),
    91: ("2026-07-05T19:00:00Z", "New York/New Jersey"), 92: ("2026-07-05T23:00:00Z", "Mexico City"),
    93: ("2026-07-06T19:00:00Z", "Dallas"), 94: ("2026-07-06T23:00:00Z", "Seattle"),
    95: ("2026-07-07T19:00:00Z", "Atlanta"), 96: ("2026-07-07T23:00:00Z", "Vancouver"),

    # Quarterfinals
    97: ("2026-07-09T20:00:00Z", "Boston"), 98: ("2026-07-10T20:00:00Z", "Los Angeles"),
    99: ("2026-07-11T17:00:00Z", "Miami"), 100: ("2026-07-11T20:00:00Z", "Kansas City"),

    # Semifinals
    101: ("2026-07-14T20:00:00Z", "Dallas"), 102: ("2026-07-15T20:00:00Z", "Atlanta"),

    # 3rd Place
    103: ("2026-07-18T20:00:00Z", "Miami"),

    # Final
    104: ("2026-07-19T20:00:00Z", "New York/New Jersey")
}

matches = []
match_id = 1

# Group Stage matches
for group, teams in groups.items():
    matches.append({"id": match_id, "homeTeam": teams[0], "awayTeam": teams[1], "date": match_dates[f"{group}1"][0], "venue": match_dates[f"{group}1"][1], "round": f"Grupo {group}", "stage": "Group Stage", "status": "scheduled", "homeScore": None, "awayScore": None}); match_id += 1
    matches.append({"id": match_id, "homeTeam": teams[2], "awayTeam": teams[3], "date": match_dates[f"{group}2"][0], "venue": match_dates[f"{group}2"][1], "round": f"Grupo {group}", "stage": "Group Stage", "status": "scheduled", "homeScore": None, "awayScore": None}); match_id += 1
    matches.append({"id": match_id, "homeTeam": teams[0], "awayTeam": teams[2], "date": match_dates[f"{group}3"][0], "venue": match_dates[f"{group}3"][1], "round": f"Grupo {group}", "stage": "Group Stage", "status": "scheduled", "homeScore": None, "awayScore": None}); match_id += 1
    matches.append({"id": match_id, "homeTeam": teams[1], "awayTeam": teams[3], "date": match_dates[f"{group}4"][0], "venue": match_dates[f"{group}4"][1], "round": f"Grupo {group}", "stage": "Group Stage", "status": "scheduled", "homeScore": None, "awayScore": None}); match_id += 1
    matches.append({"id": match_id, "homeTeam": teams[3], "awayTeam": teams[0], "date": match_dates[f"{group}5"][0], "venue": match_dates[f"{group}5"][1], "round": f"Grupo {group}", "stage": "Group Stage", "status": "scheduled", "homeScore": None, "awayScore": None}); match_id += 1
    matches.append({"id": match_id, "homeTeam": teams[1], "awayTeam": teams[2], "date": match_dates[f"{group}6"][0], "venue": match_dates[f"{group}6"][1], "round": f"Grupo {group}", "stage": "Group Stage", "status": "scheduled", "homeScore": None, "awayScore": None}); match_id += 1

matches = sorted(matches, key=lambda x: x["date"])
for i, m in enumerate(matches):
    m["id"] = i + 1

# Knockout Matches
for matchId in range(73, 105):
    stage = "Round of 32"
    if matchId > 88: stage = "Round of 16"
    if matchId > 96: stage = "Quarterfinals"
    if matchId > 100: stage = "Semifinals"
    if matchId == 103: stage = "Third Place"
    if matchId == 104: stage = "Final"
    
    date, venue = knockouts[matchId]
    matches.append({"id": matchId, "homeTeam": "TBD", "awayTeam": "TBD", "date": date, "venue": venue, "round": stage, "stage": stage, "status": "scheduled", "homeScore": None, "awayScore": None})

out = "// Auto-generated matches data con fechas reales 2026\nexport const matches = " + json.dumps(matches, indent=2) + ";\n"
with open("src/data/matches.js", "w") as f:
    f.write(out)
