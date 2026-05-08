/* ================================
   MAIN.JS - Integración e Interactividad Principal
   ================================ */

// Variables globales para almacenar resultados
let datosAlternativaA = null;
let datosAlternativaB = null;
let resultadosAlternativaA = null;
let resultadosAlternativaB = null;
let datosComparacion = null;

/**
 * Obtiene los métodos seleccionados por el usuario
 * @returns {object} Objeto con booleanos para cada método
 */
function obtenerMetodosSeleccionados() {
    return {
        vpn: document.getElementById('metodoVPN').checked,
        cae: document.getElementById('metodoCAE').checked,
        tir: document.getElementById('metodoTIR').checked
    };
}

/**
 * Valida que al menos un método esté seleccionado
 * @returns {boolean} true si hay al menos un método seleccionado
 */
function validarMetodosSeleccionados() {
    const metodos = obtenerMetodosSeleccionados();
    return metodos.vpn || metodos.cae || metodos.tir;
}

/**
 * Selecciona todos los métodos
 */
function seleccionarTodos() {
    document.getElementById('metodoVPN').checked = true;
    document.getElementById('metodoCAE').checked = true;
    document.getElementById('metodoTIR').checked = true;
}

/**
 * Deselecciona todos los métodos (pero valida al menos uno)
 */
function deseleccionarTodos() {
    const metodos = obtenerMetodosSeleccionados();
    const metodoActivos = Object.values(metodos).filter(v => v).length;
    
    // Si todos están deseleccionados, mostrar error
    if (metodoActivos === 1) {
        mostrarError("Debe seleccionar al menos un método de evaluación");
        return;
    }
    
    document.getElementById('metodoVPN').checked = false;
    document.getElementById('metodoCAE').checked = false;
    document.getElementById('metodoTIR').checked = false;
}

/**
 * Obtiene los datos del formulario para una alternativa
 * Soporta tanto flujos fijos como variables
 * @param {string} alternativa - 'A' o 'B'
 * @returns {object} Objeto con los datos
 */
function obtenerDatos(alternativa) {
    const tipoFlujo = obtenerTipoFlujo(alternativa);
    const sufijo = alternativa;
    
    // Siempre obtener el valor del campo, incluso si no se va a usar
    const flujoEfectivoRaw = document.getElementById(`flujoEfectivo${sufijo}`).value;
    
    const datos = {
        inversion: document.getElementById(`inversion${sufijo}`).value,
        tasa: document.getElementById(`tasaDescuento${sufijo}`).value,
        vidaUtil: document.getElementById(`vidaUtil${sufijo}`).value,
        valorSalvamento: document.getElementById(`valorSalvamento${sufijo}`).value,
        tipoFlujo: tipoFlujo
    };
    
    // Obtener flujo según el tipo
    if (tipoFlujo === 'variable') {
        datos.flujosVariable = obtenerFlujosVariable(alternativa);
        // Para flujos variables, no incluir flujoEfectivo o setearlo a null
        datos.flujoEfectivo = null;
    } else {
        // Para flujos fijos, usar el valor del campo
        datos.flujoEfectivo = flujoEfectivoRaw || '';
        datos.flujosVariable = null;
    }
    
    return datos;
}

/**
 * Muestra un mensaje de error en un modal elegante
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarError(mensaje) {
    const modal = document.getElementById('modalError');
    const overlay = document.getElementById('overlayError');
    const mensajeParagrafo = document.getElementById('mensajeErrorModal');
    
    mensajeParagrafo.textContent = mensaje;
    modal.classList.add('show');
    overlay.classList.add('show');
    modal.style.display = 'block';
    overlay.style.display = 'block';
}

/**
 * Oculta el modal de error
 */
