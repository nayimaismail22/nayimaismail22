const fs = require('fs');

async function generate() {
  const username = process.env.GITHUB_REPOSITORY.split('/')[0];
  const token = process.env.GH_TOKEN;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Node.js-Script',
    ...(token && { 'Authorization': `token ${token}` })
  };

  try {
    // 1. Fetch User Data
    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    const userData = await userRes.json();

    // 2. Fetch Repositories to Calculate Stars & Languages
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers });
    const reposData = await reposRes.json();

    let totalStars = 0;
    const langCounts = { Java: 0, JavaScript: 0, TypeScript: 0 };

    if (Array.isArray(reposData)) {
      reposData.forEach(repo => {
        totalStars += repo.stargazers_count || 0;
        if (repo.language && langCounts.hasOwnProperty(repo.language)) {
          langCounts[repo.language] += 1;
        }
      });
    }

    const totalTrackedLangs = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
    const javaPct = Math.round((langCounts.Java / totalTrackedLangs) * 100);
    const jsPct = Math.round((langCounts.JavaScript / totalTrackedLangs) * 100);
    const tsPct = Math.round((langCounts.TypeScript / totalTrackedLangs) * 100);

    // 3. Build SVG
    const svgContent = `
<svg width="780" height="320" viewBox="0 0 780 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .bg { fill: #0b0f19; rx: 16px; stroke: #1f293d; stroke-width: 2; }
    .header-title { font: bold 16px 'Segoe UI', sans-serif; fill: #58a6ff; letter-spacing: 1.5px; }
    .username { font: bold 14px 'Segoe UI', sans-serif; fill: #8b949e; }
    .label { font: 12px 'Segoe UI', sans-serif; fill: #8b949e; text-transform: uppercase; }
    .val { font: bold 22px 'Segoe UI', sans-serif; fill: #ffffff; }
    .hex { fill: #131b2e; stroke-width: 2; }
    .tech-title { font: bold 13px 'Segoe UI', sans-serif; fill: #f0f6fc; text-anchor: middle; }
    .tech-pct { font: 11px 'Segoe UI', sans-serif; fill: #8b949e; text-anchor: middle; }
  </style>

  <rect width="780" height="320" class="bg" />

  <text x="35" y="45" class="header-title">OCTO-METRICS DASHBOARD</text>
  <text x="35" y="68" class="username">@${userData.login || username}</text>
  <line x1="35" y1="85" x2="745" y2="85" stroke="#1f293d" stroke-width="1.5" />

  <g transform="translate(35, 115)">
    <text x="0" y="0" class="label">Public Repositories</text>
    <text x="0" y="26" class="val">${userData.public_repos || 0}</text>

    <text x="0" y="70" class="label">Total Stars Earned</text>
    <text x="0" y="96" class="val">⭐ ${totalStars}</text>

    <text x="0" y="140" class="label">Followers</text>
    <text x="0" y="166" class="val">${userData.followers || 0}</text>
  </g>

  <g transform="translate(520, 200)">
    <g>
      <polygon points="0,-55 48,-28 48,28 0,55 -48,28 -48,-28" class="hex" stroke="#f89820" />
      <text x="0" y="-4" class="tech-title">JAVA</text>
      <text x="0" y="14" class="tech-pct">${javaPct}%</text>
    </g>

    <g transform="translate(95, -68)">
      <polygon points="0,-45 39,-23 39,23 0,45 -39,23 -39,-23" class="hex" stroke="#f7df1e" />
      <text x="0" y="-3" class="tech-title">JS</text>
      <text x="0" y="12" class="tech-pct">${jsPct}%</text>
    </g>

    <g transform="translate(95, 68)">
      <polygon points="0,-45 39,-23 39,23 0,45 -39,23 -39,-23" class="hex" stroke="#3178c6" />
      <text x="0" y="-3" class="tech-title">TS</text>
      <text x="0" y="12" class="tech-pct">${tsPct}%</text>
    </g>
  </g>
</svg>`;

    fs.writeFileSync('./stats.svg', svgContent.trim());
    console.log('Successfully generated stats.svg!');
  } catch (err) {
    console.error('Error generating SVG:', err);
    process.exit(1);
  }
}

generate();
