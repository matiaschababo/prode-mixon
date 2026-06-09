// src/services/api-football.js

const API_KEY = "YOUR_API_SPORTS_KEY"; // TODO: set real key
const API_URL = "https://v3.football.api-sports.io";

export async function fetchLiveMatches() {
  try {
    const response = await fetch(`${API_URL}/fixtures?live=all`, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY
      }
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return [];
  }
}
