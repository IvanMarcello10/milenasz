module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { user, password } = req.body || {};
  const ADMIN_USER = process.env.ADMIN_USER || 'ivan';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ivan1912';

  if (user === ADMIN_USER && password === ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'Usuário ou senha inválidos' });
};
