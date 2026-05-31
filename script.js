const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const cursorGlow = document.getElementById('cursorGlow');
const year = document.getElementById('year');

year.textContent = new Date().getFullYear();

navToggle.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('pointermove', (event) => {
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;

  document.querySelectorAll('.glass-card, .project-card, .skill-panel, .contact-card').forEach((card) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

document.querySelectorAll('[data-tilt]').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (window.innerWidth < 768) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 14;
    const rotateX = ((y / rect.height) - 0.5) * -14;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
  });
});

document.querySelectorAll('.skill-cloud').forEach((cloud) => {
  const skills = cloud.dataset.skills.split(',');
  cloud.innerHTML = skills.map((skill) => {
    const cleanSkill = skill.trim();
    const query = encodeURIComponent(cleanSkill);
    return `<a class="skill-pill" href="https://www.google.com/search?q=${query}" target="_blank" rel="noreferrer" aria-label="Search ${cleanSkill} on Google">${cleanSkill}</a>`;
  }).join('');
});

const GITHUB_USERNAME = 'LogeshChandran';
const githubFields = document.querySelectorAll('[data-github]');

function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return new Intl.NumberFormat('en', { notation: value >= 10000 ? 'compact' : 'standard' }).format(value);
}

function setGithubMetric(key, value) {
  const element = document.querySelector(`[data-github="${key}"]`);
  if (element) element.textContent = formatNumber(value);
}

async function fetchAllPublicRepos() {
  const repos = [];
  let page = 1;

  while (page <= 5) {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=updated`, {
      headers: { Accept: 'application/vnd.github+json' }
    });

    if (!response.ok) break;
    const data = await response.json();
    repos.push(...data);
    if (data.length < 100) break;
    page += 1;
  }

  return repos;
}

function getLastPageCountFromLinkHeader(linkHeader) {
  if (!linkHeader) return 0;
  const match = linkHeader.match(/[?&]page=(\d+)>; rel="last"/);
  return match ? Number(match[1]) : 1;
}

async function fetchStarredRepoCount() {
  const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/starred?per_page=1`, {
    headers: { Accept: 'application/vnd.github+json' }
  });

  if (!response.ok) return 0;
  const linkHeader = response.headers.get('Link');
  if (!linkHeader) {
    const data = await response.json();
    return Array.isArray(data) ? data.length : 0;
  }

  return getLastPageCountFromLinkHeader(linkHeader);
}

async function loadGithubMetrics() {
  try {
    const [userResponse, repos, starredCount] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, { headers: { Accept: 'application/vnd.github+json' } }),
      fetchAllPublicRepos(),
      fetchStarredRepoCount()
    ]);

    if (!userResponse.ok) throw new Error('GitHub user request failed');
    const user = await userResponse.json();

    const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const totalWatchers = repos.reduce((sum, repo) => sum + (repo.subscribers_count || 0), 0);

    setGithubMetric('public_repos', user.public_repos || repos.length);
    setGithubMetric('followers', user.followers || 0);
    setGithubMetric('following', user.following || 0);
    setGithubMetric('total_stars', totalStars);
    setGithubMetric('total_watchers', totalWatchers);
    setGithubMetric('starred_count', starredCount);
  } catch (error) {
    githubFields.forEach((field) => { field.textContent = 'Live'; });
    console.warn('Unable to load GitHub metrics:', error);
  }
}

loadGithubMetrics();

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav a')];

window.addEventListener('scroll', () => {
  const current = sections.findLast((section) => window.scrollY + 160 >= section.offsetTop);
  navLinks.forEach((link) => link.classList.toggle('active', current && link.getAttribute('href') === `#${current.id}`));
});

const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');
const symbols = ['AI', 'RAG', 'LLM', 'ML', 'GCP', 'SQL', 'MCP', 'GPU', 'K8S'];
let drops = [];

function resizeCanvas() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  const columns = Math.floor(window.innerWidth / 90);
  drops = Array.from({ length: columns }, () => Math.random() * window.innerHeight);
}

function drawMatrix() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.font = '600 13px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';

  drops.forEach((y, index) => {
    const text = symbols[Math.floor(Math.random() * symbols.length)];
    const x = index * 90 + 18;
    ctx.fillText(text, x, y);
    drops[index] = y > window.innerHeight + 80 ? -20 : y + 0.7 + Math.random() * 0.8;
  });

  requestAnimationFrame(drawMatrix);
}

resizeCanvas();
drawMatrix();
window.addEventListener('resize', resizeCanvas);
