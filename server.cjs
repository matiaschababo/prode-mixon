const http = require('http');
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const users = JSON.parse(body);
        const facundos = users.filter(u => u.name && u.name.toLowerCase().includes('facundo'));
        console.log('FACUNDOS FOUND:', JSON.stringify(facundos, null, 2));
      } catch (e) {
        console.error(e);
      }
      res.end('ok');
      process.exit(0);
    });
  } else {
    res.end('ok');
  }
});
server.listen(8080, () => console.log('Listening on 8080'));
