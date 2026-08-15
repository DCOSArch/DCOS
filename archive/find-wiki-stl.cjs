const https = require('https');

https.get('https://en.wikipedia.org/w/api.php?action=query&list=allimages&aimimedir=asc&aimimetype=model/stl&ailimit=50&format=json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
});