function cerrarModalError() {
    const modal = document.getElementById('modalError');
    const overlay = document.getElementById('overlayError');
    
    modal.classList.remove('show');
    overlay.classList.remove('show');
    
    // Esperar a que termine la animación antes de ocultar
    setTimeout(() => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
}

/**
 * Oculta la alerta de error (compatibilidad con código anterior)
 */
function ocultarError() {
    cerrarModalError();
}

/**
 * Redondea un número a 2 decimales
 * @param {number} valor - Valor a redondear
 * @returns {number} Valor redondeado
 */
function redondear(valor) {
    return Math.round(valor * 100) / 100;
}

/**
 * Calcula los resultados para ambas alternativas y muestra los resultados
 */
function calcularResultados() {
    ocultarError();
    
    try {
        // Validar que al menos un método esté seleccionado
        if (!validarMetodosSeleccionados()) {
            mostrarError("Debe seleccionar al menos un método de evaluación (VPN, CAE o TIR)");
            return;
        }
        
        // Obtener datos del formulario
        datosAlternativaA = obtenerDatos('A');
        datosAlternativaB = obtenerDatos('B');
        
        // Validar datos
        const validacionA = validarDatos(datosAlternativaA);
        if (!validacionA.valido) {
            mostrarError('Alternativa A - ' + validacionA.mensaje);
            return;
        }
        
        const validacionB = validarDatos(datosAlternativaB);
        if (!validacionB.valido) {
            mostrarError('Alternativa B - ' + validacionB.mensaje);
            return;
        }
        
        // Convertir a números y preparar datos para cálculo
        datosAlternativaA = {
            inversionInicial: parseFloat(datosAlternativaA.inversion),
            tasaDescuento: parseFloat(datosAlternativaA.tasa),
            vidaUtil: parseInt(datosAlternativaA.vidaUtil),
            valorSalvamento: parseFloat(datosAlternativaA.valorSalvamento),
            tipoFlujo: datosAlternativaA.tipoFlujo,
            flujoEfectivo: datosAlternativaA.tipoFlujo === 'fijo' ? parseFloat(datosAlternativaA.flujoEfectivo) : null,
            flujosVariable: datosAlternativaA.tipoFlujo === 'variable' ? datosAlternativaA.flujosVariable.map(f => parseFloat(f)) : null
        };
        
        datosAlternativaB = {
            inversionInicial: parseFloat(datosAlternativaB.inversion),
            tasaDescuento: parseFloat(datosAlternativaB.tasa),
            vidaUtil: parseInt(datosAlternativaB.vidaUtil),
            valorSalvamento: parseFloat(datosAlternativaB.valorSalvamento),
            tipoFlujo: datosAlternativaB.tipoFlujo,
            flujoEfectivo: datosAlternativaB.tipoFlujo === 'fijo' ? parseFloat(datosAlternativaB.flujoEfectivo) : null,
            flujosVariable: datosAlternativaB.tipoFlujo === 'variable' ? datosAlternativaB.flujosVariable.map(f => parseFloat(f)) : null
        };
        
        // Calcular resultados
        resultadosAlternativaA = calcularAlternativa(datosAlternativaA);
        if (!resultadosAlternativaA.valido) {
            mostrarError('Error en cálculos de Alternativa A: ' + resultadosAlternativaA.error);
            return;
        }
        
        resultadosAlternativaB = calcularAlternativa(datosAlternativaB);
        if (!resultadosAlternativaB.valido) {
            mostrarError('Error en cálculos de Alternativa B: ' + resultadosAlternativaB.error);
            return;
        }
        
        // Comparar alternativas
        const metodosSeleccionados = obtenerMetodosSeleccionados();
        datosComparacion = compararAlternativas(
            resultadosAlternativaA,
            resultadosAlternativaB,
            datosAlternativaA.vidaUtil,
            datosAlternativaB.vidaUtil,
            metodosSeleccionados,
            datosAlternativaA.tasaDescuento,
            datosAlternativaB.tasaDescuento
        );
        
        // Guardar en historial
        guardarCalculoEnHistorial(
            datosAlternativaA,
            datosAlternativaB,
            resultadosAlternativaA,
            resultadosAlternativaB,
            datosComparacion.comparacion,
            datosComparacion.recomendacion
        );
        
        // Mostrar resultados
        mostrarResultados();
        
        // Habilitar botones de descarga
        document.getElementById('btnPDF').disabled = false;
        document.getElementById('btnExcel').disabled = false;
        
    } catch (error) {
        console.error("Error en calcularResultados:", error);
        mostrarError("Error inesperado: " + error.message);
    }
}

/**
 * Muestra los resultados en la tabla y sección de resultados
 */
function mostrarResultados() {
    // Obtener métodos seleccionados
    const metodos = obtenerMetodosSeleccionados();
    
    // Mostrar sección de resultados
    const seccionResultados = document.getElementById('seccionResultados');
    seccionResultados.style.display = 'block';
    
    // Crear gráficos de resultados
    actualizarGraficos(resultadosAlternativaA, resultadosAlternativaB, metodos);
    
    // Scroll hacia los resultados
    setTimeout(() => {
        seccionResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // VPN
    const filaVPN = document.getElementById('filaVPN');
    if (metodos.vpn) {
        filaVPN.style.display = '';
        document.getElementById('vpnA').textContent = formatearMoneda(resultadosAlternativaA.vpn);
        document.getElementById('vpnB').textContent = formatearMoneda(resultadosAlternativaB.vpn);
        
        let mejorVPNElem = document.getElementById('mejorVPN');
        mejorVPNElem.textContent = datosComparacion.comparacion.mejorVPN;
        mejorVPNElem.className = 'text-center text-success fw-bold highlight-green';
    } else {
        filaVPN.style.display = 'none';
    }
    
    // CAE
    const filaCAE = document.getElementById('filaCAE');
    if (metodos.cae) {
        filaCAE.style.display = '';
        document.getElementById('caeA').textContent = formatearMoneda(resultadosAlternativaA.cae);
        document.getElementById('caeB').textContent = formatearMoneda(resultadosAlternativaB.cae);
        
        let mejorCAEElem = document.getElementById('mejorCAE');
        mejorCAEElem.textContent = datosComparacion.comparacion.mejorCAE;
        mejorCAEElem.className = 'text-center text-success fw-bold highlight-green';
    } else {
        filaCAE.style.display = 'none';
    }
    
    // TIR
    const filaTIR = document.getElementById('filaTIR');
    if (metodos.tir) {
        filaTIR.style.display = '';
        document.getElementById('tirA').textContent = formatearPorcentaje(resultadosAlternativaA.tir);
        document.getElementById('tirB').textContent = formatearPorcentaje(resultadosAlternativaB.tir);
        
        let mejorTIRElem = document.getElementById('mejorTIR');
        mejorTIRElem.textContent = datosComparacion.comparacion.mejorTIR;
        mejorTIRElem.className = 'text-center text-success fw-bold highlight-green';
    } else {
        filaTIR.style.display = 'none';
    }
    
    // Datos de entrada resumen - Alternativa A
    document.getElementById('invA-resumen').textContent = formatearMoneda(datosAlternativaA.inversionInicial);
    document.getElementById('tasaA-resumen').textContent = formatearNumero(datosAlternativaA.tasaDescuento);
    document.getElementById('vidaA-resumen').textContent = datosAlternativaA.vidaUtil;
    
    // Mostrar flujo según tipo
    if (datosAlternativaA.tipoFlujo === 'variable') {
        const flujosTexto = datosAlternativaA.flujosVariable.map((f, i) => `Año ${i+1}: ${formatearMoneda(f)}`).join(' | ');
        document.getElementById('flujoA-resumen').textContent = `Variable: ${flujosTexto}`;
    } else {
        document.getElementById('flujoA-resumen').textContent = formatearMoneda(datosAlternativaA.flujoEfectivo);
    }
    document.getElementById('salvA-resumen').textContent = formatearMoneda(datosAlternativaA.valorSalvamento);
    
    // Datos de entrada resumen - Alternativa B
    document.getElementById('invB-resumen').textContent = formatearMoneda(datosAlternativaB.inversionInicial);
    document.getElementById('tasaB-resumen').textContent = formatearNumero(datosAlternativaB.tasaDescuento);
    document.getElementById('vidaB-resumen').textContent = datosAlternativaB.vidaUtil;
    
    // Mostrar flujo según tipo
    if (datosAlternativaB.tipoFlujo === 'variable') {
        const flujosTexto = datosAlternativaB.flujosVariable.map((f, i) => `Año ${i+1}: ${formatearMoneda(f)}`).join(' | ');
        document.getElementById('flujoB-resumen').textContent = `Variable: ${flujosTexto}`;
    } else {
        document.getElementById('flujoB-resumen').textContent = formatearMoneda(datosAlternativaB.flujoEfectivo);
    }
    document.getElementById('salvB-resumen').textContent = formatearMoneda(datosAlternativaB.valorSalvamento);
    
    // Recomendación (usar innerHTML para permitir etiquetas HTML)
    document.getElementById('recomendacion').innerHTML = datosComparacion.recomendacion;
    
    // Análisis comparativo avanzado
    if (typeof actualizarAnalisisAvanzado === 'function') {
        actualizarAnalisisAvanzado(datosAlternativaA, datosAlternativaB, resultadosAlternativaA, resultadosAlternativaB);
    }
}

/**
 * Limpia el formulario y los resultados
 */
function limpiarFormulario() {
    // Limpiar campos de entrada
    const campos = [
        'inversionA', 'tasaDescuentoA', 'vidaUtilA', 'flujoEfectivoA', 'valorSalvamentoA',
        'inversionB', 'tasaDescuentoB', 'vidaUtilB', 'flujoEfectivoB', 'valorSalvamentoB'
    ];
    
    campos.forEach(id => {
        document.getElementById(id).value = '';
    });
    
    // Resetear selectores de flujo a "Flujo Fijo" (por defecto)
    document.getElementById('flujoFijoA').checked = true;
    document.getElementById('flujoFijoB').checked = true;
    
    // Mostrar contenedores de flujo fijo y ocultar variables
    document.getElementById('contenedorFlujoFijoA').style.display = 'block';
    document.getElementById('contenedorFlujosVariablesA').style.display = 'none';
    document.getElementById('contenedorFlujoFijoB').style.display = 'block';
    document.getElementById('contenedorFlujosVariablesB').style.display = 'none';
    
    // Limpiar tablas de flujos variables
    document.getElementById('tablaFlujosVariablesA').innerHTML = '<p class="text-muted text-center py-2">Ingresa primero la vida útil</p>';
    document.getElementById('tablaFlujosVariablesB').innerHTML = '<p class="text-muted text-center py-2">Ingresa primero la vida útil</p>';
    
    // Resetear métodos a valores por defecto (todos seleccionados)
    seleccionarTodos();
    
    // Ocultar resultados
    document.getElementById('seccionResultados').style.display = 'none';
    
    // Limpiar gráficos
    limpiarGraficos();
    
    // Deshabilitar botón de PDF
    document.getElementById('btnPDF').disabled = true;
    
    // Ocultar error si está visible
    ocultarError();
    
    // Limpiar variables globales
    datosAlternativaA = null;
    datosAlternativaB = null;
    resultadosAlternativaA = null;
    resultadosAlternativaB = null;
    datosComparacion = null;
}

/**
 * Genera y descarga el PDF con los resultados
 */
function generarPDF() {
    try {
        if (!resultadosAlternativaA || !resultadosAlternativaB || !datosComparacion) {
            mostrarError("No hay datos para generar el PDF. Primero calcula los resultados.");
            return;
        }
        
        // Obtener los métodos seleccionados
        const metodosSeleccionados = obtenerMetodosSeleccionados();
        
        const resultado = generarReportePDF(
            datosAlternativaA,
            datosAlternativaB,
            resultadosAlternativaA,
            resultadosAlternativaB,
            datosComparacion.comparacion,
            datosComparacion.recomendacion,
            metodosSeleccionados
        );
        
        if (!resultado.exito) {
            mostrarError("Error al generar PDF: " + resultado.mensaje);
        } else {
            console.log(resultado.mensaje);
            // Mostrar alerta de éxito (Bootstrap)
            mostrarAlertaExito("PDF generado y descargado exitosamente");
        }
    } catch (error) {
        console.error("Error en generarPDF:", error);
        mostrarError("Error al generar PDF: " + error.message);
    }
}

/**
 * Muestra una alerta de éxito temporal
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarAlertaExito(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success alert-dismissible fade show position-fixed';
    alerta.style.top = '70px';
    alerta.style.right = '20px';
    alerta.style.zIndex = '9999';
    alerta.style.minWidth = '300px';
    alerta.innerHTML = `
        <strong>Éxito:</strong> ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alerta);
    
    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
        alerta.remove();
    }, 4000);
}

/**
 * Obtiene el tipo de flujo seleccionado para una alternativa
 * @param {string} alternativa - 'A' o 'B'
 * @returns {string} 'fijo' o 'variable'
 */
function obtenerTipoFlujo(alternativa) {
    const radioFijo = document.getElementById(`flujoFijo${alternativa}`);
    const radioVariable = document.getElementById(`flujoVariable${alternativa}`);
    
    if (radioVariable && radioVariable.checked) {
        return 'variable';
    }
    return 'fijo';
}

/**
 * Alterna entre flujo fijo y variable para Alternativa A
 */
function toggleFlujosVariablesA() {
    const tipoFlujo = obtenerTipoFlujo('A');
    const contenedorFijo = document.getElementById('contenedorFlujoFijoA');
    const contenedorVariable = document.getElementById('contenedorFlujosVariablesA');
    
    if (tipoFlujo === 'variable') {
        contenedorFijo.style.display = 'none';
        contenedorVariable.style.display = 'block';
        actualizarTablasFlujosVariable('A');
    } else {
        contenedorFijo.style.display = 'block';
        contenedorVariable.style.display = 'none';
    }
}

/**
 * Alterna entre flujo fijo y variable para Alternativa B
 */
function toggleFlujosVariablesB() {
    const tipoFlujo = obtenerTipoFlujo('B');
    const contenedorFijo = document.getElementById('contenedorFlujoFijoB');
    const contenedorVariable = document.getElementById('contenedorFlujosVariablesB');
    
    if (tipoFlujo === 'variable') {
        contenedorFijo.style.display = 'none';
        contenedorVariable.style.display = 'block';
        actualizarTablasFlujosVariable('B');
    } else {
        contenedorFijo.style.display = 'block';
        contenedorVariable.style.display = 'none';
    }
}

/**
 * Actualiza la tabla de flujos variables cuando cambia la vida útil
 * @param {string} alternativa - 'A' o 'B'
 */
function actualizarTablasFlujosVariable(alternativa) {
    const vidaUtil = parseInt(document.getElementById(`vidaUtil${alternativa}`).value) || 0;
    const contenedor = document.getElementById(`tablaFlujosVariables${alternativa}`);
    
    if (vidaUtil <= 0) {
        contenedor.innerHTML = '<p class="text-muted text-center py-2">Ingresa una vida útil válida (mayor a 0)</p>';
        return;
    }
    
    // Crear tabla de entrada de flujos
    let html = '<table class="table table-sm table-bordered mb-0"><tbody>';
    
    for (let año = 1; año <= vidaUtil; año++) {
        const inputId = `flujoVariable${alternativa}_Año${año}`;
        const valorActual = document.getElementById(inputId)?.value || '';
        
        html += `
            <tr>
                <td style="width: 40%; font-weight: bold;">Año ${año}:</td>
                <td style="width: 60%;">
                    <input type="number" class="form-control form-control-sm" id="${inputId}" 
                           placeholder="0.00" step="0.01" value="${valorActual}">
                </td>
            </tr>
        `;
    }
    
    html += '</tbody></table>';
    contenedor.innerHTML = html;
}

/**
 * Obtiene los flujos variables para una alternativa
 * @param {string} alternativa - 'A' o 'B'
 * @returns {array} Array de flujos por año
 */
function obtenerFlujosVariable(alternativa) {
    const vidaUtil = parseInt(document.getElementById(`vidaUtil${alternativa}`).value) || 0;
    const flujos = [];
    
    for (let año = 1; año <= vidaUtil; año++) {
        const inputId = `flujoVariable${alternativa}_Año${año}`;
        const valor = parseFloat(document.getElementById(inputId)?.value || 0);
        flujos.push(valor);
    }
    
    return flujos;
}

/**
 * Habilita validación en tiempo real para campos de entrada
 */
function habilitarValidacionTiempoReal() {
    const campos = document.querySelectorAll('.form-control');
    
    campos.forEach(campo => {
        campo.addEventListener('focus', function() {
            ocultarError();
        });
        
        // Validación de números
        campo.addEventListener('change', function() {
            const valor = this.value;
            
            // Permitir campos vacíos (serán validados al calcular)
            if (valor === '') return;
            
            // Verificar que sea un número válido
            if (isNaN(parseFloat(valor))) {
                this.classList.add('is-invalid');
                mostrarError(`"${valor}" no es un número válido.`);
            } else {
                this.classList.remove('is-invalid');
            }
        });
    });
}

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicación de Evaluación Financiera cargada');
    
    // Habilitar validación en tiempo real
    habilitarValidacionTiempoReal();
    
    // Agregar validación a los checkboxes de métodos
    const checkboxMetodos = [
        document.getElementById('metodoVPN'),
        document.getElementById('metodoCAE'),
        document.getElementById('metodoTIR')
    ];
    
    checkboxMetodos.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Validar que al menos uno esté seleccionado
            const metodos = obtenerMetodosSeleccionados();
            const metodoActivos = Object.values(metodos).filter(v => v).length;
            
            if (metodoActivos === 0) {
                this.checked = true;
                mostrarError("Debe seleccionar al menos un método de evaluación");
            }
        });
    });
    
    // Permitir Enter en los campos para calcular
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.classList.contains('form-control')) {
            calcularResultados();
        }
    });
});
