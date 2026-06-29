const espnMatch = {
  "id": "760486",
  "name": "Canada at South Africa",
  "date": "2026-06-28T19:00Z",
  "status": "STATUS_FULL_TIME",
  "home": "South Africa",
  "away": "Canada"
};

const teamMap = {
  "rsa": { abbreviation: "RSA", score: 0 },
  "can": { abbreviation: "CAN", score: 1 }
};

// Simulate local match
const mHome = "rsa";
const mAway = "can";

if (teamMap[mHome] && teamMap[mAway]) {
  console.log("MATCHED PERFECTLY!");
} else {
  console.log("DID NOT MATCH");
}
