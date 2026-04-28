/**
 * ============================================
 * ANÁLISIS COMPARATIVO AVANZADO
 * ============================================
 * Funciones para matriz comparativa, scoring
 * ponderado y análisis de riesgo
 */

/**
 * Calcula una matriz comparativa con múltiples criterios
 * @param {Object} datosA - Datos de alternativa A
 * @param {Object} datosB - Datos de alternativa B
 * @param {Object} resultadosA - Resultados de alternativa A
 * @param {Object} resultadosB - Resultados de alternativa B
 * @returns {Array} Matriz de criterios con puntajes
 */
function calcularMatrizComparativa(datosA, datosB, resultadosA, resultadosB) {
    const criterios = [
        {
            nombre: 'VPN (Valor Presente Neto)',
            descripcion: 'Valor económico absoluto creado',
            valorA: resultadosA.vpn,
            valorB: resultadosB.vpn,
            peso: 0.35,
            unidad: 'US$',
            tipo: 'mayor_mejor'
        },
        {
            nombre: 'CAE (Costo Anual Equivalente)',
            descripcion: 'Costo normalizado anual',
            valorA: resultadosA.cae,
            valorB: resultadosB.cae,
            peso: 0.30,
            unidad: 'US$',
            tipo: 'menor_mejor'
        },
        {
            nombre: 'TIR (Tasa Interna de Retorno)',
            descripcion: 'Rentabilidad porcentual',
            valorA: resultadosA.tir,
            valorB: resultadosB.tir,
            peso: 0.25,
            unidad: '%',
            tipo: 'mayor_mejor'
        },
        {
            nombre: 'Recuperación (Payback Normado)',
            descripcion: 'Tiempo de recuperación relativo',
            valorA: calcularPayback(datosA, resultadosA.vpn),
            valorB: calcularPayback(datosB, resultadosB.vpn),
            peso: 0.10,
            unidad: 'años',
            tipo: 'menor_mejor'
        }
    ];

    // Calcular puntajes normalizados para cada criterio
    criterios.forEach(criterio => {
        const {puntajeA, puntajeB} = calcularPuntajeCriterio(
            criterio.valorA,
            criterio.valorB,
            criterio.tipo
        );
        
        criterio.puntajeA = puntajeA;
        criterio.puntajeB = puntajeB;
        criterio.ganador = puntajeA > puntajeB ? 'A' : (puntajeB > puntajeA ? 'B' : 'Empate');
    });

    return criterios;
}

/**
 * Calcula el payback (tiempo de recuperación) normalizado
 * @param {Object} datos - Datos de la alternativa
 * @param {Number} vpn - VPN de la alternativa
 * @returns {Number} Años de recuperación
 */
function calcularPayback(datos, vpn) {
    // Si VPN es negativo, no hay recuperación (retorna vidas útiles)
    if (vpn < 0) {
        return datos.vidaUtil;
    }
    
    // Aproximación: años de recuperación basado en relación VPN/Inversión
    const ratio = vpn / datos.inversionInicial;
    const payback = datos.vidaUtil * (1 - Math.min(ratio * 0.5, 0.9));
    
    return Math.max(0.1, payback);
}

/**
 * Calcula puntaje normalizado 0-100 para un criterio
 * @param {Number} valorA - Valor de alternativa A
 * @param {Number} valorB - Valor de alternativa B
 * @param {String} tipo - 'mayor_mejor' o 'menor_mejor'
 * @returns {Object} Puntajes normalizados
 */
function calcularPuntajeCriterio(valorA, valorB, tipo) {
    if (tipo === 'mayor_mejor') {
        const maximo = Math.max(valorA, valorB);
        return {
            puntajeA: (valorA / maximo) * 100,
            puntajeB: (valorB / maximo) * 100
        };
    } else {
        // menor_mejor
        const minimo = Math.min(valorA, valorB);
        const puntajeA = minimo > 0 ? (minimo / valorA) * 100 : 100;
        const puntajeB = minimo > 0 ? (minimo / valorB) * 100 : 100;
        return { puntajeA, puntajeB };
    }
}

/**
 * Calcula scoring ponderado total
 * @param {Array} criterios - Matriz de criterios con puntajes
 * @returns {Object} Puntajes totales y ganador
 */
function calcularScoringPonderado(criterios) {
    let scoreA = 0;
    let scoreB = 0;

    criterios.forEach(criterio => {
        scoreA += criterio.puntajeA * criterio.peso;
        scoreB += criterio.puntajeB * criterio.peso;
    });

    return {
        scoreA: parseFloat(scoreA.toFixed(2)),
        scoreB: parseFloat(scoreB.toFixed(2)),
        ganador: scoreA > scoreB ? 'A' : (scoreB > scoreA ? 'B' : 'Empate'),
        diferencia: Math.abs(scoreA - scoreB).toFixed(2)
    };
}

/**
 * Análisis de riesgo comparativo
 * @param {Object} datosA - Datos de alternativa A
 * @param {Object} datosB - Datos de alternativa B
 * @param {Object} resultadosA - Resultados de alternativa A
 * @param {Object} resultadosB - Resultados de alternativa B
 * @returns {Object} Análisis de riesgos
 */
