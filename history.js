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
        
        // Crear nuevo elemento
        const nuevoCalculo = {
            id: Date.now(), // Timestamp como ID único
            fecha: new Date().toLocaleString('es-ES'),
            datosA: {
                inversionInicial: parseFloat(datosA.inversionInicial),
                tasaDescuento: parseFloat(datosA.tasaDescuento),
                vidaUtil: parseInt(datosA.vidaUtil),
                flujoEfectivo: parseFloat(datosA.flujoEfectivo),
                valorSalvamento: parseFloat(datosA.valorSalvamento)
            },
            datosB: {
                inversionInicial: parseFloat(datosB.inversionInicial),
                tasaDescuento: parseFloat(datosB.tasaDescuento),
                vidaUtil: parseInt(datosB.vidaUtil),
                flujoEfectivo: parseFloat(datosB.flujoEfectivo),
                valorSalvamento: parseFloat(datosB.valorSalvamento)
            },
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
        
        fila.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-6">
                    <small class="text-muted d-block">📅 ${calculo.fecha}</small>
                    <strong>Inversión A:</strong> ${formatearMoneda(calculo.datosA.inversionInicial)}<br>
                    <strong>Inversión B:</strong> ${formatearMoneda(calculo.datosB.inversionInicial)}<br>
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
        // Cargar datos en el formulario
        document.getElementById('inversionA').value = calculo.datosA.inversionInicial;
        document.getElementById('tasaDescuentoA').value = calculo.datosA.tasaDescuento;
        document.getElementById('vidaUtilA').value = calculo.datosA.vidaUtil;
        document.getElementById('flujoEfectivoA').value = calculo.datosA.flujoEfectivo;
        document.getElementById('valorSalvamentoA').value = calculo.datosA.valorSalvamento;
        
        document.getElementById('inversionB').value = calculo.datosB.inversionInicial;
        document.getElementById('tasaDescuentoB').value = calculo.datosB.tasaDescuento;
        document.getElementById('vidaUtilB').value = calculo.datosB.vidaUtil;
        document.getElementById('flujoEfectivoB').value = calculo.datosB.flujoEfectivo;
        document.getElementById('valorSalvamentoB').value = calculo.datosB.valorSalvamento;
        
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
