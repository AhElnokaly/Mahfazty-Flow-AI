import https from 'https';

const options = {
  hostname: 'api.github.com',
  path: '/repos/AhElnokaly/LifeCompanion-Work-Log/git/trees/main?recursive=1',
  headers: {
    'User-Agent': 'NodeJS'
  }
};

https.get(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const files = json.tree.filter(t => t.type === 'blob').map(t => t.path);
    console.log(files.join('\n'));
  });
});
