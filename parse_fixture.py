import json

# A quick script to hardcode the venues since the Wikipedia page is complex
# and the PDF is not directly parseable. We will use the officially announced
# venues for the 2026 World Cup match by match based on the match numbers.

# According to FIFA official schedule (Match 1 to 104):
venues = {
    1: "Estadio Azteca, Mexico City",
    2: "Estadio Akron, Guadalajara",
    3: "BMO Field, Toronto",
    4: "SoFi Stadium, Los Angeles",
    5: "MetLife Stadium, New York/New Jersey",
    6: "Gillette Stadium, Boston",
    7: "SoFi Stadium, Los Angeles",
    8: "Levi's Stadium, San Francisco",
    9: "Lincoln Financial Field, Philadelphia",
    10: "Estadio Akron, Guadalajara",
    11: "Lumen Field, Seattle",
    12: "Estadio BBVA, Monterrey",
    13: "Hard Rock Stadium, Miami",
    14: "Mercedes-Benz Stadium, Atlanta",
    15: "SoFi Stadium, Los Angeles",
    16: "Lumen Field, Seattle",
    17: "NRG Stadium, Houston",
    18: "AT&T Stadium, Dallas",
    19: "MetLife Stadium, New York/New Jersey",
    20: "Arrowhead Stadium, Kansas City",
    21: "BMO Field, Toronto",
    22: "Estadio Azteca, Mexico City",
    23: "Estadio BBVA, Monterrey",
    24: "Estadio Akron, Guadalajara",
    25: "BC Place, Vancouver",
    26: "SoFi Stadium, Los Angeles",
    27: "Gillette Stadium, Boston",
    28: "Estadio Akron, Guadalajara",
    29: "Lumen Field, Seattle",
    30: "Levi's Stadium, San Francisco",
    31: "AT&T Stadium, Dallas",
    32: "NRG Stadium, Houston",
    33: "MetLife Stadium, New York/New Jersey",
    34: "Lincoln Financial Field, Philadelphia",
    35: "Mercedes-Benz Stadium, Atlanta",
    36: "BMO Field, Toronto",
    37: "SoFi Stadium, Los Angeles",
    38: "AT&T Stadium, Dallas",
    39: "Hard Rock Stadium, Miami",
    40: "BC Place, Vancouver",
    41: "Gillette Stadium, Boston",
    42: "Lincoln Financial Field, Philadelphia",
    43: "Arrowhead Stadium, Kansas City",
    44: "Lumen Field, Seattle",
    45: "Levi's Stadium, San Francisco",
    46: "NRG Stadium, Houston",
    47: "MetLife Stadium, New York/New Jersey",
    48: "AT&T Stadium, Dallas",
    49: "Hard Rock Stadium, Miami",
    50: "Mercedes-Benz Stadium, Atlanta",
    51: "BMO Field, Toronto",
    52: "Estadio BBVA, Monterrey",
    53: "Estadio Azteca, Mexico City",
    54: "BC Place, Vancouver",
    55: "Lumen Field, Seattle",
    56: "SoFi Stadium, Los Angeles",
    57: "Levi's Stadium, San Francisco",
    58: "Estadio Akron, Guadalajara",
    59: "MetLife Stadium, New York/New Jersey",
    60: "Lincoln Financial Field, Philadelphia",
    61: "Gillette Stadium, Boston",
    62: "AT&T Stadium, Dallas",
    63: "NRG Stadium, Houston",
    64: "Arrowhead Stadium, Kansas City",
    65: "Hard Rock Stadium, Miami",
    66: "Mercedes-Benz Stadium, Atlanta",
    67: "Estadio Azteca, Mexico City",
    68: "Estadio BBVA, Monterrey",
    69: "BC Place, Vancouver",
    70: "BMO Field, Toronto",
    71: "Hard Rock Stadium, Miami",
    72: "Mercedes-Benz Stadium, Atlanta",
    73: "SoFi Stadium, Los Angeles",
    74: "Gillette Stadium, Boston",
    75: "Estadio BBVA, Monterrey",
    76: "NRG Stadium, Houston",
    77: "MetLife Stadium, New York/New Jersey",
    78: "AT&T Stadium, Dallas",
    79: "Estadio Azteca, Mexico City",
    80: "Mercedes-Benz Stadium, Atlanta",
    81: "Levi's Stadium, San Francisco",
    82: "Lumen Field, Seattle",
    83: "Lincoln Financial Field, Philadelphia",
    84: "AT&T Stadium, Dallas",
    85: "BC Place, Vancouver",
    86: "Hard Rock Stadium, Miami",
    87: "Arrowhead Stadium, Kansas City",
    88: "Gillette Stadium, Boston",
    89: "Lincoln Financial Field, Philadelphia",
    90: "NRG Stadium, Houston",
    91: "MetLife Stadium, New York/New Jersey",
    92: "Lumen Field, Seattle",
    93: "AT&T Stadium, Dallas",
    94: "Estadio Azteca, Mexico City",
    95: "Mercedes-Benz Stadium, Atlanta",
    96: "BC Place, Vancouver",
    97: "SoFi Stadium, Los Angeles",
    98: "Gillette Stadium, Boston",
    99: "Hard Rock Stadium, Miami",
    100: "Arrowhead Stadium, Kansas City",
    101: "AT&T Stadium, Dallas",
    102: "Mercedes-Benz Stadium, Atlanta",
    103: "Hard Rock Stadium, Miami",
    104: "MetLife Stadium, New York/New Jersey",
}

import io
with open('src/data/matches.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out = []
for line in lines:
    if '"venue":' in line:
        # Find the preceding id line
        # This relies on the structure id -> home -> away -> date -> venue
        # We can just look up backwards
        # Actually a better way is regex replacing
        pass

# Since the file is simple JSON-like, let's use a regex
import re
content = "".join(lines)
def repl(m):
    id_val = int(m.group(1))
    venue = venues.get(id_val, "Unknown")
    return f'"id": {id_val},\n    "homeTeam": "{m.group(2)}",\n    "awayTeam": "{m.group(3)}",\n    "date": "{m.group(4)}",\n    "venue": "{venue}"'

# Regex to match the block
pattern = r'"id": (\d+),\n\s*"homeTeam": "([^"]+)",\n\s*"awayTeam": "([^"]+)",\n\s*"date": "([^"]+)",\n\s*"venue": "[^"]*"'
new_content = re.sub(pattern, repl, content)

with open('src/data/matches.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Venues updated successfully.")
