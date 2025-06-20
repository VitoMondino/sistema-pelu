// Horarios y configuración de turnos

// Días de la semana: 0 (Domingo) a 6 (Sábado) según getDay() de JavaScript Date
export const DIAS_LABORABLES = {
    LUNES: 1,
    MARTES: 2,
    MIERCOLES: 3,
    JUEVES: 4,
    VIERNES: 5,
    SABADO: 6,
    DOMINGO: 0,
};

export const HORARIOS_POR_DIA = {
    [DIAS_LABORABLES.LUNES]: { inicio: '10:00', fin: '23:00' },
    [DIAS_LABORABLES.MARTES]: { inicio: '10:00', fin: '23:00' },
    [DIAS_LABORABLES.MIERCOLES]: { inicio: '10:00', fin: '23:00' },
    [DIAS_LABORABLES.JUEVES]: { inicio: '10:00', fin: '23:00' },
    [DIAS_LABORABLES.VIERNES]: { inicio: '10:00', fin: '23:00' },
    [DIAS_LABORABLES.SABADO]: { inicio: '08:00', fin: '15:00' },
    // Domingo no se define, por lo tanto, no es laborable.
};

export const DURACION_SLOT_MINUTOS = 30;

/**
 * Verifica si una fecha y hora dadas son válidas según los horarios laborables.
 * @param {Date} date - El objeto Date a verificar.
 * @returns {boolean} - True si es un horario válido, false de lo contrario.
 */
export const esHorarioLaborable = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return false; // Fecha inválida
    }

    const diaSemana = date.getDay();
    const horarioDia = HORARIOS_POR_DIA[diaSemana];

    if (!horarioDia) {
        return false; // Día no laborable (ej. Domingo)
    }

    const hora = date.getHours();
    const minutos = date.getMinutes();

    const [inicioHora, inicioMinutos] = horarioDia.inicio.split(':').map(Number);
    const [finHora, finMinutos] = horarioDia.fin.split(':').map(Number);

    // Convertir a minutos desde el inicio del día para facilitar la comparación
    const tiempoSeleccionadoEnMinutos = hora * 60 + minutos;
    const inicioLaborableEnMinutos = inicioHora * 60 + inicioMinutos;
    // El fin es el inicio del último slot. Si el fin es 23:00, el último slot es 22:30.
    // Si el fin es 15:00, el último slot es 14:30.
    // Un turno puede empezar en el último slot válido, pero no después.
    // Fin real del servicio sería finHora:finMinutos. Un turno no puede empezar exactamente a las 23:00 si ese es el cierre.
    const finLaborableEnMinutos = finHora * 60 + finMinutos;


    if (tiempoSeleccionadoEnMinutos < inicioLaborableEnMinutos || tiempoSeleccionadoEnMinutos >= finLaborableEnMinutos) {
        return false; // Fuera del rango de horas laborables
    }

    // Verificar que los minutos sean :00 o :30
    if (minutos % DURACION_SLOT_MINUTOS !== 0) {
        return false;
    }

    return true;
};

/**
 * Obtiene la hora mínima y máxima para el calendario en un día específico.
 * @param {Date} date - La fecha para la cual obtener los límites.
 * @returns {{min: Date, max: Date} | null} - Objeto con min y max Date, o null si el día no es laborable.
 */
export const getMinMaxTimeForCalendar = (date) => {
    const diaSemana = date.getDay();
    const horarioDia = HORARIOS_POR_DIA[diaSemana];

    if (!horarioDia) {
        const nonWorkDay = new Date(date);
        nonWorkDay.setHours(0,0,0,0); // No mostrar slots
        return { min: nonWorkDay, max: nonWorkDay };
    }

    const [inicioHora, inicioMinutos] = horarioDia.inicio.split(':').map(Number);
    const [finHora, finMinutos] = horarioDia.fin.split(':').map(Number);

    const minTime = new Date(date);
    minTime.setHours(inicioHora, inicioMinutos, 0, 0);

    const maxTime = new Date(date);
    // El maxTime en react-big-calendar define hasta dónde se muestran los slots.
    // Si el fin es 23:00, queremos que se muestren slots hasta las 22:30.
    // El componente Calendar maneja esto con 'endAccessor'.
    // Aquí, para `max` en las props del Calendar, especificamos la hora de cierre.
    maxTime.setHours(finHora, finMinutos, 0, 0);

    return { min: minTime, max: maxTime };
};
