// ============================================================================
// HISTORY.JS - Gestión de Historial de Cálculos con LocalStorage
// ============================================================================

const STORAGE_KEY = 'financialEvalHistory';
const MAX_HISTORY_ITEMS = 20;

// ============================================================================
// 1. FUNCIÓN PARA GUARDAR CÁLCULO EN HISTORIAL
// ============================================================================

function guardarCalculoEnHistorial(datosA, datosB, resultadosA, resultadosB, comparacion, recomendacion) {
    try {
        // Obtener historial actual
        let historial = obtenerHistorial();
        
        // Función auxiliar para preparar datos de alternativa
        const prepararDatos = (datos) => {
            const datoPrepado = {
                inversionInicial: parseFloat(datos.inversionInicial),
                tasaDescuento: parseFloat(datos.tasaDescuento),
                vidaUtil: parseInt(datos.vidaUtil),
                valorSalvamento: parseFloat(datos.valorSalvamento),
                tipoFlujo: datos.tipoFlujo || 'fijo'
            };
            
            // Guardar flujos según el tipo
            if (datos.tipoFlujo === 'variable' && datos.flujosVariable) {
                datoPrepado.flujosVariable = datos.flujosVariable.map(f => parseFloat(f));
                datoPrepado.flujoEfectivo = null; // Explícitamente null para variables
            } else {
                datoPrepado.flujoEfectivo = parseFloat(datos.flujoEfectivo);
                datoPrepado.flujosVariable = null; // Explícitamente null para fijos
            }
            
            return datoPrepado;
        };
        
        // Crear nuevo elemento
        const nuevoCalculo = {
            id: Date.now(), // Timestamp como ID único
            fecha: new Date().toLocaleString('es-ES'),
            datosA: prepararDatos(datosA),
            datosB: prepararDatos(datosB),
            resultadosA: {
                vpn: parseFloat(resultadosA.vpn),
                cae: parseFloat(resultadosA.cae),
                tir: parseFloat(resultadosA.tir),
                valido: resultadosA.valido
            },
            resultadosB: {
                vpn: parseFloat(resultadosB.vpn),
                cae: parseFloat(resultadosB.cae),
                tir: parseFloat(resultadosB.tir),
                valido: resultadosB.valido
            },
            comparacion: {
                mejorVPN: comparacion.mejorVPN || 'N/A',
                mejorCAE: comparacion.mejorCAE || 'N/A',
                mejorTIR: comparacion.mejorTIR || 'N/A'
            },
            recomendacion: typeof recomendacion === 'string' ? recomendacion.substring(0, 500) : '' // Limitar tamaño
        };
        
        // Agregar al inicio del array
        historial.unshift(nuevoCalculo);
        
        // Limitar a MAX_HISTORY_ITEMS
        if (historial.length > MAX_HISTORY_ITEMS) {
            historial = historial.slice(0, MAX_HISTORY_ITEMS);
        }
        
        // Guardar en LocalStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
        
        console.log('Cálculo guardado en historial:', nuevoCalculo.id);
        return true;
    } catch (error) {
        console.error('Error al guardar en historial:', error);
        console.error('Detalles del error:', error.message);
        return false;
    }
}

// ============================================================================
// 2. FUNCIÓN PARA OBTENER TODO EL HISTORIAL
// ============================================================================

function obtenerHistorial() {
    try {
        const historialJSON = localStorage.getItem(STORAGE_KEY);
        return historialJSON ? JSON.parse(historialJSON) : [];
    } catch (error) {
        console.error('Error al obtener historial:', error);
        return [];
    }
}

// ============================================================================
// 3. FUNCIÓN PARA OBTENER UN CÁLCULO ESPECÍFICO DEL HISTORIAL
// ============================================================================

function obtenerCalculoDelHistorial(id) {
    const historial = obtenerHistorial();
    return historial.find(calculo => calculo.id === id);
}

// ============================================================================
// 4. FUNCIÓN PARA ELIMINAR UN CÁLCULO DEL HISTORIAL
// ============================================================================

function eliminarDelHistorial(id) {
    try {
        let historial = obtenerHistorial();
        historial = historial.filter(calculo => calculo.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
        console.log('Cálculo eliminado del historial:', id);
        return true;
    } catch (error) {
        console.error('Error al eliminar del historial:', error);
        return false;
    }
}

// ============================================================================
// 5. FUNCIÓN PARA LIMPIAR TODO EL HISTORIAL
// ============================================================================

function limpiarHistorial() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Historial limpiado');
        return true;
    } catch (error) {
        console.error('Error al limpiar historial:', error);
        return false;
    }
}

// ============================================================================
// 6. FUNCIÓN PARA MOSTRAR EL PANEL DE HISTORIAL
// ============================================================================

function mostrarPanelHistorial() {
    const panelHistorial = document.getElementById('panelHistorial');
    const listaHistorial = document.getElementById('listaHistorial');
    
    if (!panelHistorial) return;
    
    // Mostrar panel
    panelHistorial.style.display = panelHistorial.style.display === 'none' ? 'block' : 'none';
    
    // Cargar historial
    actualizarVistaHistorial();
}

// ============================================================================
// 7. FUNCIÓN PARA ACTUALIZAR LA VISTA DEL HISTORIAL
// ============================================================================