function analizarRiesgos(datosA, datosB, resultadosA, resultadosB) {
    return {
        // Volatilidad financiera (basada en relación inversión/flujo)
        volatilidad: {
            tipoA: calcularVolatilidad(datosA),
            tipoB: calcularVolatilidad(datosB),
            analisis: analizarVolatilidadRiesgo(datosA, datosB)
        },
        
        // Riesgo de recuperación
        recuperacion: {
            paybackA: calcularPayback(datosA, resultadosA.vpn),
            paybackB: calcularPayback(datosB, resultadosB.vpn),
            analisis: analizarRecuperacionRiesgo(datosA, datosB, resultadosA, resultadosB)
        },
        
        // Riesgo de sensibilidad
        sensibilidad: {
            sensibilidadA: calcularSensibilidadRiesgo(datosA, resultadosA.vpn),
            sensibilidadB: calcularSensibilidadRiesgo(datosB, resultadosB.vpn),
            analisis: analizarSensibilidadRiesgo(datosA, datosB, resultadosA, resultadosB)
        },
        
        // Perfil de riesgo general
        perfilRiesgo: calcularPerfilRiesgo(datosA, datosB, resultadosA, resultadosB)
    };
}

/**
 * Calcula volatilidad de flujos
 * @param {Object} datos - Datos de alternativa
 * @returns {String} Nivel de volatilidad
 */
function calcularVolatilidad(datos) {
    const ratio = datos.inversionInicial / datos.flujoAnual;
    
    if (ratio > 4) return 'Alta';
    if (ratio > 2.5) return 'Media';
    return 'Baja';
}

/**
 * Análisis textual de volatilidad
 */
function analizarVolatilidadRiesgo(datosA, datosB) {
    const volA = calcularVolatilidad(datosA);
    const volB = calcularVolatilidad(datosB);
    
    let analisis = `Volatilidad - Alternativa A: ${volA}, Alternativa B: ${volB}. `;
    
    if (volA === volB) {
        analisis += 'Ambas alternativas tienen volatilidad similar.';
    } else if (volA === 'Baja') {
        analisis += 'Alternativa A tiene menor riesgo de volatilidad.';
    } else {
        analisis += 'Alternativa B tiene menor riesgo de volatilidad.';
    }
    
    return analisis;
}

/**
 * Análisis de riesgo en recuperación
 */
function analizarRecuperacionRiesgo(datosA, datosB, resultadosA, resultadosB) {
    const paybackA = calcularPayback(datosA, resultadosA.vpn);
    const paybackB = calcularPayback(datosB, resultadosB.vpn);
    
    if (paybackA < paybackB) {
        return `Alternativa A recupera inversión más rápidamente (${paybackA.toFixed(1)} años vs ${paybackB.toFixed(1)} años), menor riesgo temporal.`;
    } else {
        return `Alternativa B recupera inversión más rápidamente (${paybackB.toFixed(1)} años vs ${paybackA.toFixed(1)} años), menor riesgo temporal.`;
    }
}

/**
 * Calcula sensibilidad al riesgo (qué tan sensible es al cambio de parámetros)
 */
function calcularSensibilidadRiesgo(datos, vpn) {
    // Sensibilidad basada en VPN relativo y estructura de inversión
    const vpnRelativo = Math.abs(vpn) / datos.inversionInicial;
    
    if (vpnRelativo < 0.15) return 'Alta';
    if (vpnRelativo < 0.35) return 'Media';
    return 'Baja';
}

/**
 * Análisis textual de sensibilidad
 */
function analizarSensibilidadRiesgo(datosA, datosB, resultadosA, resultadosB) {
    const sensA = calcularSensibilidadRiesgo(datosA, resultadosA.vpn);
    const sensB = calcularSensibilidadRiesgo(datosB, resultadosB.vpn);
    
    if (sensA === sensB) {
        return `Ambas alternativas tienen sensibilidad similar a cambios de parámetros.`;
    } else if (sensA === 'Baja') {
        return `Alternativa A es más robusta ante cambios de parámetros (menor sensibilidad).`;
    } else {
        return `Alternativa B es más robusta ante cambios de parámetros (menor sensibilidad).`;
    }
}

/**
 * Calcula perfil de riesgo general
 */
function calcularPerfilRiesgo(datosA, datosB, resultadosA, resultadosB) {
    const riesgosA = [
        calcularVolatilidad(datosA),
        calcularSensibilidadRiesgo(datosA, resultadosA.vpn)
    ].filter(r => r === 'Alta').length;
    
    const riesgosB = [
        calcularVolatilidad(datosB),
        calcularSensibilidadRiesgo(datosB, resultadosB.vpn)
    ].filter(r => r === 'Alta').length;
    
    return {
        countA: riesgosB,
        countB: riesgosB,
        menorRiesgo: riesgosA < riesgosB ? 'A' : (riesgosB < riesgosA ? 'B' : 'Similar'),
        descripcion: riesgosA < riesgosB 
            ? 'Alternativa A presenta perfil de riesgo más controlado'
            : (riesgosB < riesgosA 
                ? 'Alternativa B presenta perfil de riesgo más controlado'
                : 'Ambas alternativas tienen perfiles de riesgo similares')
    };
}

