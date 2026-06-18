const https = require('https');

https.get('https://en.wikipedia.org/w/api.php?action=query&list=allimages&aimimedir=asc&aiprop=url&aiext=stl&ailimit=50&format=json', {
  headers: { 'User-Agent': 'CoolBot/1.0' }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});
