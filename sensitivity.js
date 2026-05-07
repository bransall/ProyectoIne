/**
 * Módulo de Análisis de Sensibilidad
 * Permite analizar cómo varían los resultados financieros ante cambios en parámetros
 */

let chartSensibilidad = null;

/**
 * Realiza análisis de sensibilidad en un parámetro específico
 * @param {Object} datos - Datos de la alternativa (inversión, tasa, etc.)
 * @param {String} parametro - Parámetro a variar ('tasa', 'flujo', 'inversion')
 * @param {Array} variaciones - Array de variaciones en porcentaje [-5, -2, -1, 0, 1, 2, 5]
 * @returns {Array} Array con datos de sensibilidad
 */
function calcularSensibilidad(datos, parametro, variaciones = [-5, -2, -1, 0, 1, 2, 5]) {
    const resultados = [];
    
    variaciones.forEach(variacion => {
        const datosModificados = { ...datos };
        
        if (parametro === 'tasa') {
            datosModificados.tasaDescuento = datos.tasaDescuento + (datos.tasaDescuento * variacion / 100);
        } else if (parametro === 'flujo') {
            datosModificados.flujoEfectivo = datos.flujoEfectivo + (datos.flujoEfectivo * variacion / 100);
        } else if (parametro === 'inversion') {
            datosModificados.inversionInicial = datos.inversionInicial + (datos.inversionInicial * variacion / 100);
        }
        
        // Calcular VPN con parámetros modificados
        const vpn = calcularVPN(
            datosModificados.inversionInicial,
            datosModificados.tasaDescuento,
            datosModificados.flujoEfectivo,
            datosModificados.vidaUtil,
            datosModificados.valorSalvamento
        );
        
        resultados.push({
            variacion: variacion,
            etiqueta: variacion > 0 ? `+${variacion}%` : `${variacion}%`,
            vpn: vpn,
            esBase: variacion === 0
        });
    });
    
    return resultados;
}

/**
 * Actualiza la vista del análisis de sensibilidad
 * @param {Object} datos - Datos de la alternativa
 * @param {String} nombreAlternativa - Nombre de la alternativa (A o B)
 */
function actualizarAnalisisSensibilidad(datos, nombreAlternativa) {
    if (!document.getElementById('panelSensibilidad')) {
        console.warn('Panel de sensibilidad no encontrado');
        return;
    }
    
    // Obtener parámetro seleccionado
    const parametroSeleccionado = document.getElementById('selectParametroSensibilidad')?.value || 'tasa';
    
    // Calcular sensibilidad
    const datos_sensibilidad = calcularSensibilidad(datos, parametroSeleccionado);
    
    // Actualizar tabla
    actualizarTablaSensibilidad(datos_sensibilidad, nombreAlternativa, parametroSeleccionado);
    
    // Actualizar gráfico
    crearGraficoSensibilidad(datos_sensibilidad, nombreAlternativa, parametroSeleccionado);
}

/**
 * Actualiza la tabla de sensibilidad
 * @param {Array} datos - Datos de sensibilidad calculados
 * @param {String} nombreAlternativa - Nombre de la alternativa
 * @param {String} parametro - Parámetro analizado
 */
function actualizarTablaSensibilidad(datos, nombreAlternativa, parametro) {
    const tabla = document.getElementById('tablaSensibilidad');
    const cuerpoTabla = document.getElementById('cuerpoTablaSensibilidad');
    if (!cuerpoTabla || !tabla) return;
    
    // Actualizar encabezado de la tabla
    const encabezado = tabla.querySelector('thead tr');
    if (encabezado) {
        encabezado.innerHTML = `
            <th>Variación</th>
            <th>VPN Alt. ${nombreAlternativa}</th>
            <th>Viabilidad</th>
        `;
    }
    
    const etiquetasParametro = {
        'tasa': 'Tasa de Descuento',
        'flujo': 'Flujo de Efectivo',
        'inversion': 'Inversión Inicial'
    };
    
    cuerpoTabla.innerHTML = datos.map(row => `
        <tr ${row.esBase ? 'class="table-info"' : ''}>
            <td>
                <strong>${row.etiqueta}</strong>
                ${row.esBase ? '<br><small class="text-muted">(Caso Base)</small>' : ''}
            </td>
            <td class="${row.vpn >= 0 ? 'text-success' : 'text-danger'}">
                <strong>${formatearMoneda(row.vpn)}</strong>
            </td>
            <td>
                ${row.vpn >= 0 ? '✅ Viable' : '❌ No viable'}
            </td>
        </tr>
    `).join('');
}

/**
 * Crea gráfico de línea para análisis de sensibilidad
 * @param {Array} datos - Datos de sensibilidad
 * @param {String} nombreAlternativa - Nombre de la alternativa
 * @param {String} parametro - Parámetro analizado
 */
