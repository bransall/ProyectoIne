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
 * @param {Object} metodosSeleccionados - Métodos a incluir en la matriz {vpn, cae, tir}
 * @returns {Array} Matriz de criterios con puntajes
 */
function calcularMatrizComparativa(datosA, datosB, resultadosA, resultadosB, metodosSeleccionados = {vpn: true, cae: true, tir: true}) {
    const criteriosTodos = [
        {
            nombre: 'VPN (Valor Presente Neto)',
            descripcion: 'Valor económico absoluto creado',
            valorA: resultadosA.vpn,
            valorB: resultadosB.vpn,
            unidad: 'US$',
            tipo: 'mayor_mejor',
            metodo: 'vpn'
        },
        {
            nombre: 'CAE (Costo Anual Equivalente)',
            descripcion: 'Costo normalizado anual',
            valorA: resultadosA.cae,
            valorB: resultadosB.cae,
            unidad: 'US$',
            tipo: 'menor_mejor',
            metodo: 'cae'
        },
        {
            nombre: 'TIR (Tasa Interna de Retorno)',
            descripcion: 'Rentabilidad porcentual',
            valorA: resultadosA.tir,
            valorB: resultadosB.tir,
            unidad: '%',
            tipo: 'mayor_mejor',
            metodo: 'tir'
        }
    ];
    
    // Filtrar criterios según métodos seleccionados
    const criterios = criteriosTodos.filter(c => metodosSeleccionados[c.metodo]);
    
    // Calcular pesos dinámicamente según cantidad de criterios
    const numCriterios = criterios.length;
    const pesosBase = {
        1: [1.0],
        2: [0.5, 0.5],
        3: [0.35, 0.35, 0.30]
    };
    
    const pesos = pesosBase[numCriterios] || [1/numCriterios];
    criterios.forEach((criterio, index) => {
        criterio.peso = pesos[index] || 1/numCriterios;
    });

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
 * FUNCIÓN REMOVIDA: calcularPayback
 * La recuperación payback ha sido removida del análisis como se solicitó
 */

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
 * Análisis de riesgo comparativo (sin Payback)
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
    
    // Sección de Interpretación
    html += '<div class="interpretacion-matriz mt-4 p-4" style="background: rgba(13, 110, 253, 0.08); border-left: 4px solid #0d6efd; border-radius: 8px;">';
    html += '<h6 class="text-primary mb-3">📋 Interpretación del Resultado</h6>';
    html += '<div style="font-size: 0.95rem; line-height: 1.6;">';
    html += `<p><strong>Puntaje Total:</strong> Cada alternativa recibe un puntaje de 0 a 100 basado en su desempeño ponderado en todos los criterios seleccionados.</p>`;
    html += `<p><strong>Cálculo:</strong> Se normaliza el desempeño en cada criterio (0-100) y se multiplica por su peso. Los pesos se distribuyen proporcionalmente entre los métodos seleccionados.</p>`;
    html += `<p><strong>Interpretación:</strong></p>`;
    html += `<ul style="margin-left: 1.5rem; margin-top: 0.5rem;">`;
    html += `<li><strong>Puntaje alto (80-100):</strong> Alternativa muy competitiva en los criterios evaluados</li>`;
    html += `<li><strong>Puntaje medio (50-79):</strong> Alternativa moderadamente competitiva</li>`;
    html += `<li><strong>Puntaje bajo (0-49):</strong> Alternativa con desempeño inferior en los criterios</li>`;
    html += `</ul>`;
    html += `<p class="mt-3"><strong>Ganador:</strong> La alternativa con mayor puntaje es más favorable según los criterios ponderados seleccionados.</p>`;
    html += `<p><strong>Diferencia:</strong> Una diferencia mayor a 10 puntos indica una clara preferencia por una alternativa. Diferencias menores sugieren que ambas son competitivas.</p>`;
    html += '</div>';
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
function actualizarAnalisisAvanzado(datosA, datosB, resultadosA, resultadosB, metodosSeleccionados = {vpn: true, cae: true, tir: true}) {
    // Calcular matriz con criterios filtrados según métodos seleccionados
    const criterios = calcularMatrizComparativa(datosA, datosB, resultadosA, resultadosB, metodosSeleccionados);
    
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
