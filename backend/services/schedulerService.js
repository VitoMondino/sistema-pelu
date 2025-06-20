const cron = require('node-cron');
const db = require('../db');
const whatsappService = require('./whatsappService');
const config = require('../config'); // Podríamos añadir configuración específica del scheduler aquí

const TAREAS_PROGRAMADAS_ACTIVAS = true; // Interruptor global para activar/desactivar tareas

// Formatear fecha para mostrar al usuario
function formatUserFriendlyDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('es-ES', options); // Ajustar locale si es necesario
}

async function enviarRecordatoriosDeTurnos() {
    if (!TAREAS_PROGRAMADAS_ACTIVAS) {
        console.log('Scheduler: EnviarRecordatoriosDeTurnos está desactivado globalmente.');
        return;
    }

    if (!whatsappService.isWhatsappReady()) {
        console.log('Scheduler: WhatsApp no está listo. Omitiendo envío de recordatorios.');
        return;
    }

    console.log('Scheduler: Buscando turnos para enviar recordatorios...');

    try {
        const ahora = new Date();
        const limiteSuperior = new Date(ahora.getTime() + 24 * 60 * 60 * 1000); // Próximas 24 horas
        // const limiteInferior = new Date(ahora.getTime() + 23 * 60 * 60 * 1000); // Para evitar enviar múltiples veces si la tarea corre muy seguido
                                                                            // O mejor, marcar los turnos para los que ya se envió recordatorio.

        // Obtener turnos pendientes que están dentro de las próximas 24 horas
        // y para los que no se ha enviado recordatorio (necesitaríamos un campo nuevo en la tabla 'turnos', ej. 'recordatorio_enviado' BOOLEAN)
        // Por ahora, simplificamos y no chequeamos si ya se envió. Esto podría causar múltiples envíos si la tarea corre seguido.
        const query = `
            SELECT
                t.id,
                t.fecha_hora,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                s.nombre_servicio as servicio_nombre
            FROM turnos t
            JOIN clientes c ON t.cliente_id = c.id
            JOIN servicios s ON t.servicio_id = s.id
            WHERE t.estado = 'Pendiente'
              AND t.fecha_hora > ?
              AND t.fecha_hora <= ?
              AND t.recordatorio_enviado = FALSE
        `;

        const turnos = await db.query(query, [ahora, limiteSuperior]);

        if (turnos.length === 0) {
            console.log('Scheduler: No hay turnos próximos para enviar recordatorios.');
            return;
        }

        console.log(`Scheduler: ${turnos.length} turnos encontrados para recordar.`);

        for (const turno of turnos) {
            const mensaje = `Hola ${turno.cliente_nombre}! Te recordamos tu turno en MV Salon Urbano para ${turno.servicio_nombre} el día ${formatUserFriendlyDate(turno.fecha_hora)}. ¡Te esperamos!`;

            // El número de teléfono debe estar en el formato correcto para whatsapp-web.js
            // ej: 54911xxxxxxxx@c.us (para Argentina)
            // Asumimos que el whatsappService.sendMessage maneja la normalización del número.
            if (!turno.cliente_telefono) {
                console.warn(`Scheduler: El cliente ${turno.cliente_nombre} (turno ID: ${turno.id}) no tiene teléfono registrado. No se puede enviar recordatorio.`);
                continue;
            }

            try {
                await whatsappService.sendMessage(turno.cliente_telefono, mensaje);
                console.log(`Scheduler: Recordatorio enviado para el turno ID: ${turno.id} al cliente ${turno.cliente_nombre}`);

                // Marcar el turno como 'recordatorio_enviado = TRUE'
                await db.query('UPDATE turnos SET recordatorio_enviado = TRUE WHERE id = ?', [turno.id]);
                console.log(`Scheduler: Turno ID: ${turno.id} marcado como recordatorio enviado.`);
            } catch (error) {
                console.error(`Scheduler: Error al enviar recordatorio o marcar turno ID: ${turno.id}. Error: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('Scheduler: Error al procesar recordatorios de turnos:', error);
    }
}


function iniciarTareasProgramadas() {
    if (!TAREAS_PROGRAMADAS_ACTIVAS) {
        console.log('Scheduler: Las tareas programadas están desactivadas globalmente.');
        return;
    }

    console.log('Scheduler: Iniciando tareas programadas...');

    // Tarea para enviar recordatorios de turnos.
    // Se ejecuta cada hora (ej. '0 * * * *' - a la hora en punto, cada hora).
    // Para pruebas, podría ser más frecuente, ej. cada minuto ('* * * * *').
    // Por ahora, configuramos para que se ejecute cada día a las 9 AM.
    cron.schedule('0 9 * * *', () => { // '0 9 * * *' = todos los días a las 9:00 AM
        console.log('Scheduler: Ejecutando tarea programada de recordatorio de turnos (9 AM)...');
        enviarRecordatoriosDeTurnos();
    }, {
        scheduled: true,
        timezone: "America/Argentina/Buenos_Aires" // Ajustar a la zona horaria del salón
    });

    // Podrías añadir una ejecución inmediata al iniciar para pruebas o para asegurar que no se pierdan turnos
    // si el servidor se reinicia justo antes de la hora programada.
    // setTimeout(enviarRecordatoriosDeTurnos, 5000); // Ejecutar 5 segundos después de iniciar (para pruebas)

    console.log("Scheduler: Tarea de recordatorio de turnos programada para las 9:00 AM (zona horaria del servidor).");
}

module.exports = {
    iniciarTareasProgramadas,
    // Podríamos exportar enviarRecordatoriosDeTurnos para ejecutarla manualmente vía API si fuera necesario
};