/**
 * Genera HTML para mostrar la matriz comparativa
 */
function generarHTMLMatrizComparativa(criterios, scoring) {
    let html = '<div class="matriz-comparativa-container">';
    
    // Encabezado
    html += '<h5 class="mt-4 mb-3">📊 Matriz Comparativa Ponderada</h5>';
    
    // Tabla de criterios
    html += '<div class="table-responsive">';
    html += '<table class="table table-hover">';
    html += '<thead>';
    html += '<tr>';
    html += '<th>Criterio</th>';
    html += '<th class="text-center">Peso</th>';
    html += '<th class="text-center">Alt. A</th>';
    html += '<th class="text-center">Alt. B</th>';
    html += '<th class="text-center">Ganador</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';
    
    criterios.forEach(criterio => {
        html += `<tr>`;
        html += `<td><strong>${criterio.nombre}</strong><br><small class="text-muted">${criterio.descripcion}</small></td>`;
        html += `<td class="text-center">${(criterio.peso * 100).toFixed(0)}%</td>`;
        html += `<td class="text-center"><span class="puntaje-badge">${criterio.puntajeA.toFixed(1)}/100</span></td>`;
        html += `<td class="text-center"><span class="puntaje-badge">${criterio.puntajeB.toFixed(1)}/100</span></td>`;
        html += `<td class="text-center"><strong class="${criterio.ganador === 'A' ? 'text-primary' : 'text-success'}">${criterio.ganador}</strong></td>`;
        html += `</tr>`;
    });
    
    html += '</tbody>';
    html += '</table>';
    html += '</div>';
    
    // Score final
    html += '<div class="score-final mt-4">';
    html += '<div class="row">';
    html += `<div class="col-md-6">`;
    html += `<div class="score-card ${scoring.scoreA > scoring.scoreB ? 'ganador' : ''}">`;
    html += `<div class="score-value">${scoring.scoreA.toFixed(1)}</div>`;
    html += `<div class="score-label">Alternativa A</div>`;
    html += `</div>`;
    html += `</div>`;
    html += `<div class="col-md-6">`;
    html += `<div class="score-card ${scoring.scoreB > scoring.scoreA ? 'ganador' : ''}">`;
    html += `<div class="score-value">${scoring.scoreB.toFixed(1)}</div>`;
    html += `<div class="score-label">Alternativa B</div>`;
    html += `</div>`;
    html += `</div>`;
    html += '</div>';
    html += `<div class="diferencia-score mt-3">Diferencia: ${scoring.diferencia} puntos</div>`;
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

/**
 * Genera HTML para mostrar análisis de riesgos
 */
function generarHTMLAnalisisRiesgos(riesgos) {
    let html = '<div class="analisis-riesgos-container mt-4">';
    
    html += '<h5 class="mb-3">⚠️ Análisis de Riesgos</h5>';
    
    // Volatilidad
    html += '<div class="riesgo-item p-3 border-left-warning">';
    html += '<strong class="text-warning">Volatilidad Financiera:</strong>';
    html += `<p class="mb-0 mt-2">${riesgos.volatilidad.analisis}</p>`;
    html += '</div>';
    
    // Recuperación
    html += '<div class="riesgo-item p-3 border-left-info mt-3">';
    html += '<strong class="text-info">Riesgo de Recuperación:</strong>';
    html += `<p class="mb-0 mt-2">${riesgos.recuperacion.analisis}</p>`;
    html += '</div>';
    
    // Sensibilidad
    html += '<div class="riesgo-item p-3 border-left-success mt-3">';
    html += '<strong class="text-success">Robustez Ante Cambios:</strong>';
    html += `<p class="mb-0 mt-2">${riesgos.sensibilidad.analisis}</p>`;
    html += '</div>';
    
    // Perfil general
    html += '<div class="riesgo-item p-3 border-left-primary mt-3">';
    html += '<strong class="text-primary">Perfil de Riesgo General:</strong>';
    html += `<p class="mb-0 mt-2"><strong>${riesgos.perfilRiesgo.descripcion}</strong></p>`;
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

/**
 * Función principal para actualizar análisis avanzado
 */
function actualizarAnalisisAvanzado(datosA, datosB, resultadosA, resultadosB) {
    // Calcular matriz
    const criterios = calcularMatrizComparativa(datosA, datosB, resultadosA, resultadosB);
    
    // Calcular scoring ponderado
    const scoring = calcularScoringPonderado(criterios);
    
    // Analizar riesgos
    const riesgos = analizarRiesgos(datosA, datosB, resultadosA, resultadosB);
    
    // Generar HTML
    let html = generarHTMLMatrizComparativa(criterios, scoring);
    html += generarHTMLAnalisisRiesgos(riesgos);
    
    // Mostrar en la página
    const contenedor = document.getElementById('analisisAvanzado');
    if (contenedor) {
        contenedor.innerHTML = html;
    }
    
    return {
        criterios,
        scoring,
        riesgos
    };
}
