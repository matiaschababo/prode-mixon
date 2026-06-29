const matchDate = "2026-06-28T19:00:00Z";
const dateObj = new Date(matchDate);
const isPast = new Date() >= dateObj;
console.log("Match date:", dateObj);
console.log("Current date:", new Date());
console.log("isPast:", isPast);
