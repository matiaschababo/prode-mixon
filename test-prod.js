fetch('https://prode-mixon.vercel.app/api/prode-state')
  .then(res => res.json())
  .then(data => {
    const results = data.results || {};
    // Group A matches: 1, 2, 13, 14, 25, 26
    const groupA = [1, 2, 13, 14, 25, 26];
    const groupB = [3, 4, 15, 16, 27, 28];
    
    let aDone = true;
    groupA.forEach(id => {
      if (!results[id] || results[id].home === undefined) {
        console.log("Missing Group A Match:", id);
        aDone = false;
      }
    });
    console.log("Group A finished?", aDone);

    let bDone = true;
    groupB.forEach(id => {
      if (!results[id] || results[id].home === undefined) {
        console.log("Missing Group B Match:", id);
        bDone = false;
      }
    });
    console.log("Group B finished?", bDone);
    
    // Check match 73
    console.log("Match 73 result:", results[73]);
  })
  .catch(console.error);
