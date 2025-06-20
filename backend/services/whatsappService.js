const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config');

let client;
let qrCodeData;
let isWhatsappReady = false;

function initializeWhatsAppClient() {
    console.log('Inicializando cliente de WhatsApp...');
    client = new Client({
        authStrategy: new LocalAuth(), // Guarda la sesión localmente para no escanear QR siempre
        puppeteer: {
            headless: true, // Correr en modo headless
            args: [
                '--no-sandbox', // Necesario para correr en algunos entornos de CI/Servidor
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                // '--single-process', // Descomentar si hay problemas en entornos con pocos recursos
                '--disable-gpu'
            ],
        }
    });

    client.on('qr', qr => {
        qrCodeData = qr;
        console.log('QR Code Data:', qr);
        qrcode.generate(qr, { small: true });
        console.log('Escanea el código QR con WhatsApp en tu teléfono y espera a que el cliente esté listo.');
        isWhatsappReady = false; // Marcar como no listo hasta que 'ready' se dispare
    });

    client.on('ready', () => {
        isWhatsappReady = true;
        qrCodeData = null; // Limpiar QR una vez listo
        console.log('Cliente de WhatsApp está listo!');
        // Aquí podrías iniciar tareas como enviar mensajes pendientes si los hubiera
    });

    client.on('authenticated', () => {
        console.log('Cliente de WhatsApp autenticado!');
    });

    client.on('auth_failure', msg => {
        console.error('Fallo de autenticación de WhatsApp:', msg);
        isWhatsappReady = false;
        // Podrías intentar reinicializar o notificar al administrador
    });

    client.on('disconnected', (reason) => {
        console.log('Cliente de WhatsApp desconectado:', reason);
        isWhatsappReady = false;
        // Intentar reconectar o reinicializar podría ser una opción aquí
        // initializeWhatsAppClient(); // Cuidado con bucles infinitos
    });

    client.on('loading_screen', (percent, message) => {
        console.log('Cargando WhatsApp Web:', percent, message);
    });

    client.initialize().catch(err => {
        console.error("Error al inicializar WhatsApp Client:", err);
        isWhatsappReady = false;
    });
}

function getQRCodeData() {
    return qrCodeData;
}

function getWhatsappStatus() {
    return {
        isReady: isWhatsappReady,
        isInitializing: client && !isWhatsappReady && !qrCodeData, // Si client existe pero no está listo ni hay QR
        qrCodeAvailable: !!qrCodeData
    };
}

async function sendMessage(to, message) {
    if (!isWhatsappReady || !client) {
        console.error('El cliente de WhatsApp no está listo o no inicializado.');
        throw new Error('El cliente de WhatsApp no está listo.');
    }

    // El número debe estar en formato 'prefijoPaisNumero@c.us', ej: '54911xxxxxxxx@c.us'
    // Necesitamos una forma de obtener el prefijo del país o asumirlo.
    // Por ahora, asumimos que el 'to' viene sin el @c.us y sin el prefijo de país +549
    // Esta parte necesitará ajustes según cómo se guarden los números de teléfono.

    let chatId = to.startsWith('549') ? `${to}@c.us` : `549${to}@c.us`; // Ejemplo para Argentina
    if (!to.includes('@c.us')) { // Si no tiene el sufijo, lo agregamos.
         // Lógica simple para Argentina, podría necesitar ser más robusta o configurable
        if (to.startsWith('549') && to.length > 10) { // Ya tiene prefijo de país
            chatId = `${to}@c.us`;
        } else if (to.length >= 9 && to.length <=11 && !to.startsWith('549')) { // Número local sin prefijo de país
            chatId = `549${to}@c.us`;
        } else {
            // Si el formato no es claro, podríamos intentar enviar tal cual o fallar
            console.warn(`El formato del número ${to} no es estándar. Intentando como ${to}@c.us`);
            chatId = `${to}@c.us`; // Puede fallar si no es correcto
        }
    } else {
        chatId = to; // Ya tiene el formato correcto
    }


    try {
        console.log(`Intentando enviar mensaje a ${chatId}: "${message}"`);
        const sentMessage = await client.sendMessage(chatId, message);
        console.log('Mensaje enviado:', sentMessage.id.id);
        return sentMessage;
    } catch (error) {
        console.error(`Error al enviar mensaje a ${chatId}:`, error);
        throw error;
    }
}

module.exports = {
    initializeWhatsAppClient,
    getQRCodeData,
    getWhatsappStatus,
    sendMessage,
    isWhatsappReady: () => isWhatsappReady // Función para consultar estado directamente
};