function crearGraficoSensibilidad(datos, nombreAlternativa, parametro) {
    const ctx = document.getElementById('chartSensibilidad');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (chartSensibilidad) {
        chartSensibilidad.destroy();
    }
    
    const etiquetas = datos.map(d => d.etiqueta);
    const valores = datos.map(d => d.vpn);
    const puntosResaltados = datos.map(d => d.esBase ? 6 : 4);
    
    const coloresPuntos = datos.map(d => d.vpn >= 0 ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)');
    
    chartSensibilidad = new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [{
                label: `VPN - Alternativa ${nombreAlternativa}`,
                data: valores,
                borderColor: 'rgb(0, 102, 204)',
                backgroundColor: 'rgba(0, 102, 204, 0.05)',
                borderWidth: 3,
                pointRadius: puntosResaltados,
                pointBackgroundColor: coloresPuntos,
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: { size: 12, weight: 'bold' },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `VPN: ${formatearMoneda(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatearMoneda(value);
                        },
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 11 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Muestra el panel de sensibilidad
 */
function mostrarPanelSensibilidad() {
    const panel = document.getElementById('panelSensibilidad');
    if (!panel) {
        console.warn('Panel de sensibilidad no encontrado');
        return;
    }
    
    // Si está visible, ocultarlo
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
        return;
    }
    
    // Si hay resultados disponibles, mostrar panel
    if (resultadosAlternativaA && resultadosAlternativaB) {
        panel.style.display = 'block';
        
        // Crear selector si no existe
        crearSelectorAlternativa();
        
        // Obtener alternativa seleccionada en el selector
        const selectorAlternativa = document.getElementById('selectorAlternativaSensibilidad');
        let alternativaSeleccionada = 'A';
        
        if (selectorAlternativa) {
            alternativaSeleccionada = selectorAlternativa.value || 'A';
        }
        
        // Usar la alternativa seleccionada para análisis de sensibilidad
        if (alternativaSeleccionada === 'A') {
            actualizarAnalisisSensibilidad(datosAlternativaA, 'A');
        } else if (alternativaSeleccionada === 'B') {
            actualizarAnalisisSensibilidad(datosAlternativaB, 'B');
        } else if (alternativaSeleccionada === 'Comparacion') {
            actualizarAnalisisSensibilidadComparativa();
        }
    } else {
        mostrarError('Primero debe realizar un cálculo antes de analizar sensibilidad.');
    }
}

/**
 * Alterna entre mostrar/ocultar sensibilidad
 */
function toggleSensibilidad() {
    mostrarPanelSensibilidad();
}

/**
 * Actualiza el análisis cuando cambia el parámetro seleccionado
 */
function onCambioParametroSensibilidad() {
    const selectorAlternativa = document.getElementById('selectorAlternativaSensibilidad');
    let alternativaSeleccionada = selectorAlternativa ? (selectorAlternativa.value || 'A') : 'A';
    
    if (alternativaSeleccionada === 'A' && resultadosAlternativaA && datosAlternativaA) {
        actualizarAnalisisSensibilidad(datosAlternativaA, 'A');
    } else if (alternativaSeleccionada === 'B' && resultadosAlternativaB && datosAlternativaB) {
        actualizarAnalisisSensibilidad(datosAlternativaB, 'B');
    } else if (alternativaSeleccionada === 'Comparacion') {
        actualizarAnalisisSensibilidadComparativa();
    } else if (!alternativaSeleccionada && resultadosAlternativaA && datosAlternativaA) {
        // Default a A si no hay selector
        actualizarAnalisisSensibilidad(datosAlternativaA, 'A');
    }
}

/**
 * Exporta los datos de sensibilidad a tabla HTML
 */
function exportarSensibilidad() {
    const parametro = document.getElementById('selectParametroSensibilidad')?.value || 'tasa';
    const datos = calcularSensibilidad(datosAlternativaA, parametro);
    
    const etiquetas = {
        'tasa': 'Tasa de Descuento',
        'flujo': 'Flujo de Efectivo',
        'inversion': 'Inversión Inicial'
    };
    
    let html = `
    <table border="1" cellpadding="10" cellspacing="0">
        <thead>
            <tr style="background-color: #0066cc; color: white;">
                <th>Variación ${etiquetas[parametro]}</th>
                <th>VPN Resultante</th>
                <th>Viabilidad</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    datos.forEach(row => {
        html += `
            <tr>
                <td>${row.etiqueta}${row.esBase ? ' (Caso Base)' : ''}</td>
                <td>${formatearMoneda(row.vpn)}</td>
                <td>${row.vpn >= 0 ? 'Viable' : 'No Viable'}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    
    return html;
}

/**
 * Crea un selector para elegir entre Alternativa A, B o Comparación
 */
function crearSelectorAlternativa() {
    const panelSensibilidad = document.getElementById('panelSensibilidad');
    if (!panelSensibilidad) return;
    
    // Buscar si ya existe el selector
    let selectorExistente = document.getElementById('selectorAlternativaSensibilidad');
    if (selectorExistente) return;
    
    // Crear contenedor para el selector
    const contenedorSelector = document.createElement('div');
    contenedorSelector.className = 'mb-3 mt-3';
    
    const label = document.createElement('label');
    label.className = 'form-label fw-bold';
    label.htmlFor = 'selectorAlternativaSensibilidad';
    label.textContent = 'Seleccionar Alternativa:';
    
    const select = document.createElement('select');
    select.id = 'selectorAlternativaSensibilidad';
    select.className = 'form-select';
    select.onchange = function() {
        mostrarPanelSensibilidad();
    };
    
    const opciones = [
        { valor: 'A', texto: 'Alternativa A' },
        { valor: 'B', texto: 'Alternativa B' },
        { valor: 'Comparacion', texto: 'Comparación A vs B' }
    ];
    
    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.valor;
        option.textContent = opcion.texto;
        select.appendChild(option);
    });
    
    contenedorSelector.appendChild(label);
    contenedorSelector.appendChild(select);
    
    // Insertar al inicio del panel de sensibilidad
    panelSensibilidad.insertBefore(contenedorSelector, panelSensibilidad.firstChild);
}

/**
 * Actualiza el análisis de sensibilidad comparativa entre ambas alternativas
 */
function actualizarAnalisisSensibilidadComparativa() {
    const parametroSeleccionado = document.getElementById('selectParametroSensibilidad')?.value || 'tasa';
    
    // Calcular sensibilidad para ambas alternativas
    const datosA = calcularSensibilidad(datosAlternativaA, parametroSeleccionado);
    const datosB = calcularSensibilidad(datosAlternativaB, parametroSeleccionado);
    
    // Actualizar tabla comparativa
    actualizarTablaComparativa(datosA, datosB, parametroSeleccionado);
    
    // Actualizar gráfico comparativo
    crearGraficoComparativo(datosA, datosB, parametroSeleccionado);
}

/**
 * Actualiza la tabla comparativa
 */
function actualizarTablaComparativa(datosA, datosB, parametro) {
    const tabla = document.getElementById('tablaSensibilidad');
    const cuerpoTabla = document.getElementById('cuerpoTablaSensibilidad');
    if (!cuerpoTabla || !tabla) return;
    
    // Actualizar encabezado de la tabla
    const encabezado = tabla.querySelector('thead tr');
    if (encabezado) {
        encabezado.innerHTML = `
            <th>Variación</th>
            <th>VPN Alternativa A</th>
            <th>VPN Alternativa B</th>
            <th>Mejor</th>
        `;
    }
    
    cuerpoTabla.innerHTML = datosA.map((rowA, index) => {
        const rowB = datosB[index];
        const mejorVPN = rowA.vpn > rowB.vpn ? 'A' : 'B';
        
        return `
            <tr ${rowA.esBase ? 'class="table-info"' : ''}>
                <td>
                    <strong>${rowA.etiqueta}</strong>
                    ${rowA.esBase ? '<br><small class="text-muted">(Caso Base)</small>' : ''}
                </td>
                <td class="${rowA.vpn >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatearMoneda(rowA.vpn)}
                </td>
                <td class="${rowB.vpn >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatearMoneda(rowB.vpn)}
                </td>
                <td>
                    <strong class="text-primary">Alt. ${mejorVPN}</strong>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Crea gráfico comparativo de líneas
 */
function crearGraficoComparativo(datosA, datosB, parametro) {
    const ctx = document.getElementById('chartSensibilidad');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (chartSensibilidad) {
        chartSensibilidad.destroy();
    }
    
    const etiquetas = datosA.map(d => d.etiqueta);
    const valoresA = datosA.map(d => d.vpn);
    const valoresB = datosB.map(d => d.vpn);
    
    chartSensibilidad = new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [
                {
                    label: 'VPN - Alternativa A',
                    data: valoresA,
                    borderColor: 'rgb(0, 102, 204)',
                    backgroundColor: 'rgba(0, 102, 204, 0.05)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(0, 102, 204, 0.8)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'VPN - Alternativa B',
                    data: valoresB,
                    borderColor: 'rgb(220, 53, 69)',
                    backgroundColor: 'rgba(220, 53, 69, 0.05)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(220, 53, 69, 0.8)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: { size: 12, weight: 'bold' },
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: `Análisis Comparativo de Sensibilidad`,
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return formatearMoneda(value);
                        }
                    }
                }
            }
        }
    });
}
