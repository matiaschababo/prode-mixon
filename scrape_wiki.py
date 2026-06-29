import urllib.request
from bs4 import BeautifulSoup
import re
import json

url = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read()
except Exception as e:
    print(e)
    exit(1)

soup = BeautifulSoup(html, "html.parser")
tables = soup.find_all("table", class_="wikitable")
match_venues = {}

for table in tables:
    rows = table.find_all("tr")
    if not rows: continue
    headers = [th.text.strip().lower() for th in rows[0].find_all("th")]
    
    if "match" in headers and ("venue" in headers or "stadium" in headers):
        match_idx = headers.index("match")
        venue_idx = headers.index("venue") if "venue" in headers else headers.index("stadium")
        
        for row in rows[1:]:
            cols = row.find_all(["td", "th"])
            if len(cols) > max(match_idx, venue_idx):
                match_num = cols[match_idx].text.strip()
                venue = cols[venue_idx].text.strip()
                
                nums = re.findall(r'\b\d+\b', match_num)
                if nums:
                    for num in nums:
                        match_venues[int(num)] = venue

print(f"Found {len(match_venues)} match venues.")
if len(match_venues) > 0:
    with open("wiki_venues.json", "w") as f:
        json.dump(match_venues, f, indent=2)

