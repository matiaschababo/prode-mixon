// src/data/bracket.js
// Official FIFA World Cup 2026 knockout bracket structure

export const bracketData = {
  roundOf32: [
    // LEFT SIDE (Side A)
    { matchId: 73, home: '2° Grupo A', away: '2° Grupo B', feedsTo: 'R16-2', side: 'A' },
    { matchId: 74, home: '1° Grupo E', away: '3° Grupo A/B/C/D/F', feedsTo: 'R16-1', side: 'A' },
    { matchId: 75, home: '1° Grupo F', away: '2° Grupo C', feedsTo: 'R16-2', side: 'A' },
    { matchId: 76, home: '1° Grupo C', away: '2° Grupo F', feedsTo: 'R16-3', side: 'B' },
    { matchId: 77, home: '1° Grupo I', away: '3° Grupo C/D/F/G/H', feedsTo: 'R16-1', side: 'A' },
    { matchId: 78, home: '2° Grupo E', away: '2° Grupo I', feedsTo: 'R16-3', side: 'B' },
    { matchId: 79, home: '1° Grupo A', away: '3° Grupo C/E/F/H/I', feedsTo: 'R16-4', side: 'B' },
    { matchId: 80, home: '1° Grupo L', away: '3° Grupo E/H/I/J/K', feedsTo: 'R16-4', side: 'B' },
    { matchId: 81, home: '1° Grupo D', away: '3° Grupo B/E/F/I/J', feedsTo: 'R16-6', side: 'A' },
    { matchId: 82, home: '1° Grupo G', away: '3° Grupo A/E/H/I/J', feedsTo: 'R16-6', side: 'A' },
    { matchId: 83, home: '2° Grupo K', away: '2° Grupo L', feedsTo: 'R16-5', side: 'A' },
    { matchId: 84, home: '1° Grupo H', away: '2° Grupo J', feedsTo: 'R16-5', side: 'A' },
    { matchId: 85, home: '1° Grupo B', away: '3° Grupo E/F/G/I/J', feedsTo: 'R16-8', side: 'B' },
    { matchId: 86, home: '1° Grupo J', away: '2° Grupo H', feedsTo: 'R16-7', side: 'B' },
    { matchId: 87, home: '1° Grupo K', away: '3° Grupo D/E/I/J/L', feedsTo: 'R16-8', side: 'B' },
    { matchId: 88, home: '2° Grupo D', away: '2° Grupo G', feedsTo: 'R16-7', side: 'B' },
  ],
  roundOf16: [
    { matchId: 89, home: 'G. M74', away: 'G. M77', label: 'R16-1', feedsTo: 'QF-1', side: 'A' },
    { matchId: 90, home: 'G. M73', away: 'G. M75', label: 'R16-2', feedsTo: 'QF-1', side: 'A' },
    { matchId: 91, home: 'G. M76', away: 'G. M78', label: 'R16-3', feedsTo: 'QF-3', side: 'B' },
    { matchId: 92, home: 'G. M79', away: 'G. M80', label: 'R16-4', feedsTo: 'QF-3', side: 'B' },
    { matchId: 93, home: 'G. M83', away: 'G. M84', label: 'R16-5', feedsTo: 'QF-2', side: 'A' },
    { matchId: 94, home: 'G. M81', away: 'G. M82', label: 'R16-6', feedsTo: 'QF-2', side: 'A' },
    { matchId: 95, home: 'G. M86', away: 'G. M88', label: 'R16-7', feedsTo: 'QF-4', side: 'B' },
    { matchId: 96, home: 'G. M85', away: 'G. M87', label: 'R16-8', feedsTo: 'QF-4', side: 'B' },
  ],
  quarterFinals: [
    { matchId: 97, home: 'G. M89', away: 'G. M90', label: 'QF-1', feedsTo: 'SF-1', side: 'A' },
    { matchId: 98, home: 'G. M93', away: 'G. M94', label: 'QF-2', feedsTo: 'SF-1', side: 'A' },
    { matchId: 99, home: 'G. M91', away: 'G. M92', label: 'QF-3', feedsTo: 'SF-2', side: 'B' },
    { matchId: 100, home: 'G. M95', away: 'G. M96', label: 'QF-4', feedsTo: 'SF-2', side: 'B' },
  ],
  semiFinals: [
    { matchId: 101, home: 'G. M97', away: 'G. M98', label: 'SF-1', side: 'A' },
    { matchId: 102, home: 'G. M99', away: 'G. M100', label: 'SF-2', side: 'B' },
  ],
  thirdPlace: { matchId: 103, home: 'P. SF1', away: 'P. SF2' },
  final: { matchId: 104, home: 'G. SF1', away: 'G. SF2' },
};

// Groups for the mini-tables
export const groupsList = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'
];
