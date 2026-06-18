const https = require('https');

https.get('https://api.github.com/search/code?q=tooth+extension:stl', {
  headers: { 'User-Agent': 'Node.js', 'Accept': 'application/vnd.github.v3+json' }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    if(json.items && json.items.length > 0) {
      json.items.forEach(item => {
        console.log(`https://raw.githubusercontent.com/${item.repository.full_name}/master/${item.path}`);
      });
    } else {
      console.log(json);
    }
  });
});