function actualizarVistaHistorial() {
    const listaHistorial = document.getElementById('listaHistorial');
    const historial = obtenerHistorial();
    
    if (!listaHistorial) return;
    
    // Limpiar lista anterior
    listaHistorial.innerHTML = '';
    
    if (historial.length === 0) {
        listaHistorial.innerHTML = '<p class="text-muted text-center py-3">No hay cálculos en el historial</p>';
        return;
    }
    
    // Crear elementos para cada cálculo
    historial.forEach((calculo, index) => {
        const fila = document.createElement('div');
        fila.className = 'history-item border-bottom py-3';
        fila.dataset.id = calculo.id;
        
        // Determinar la mejor alternativa
        const mejorAlternativa = calculo.comparacion.mejorVPN;
        
        // Indicadores de tipo de flujo
        const tipoFlujosA = calculo.datosA.tipoFlujo === 'variable' ? '📊 Variables' : '📈 Fijo';
        const tipoFlujosB = calculo.datosB.tipoFlujo === 'variable' ? '📊 Variables' : '📈 Fijo';
        const flujoBadge = tipoFlujosA !== tipoFlujosB ? 
            `A: ${tipoFlujosA} | B: ${tipoFlujosB}` : 
            tipoFlujosA;
        
        fila.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-6">
                    <small class="text-muted d-block">📅 ${calculo.fecha}</small>
                    <strong>Inversión A:</strong> ${formatearMoneda(calculo.datosA.inversionInicial)}<br>
                    <strong>Inversión B:</strong> ${formatearMoneda(calculo.datosB.inversionInicial)}<br>
                    <small class="text-muted d-block mt-1">Flujos: ${flujoBadge}</small>
                    <strong>Mejor:</strong> <span class="badge bg-success">Alt. ${mejorAlternativa}</span>
                </div>
                <div class="col-md-6 text-end">
                    <button class="btn btn-sm btn-primary me-2" onclick="cargarCalculoDelHistorial(${calculo.id})">
                        📂 Cargar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarDelHistorial(${calculo.id}); actualizarVistaHistorial()">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
        
        listaHistorial.appendChild(fila);
    });
}

// ============================================================================
// 8. FUNCIÓN PARA CARGAR UN CÁLCULO DEL HISTORIAL AL FORMULARIO
// ============================================================================

function cargarCalculoDelHistorial(id) {
    const calculo = obtenerCalculoDelHistorial(id);
    
    if (!calculo) {
        mostrarError('No se encontró el cálculo en el historial');
        return;
    }
    
    try {
        // Función auxiliar para cargar datos de alternativa
        const cargarDatosAlternativa = (datosHistorial, sufijo) => {
            // Cargar datos básicos
            document.getElementById(`inversion${sufijo}`).value = datosHistorial.inversionInicial;
            document.getElementById(`tasaDescuento${sufijo}`).value = datosHistorial.tasaDescuento;
            document.getElementById(`vidaUtil${sufijo}`).value = datosHistorial.vidaUtil;
            document.getElementById(`valorSalvamento${sufijo}`).value = datosHistorial.valorSalvamento;
            
            // Determinar tipo de flujo y cargarlo
            if (datosHistorial.tipoFlujo === 'variable' && datosHistorial.flujosVariable) {
                // Seleccionar flujo variable
                const radioVariable = document.getElementById(`flujoVariable${sufijo}`);
                if (radioVariable) {
                    radioVariable.checked = true;
                    // Trigger change event para mostrar tabla de flujos
                    radioVariable.dispatchEvent(new Event('change'));
                }
                
                // Cargar flujos variables
                setTimeout(() => {
                    const vidaUtil = datosHistorial.vidaUtil;
                    for (let año = 1; año <= vidaUtil; año++) {
                        const inputId = `flujoVariable${sufijo}_Año${año}`;
                        const input = document.getElementById(inputId);
                        if (input && datosHistorial.flujosVariable[año - 1] !== undefined) {
                            input.value = datosHistorial.flujosVariable[año - 1];
                        }
                    }
                }, 100);
            } else {
                // Seleccionar flujo fijo
                const radioFijo = document.getElementById(`flujoFijo${sufijo}`);
                if (radioFijo) {
                    radioFijo.checked = true;
                    // Trigger change event para ocultar tabla de flujos
                    radioFijo.dispatchEvent(new Event('change'));
                }
                
                // Cargar flujo fijo
                document.getElementById(`flujoEfectivo${sufijo}`).value = datosHistorial.flujoEfectivo;
            }
        };
        
        // Cargar datos de ambas alternativas
        cargarDatosAlternativa(calculo.datosA, 'A');
        cargarDatosAlternativa(calculo.datosB, 'B');
        
        // Hacer scroll hacia el formulario
        document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
        
        // Cerrar panel de historial
        document.getElementById('panelHistorial').style.display = 'none';
        
        // Mostrar alerta de éxito
        mostrarAlertaExito('Cálculo cargado del historial');
    } catch (error) {
        console.error('Error al cargar cálculo:', error);
        mostrarError('Error al cargar el cálculo del historial');
    }
}

// ============================================================================
// 9. FUNCIÓN PARA MOSTRAR ALERTA DE ÉXITO
// ============================================================================

function mostrarAlertaExito(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success alert-dismissible fade show position-fixed';
    alerta.style.top = '100px';
    alerta.style.right = '20px';
    alerta.style.zIndex = '9999';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alerta);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

// ============================================================================
// 10. INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Actualizar vista del historial al cargar
    actualizarVistaHistorial();
});
