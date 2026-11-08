const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false });

    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório' });

        const CLIENT_ID = 'zpk_541f4b2f71855fb26e1201a7';
        const CLIENT_SECRET = 'zsk_87b13fb23ba5eed5d6d9f0f9e6153d20dfeac10e24a66dd6';
        const BASE_URL = 'https://zpayapi.app/api/v2';

        const response = await axios.get(`${BASE_URL}/payments/${id}`, {
            headers: {
                'client-id': CLIENT_ID,
                'client-secret': CLIENT_SECRET
            }
        });

        const status = response.data.status;
        const isPaid = ['paid', 'approved', 'completed'].includes(String(status).toLowerCase());

        return res.status(200).json({ success: true, isPaid, status });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Erro ao consultar' });
    }
};