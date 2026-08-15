const https = require('https');

https.get('https://api.github.com/search/code?q=tooth+extension:glb', {
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const item = json.items && json.items[1];
    if (item) {
        console.log(`https://raw.githubusercontent.com/${item.repository.full_name}/master/${item.path}`);
    } else {
        console.log('No results found.');
        console.log(json);
    }
  });
});
