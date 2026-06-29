fetch('https://prode-mixon.vercel.app/api/prode-state')
  .then(res => res.json())
  .then(data => {
    const results = data.results || {};
    console.log("Total results in DB:", Object.keys(results).length);
    console.log("Result keys:", Object.keys(results).slice(0, 10));
  })
  .catch(console.error);
