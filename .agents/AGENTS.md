# Project Rules and Behavioral Guidelines

## CRITICAL: Preventing Database Corruption in Live Match Scraping (`cron-live-matches.js`)

When scraping live match score updates from APIs (like ESPN) and matching them with our local database matches:

1. **Exact Team Matching:** If both teams are resolved in our database (i.e., homeTeam and awayTeam are not `"TBD"`), **always** require that both teams match the API teams.
2. **Provisional (TBD) Matches:** If one or both teams in our database match are still `"TBD"` (e.g. in later knockout stages where participants are not yet defined):
   - Never map a match simply by checking if one team matches.
   - You **must** verify that the kickoff date/time of the database match is within **12 hours** of the API match kickoff time.
   - If the date difference is greater than 12 hours, **do not match** (it is likely a future match in a later stage like Quarter-Finals or Semi-Finals featuring the same team).

3. **Database Restoration:** If the database (`global/results`) gets corrupted or overwritten due to a bad matching script run, verify the database immediately. The official results of matches already played must be preserved.
