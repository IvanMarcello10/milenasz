const DEFAULT_CONTENT = {
  site_ativo: true,
  mensagem_manutencao: 'Estamos atualizando o site. Voltamos em alguns minutos!',
  profile: {
    name: 'Milena', username: '@Mileninhasz',
    bio: 'A ruiva mais gostosa...', location: 'São Paulo - SP',
    avatarLetter: 'A', avatarUrl: '', bannerUrl: ''
  },
  offer: {
    title: 'Oferta de assinatura', description: '...',
    buttonText: 'Assinar agora', price: 19.95,
    originalPrice: 21.00, discountBadge: 'Economize 5%'
  },
  plans: [
    { id: '1m', label: '1 mês', price: 19.95, badge: 'Economize 5%', highlight: true },
    { id: '3m', label: '3 meses (50% off)', price: 31.50, badge: '', highlight: false },
    { id: '6m', label: '6 meses (50% off)', price: 63.00, badge: '', highlight: false }
  ],
  video: { url: 'https://privacyhaellen.netlify.app/media/V%C3%ADdeo%201%20(1).mp4' },
  stats: { images: 434, videos: 765, likes: '4.6K' }
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const FILE = 'config.json';
const BRANCH = 'main';

async function lerConfig() {
  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}/${FILE}?t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) return DEFAULT_CONTENT;
    const data = await res.json();
    return { ...DEFAULT_CONTENT, ...data };
  } catch {
    return DEFAULT_CONTENT;
  }
}

async function salvarConfig(content) {
  // 1. Pega SHA atual
  const getRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE}?ref=${BRANCH}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
  );
  let sha;
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  }

  // 2. Commit
  const putRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'update config via admin',
        content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
        sha,
        branch: BRANCH
      })
    }
  );

  if (!putRes.ok) {
    const err = await putRes.json();
    throw new Error(err.message || 'Falha ao commitar');
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const content = await lerConfig();
    return res.status(200).json({ success: true, content });
  }

  if (req.method === 'POST') {
    // Valida Basic Auth
    const auth = (req.headers.authorization || '').replace('Basic ', '');
    let user = '', pass = '';
    try {
      const decoded = Buffer.from(auth, 'base64').toString();
      [user, pass] = decoded.split(':');
    } catch {}

    const ADMIN_USER = process.env.ADMIN_USER || 'ivan';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ivan1912';

    if (user !== ADMIN_USER || pass !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    try {
      const { content } = req.body;
      if (!content) return res.status(400).json({ success: false, error: 'Conteúdo vazio' });
      await salvarConfig(content);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ success: false });
};
