const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false });

    try {
        const { valor, nome_cliente } = req.body;
        const CLIENT_ID = 'zpk_541f4b2f71855fb26e1201a7';
        const CLIENT_SECRET = 'zsk_87b13fb23ba5eed5d6d9f0f9e6153d20dfeac10e24a66dd6';
        const BASE_URL = 'https://zpayapi.app/api/v2';

        const response = await axios.post(`${BASE_URL}/payments`, {
            amount: parseFloat(valor),
            payerName: nome_cliente || 'Cliente',
            description: 'ArenaLives'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'client-id': CLIENT_ID,
                'client-secret': CLIENT_SECRET
            }
        });

        const data = response.data;
        return res.status(200).json({
            success: true,
            paymentId: data.paymentId || data.id,
            pixCode: data.copyPaste,
            qrCode: data.qrCodeBase64 || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.copyPaste)}`
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: 'Erro ZPay: ' + (error.response?.data?.message || error.message)
        });
    }
};
