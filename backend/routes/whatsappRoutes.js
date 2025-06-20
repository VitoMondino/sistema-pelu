const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Ruta para obtener el estado del cliente de WhatsApp (y el QR si es necesario)
router.get('/status', (req, res) => {
    const status = whatsappService.getWhatsappStatus();
    if (status.qrCodeAvailable) {
        res.json({
            isReady: status.isReady,
            message: 'Cliente no listo. Escanea el código QR.',
            qrCode: whatsappService.getQRCodeData() // Aunque ya se muestra en consola, podría ser útil para un front.
        });
    } else if (status.isInitializing) {
        res.json({ isReady: status.isReady, message: 'Cliente de WhatsApp inicializando...' });
    } else if (status.isReady) {
        res.json({ isReady: status.isReady, message: 'Cliente de WhatsApp listo.' });
    } else {
        res.status(500).json({ isReady: false, message: 'Estado del cliente de WhatsApp desconocido o error.' });
    }
});

// Ruta de prueba para enviar un mensaje (requiere que el cliente esté listo)
// En una app real, esto estaría integrado en la lógica de recordatorios de turnos.
router.post('/send-test', async (req, res) => {
    if (!whatsappService.isWhatsappReady()) {
        return res.status(503).json({ success: false, message: 'El cliente de WhatsApp no está listo.' });
    }
    const { to, message } = req.body;
    if (!to || !message) {
        return res.status(400).json({ success: false, message: 'El destinatario (to) y el mensaje (message) son requeridos.' });
    }

    try {
        await whatsappService.sendMessage(to, message);
        res.json({ success: true, message: 'Mensaje de prueba enviado (o en proceso).' });
    } catch (error) {
        console.error("Error en ruta /send-test:", error);
        res.status(500).json({ success: false, message: 'Error al enviar mensaje de prueba.', error: error.message });
    }
});

module.exports = router;
