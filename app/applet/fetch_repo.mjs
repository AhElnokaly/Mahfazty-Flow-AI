import { execSync } from 'child_process';
import fetch from 'node-fetch';

async function main() {
  const repo = 'AhElnokaly/LifeCompanion-Work-Log';
  const repoUrl = `https://api.github.com/repos/${repo}/git/trees/main?recursive=1`;
  const res = await fetch(repoUrl);
  const data = await res.json();
  const tree = data.tree;
  if (!tree) {
    console.log("No tree found", data);
    return;
  }
  
  const files = tree.filter(t => t.type === 'blob').map(t => t.path);
  console.log("FILES:\n" + files.join('\n'));
}
main();
