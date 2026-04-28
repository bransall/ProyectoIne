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
 * @param {string} alternativa - 'A' o 'B'
 * @returns {object} Objeto con los datos
 */
function obtenerDatos(alternativa) {
    const sufijo = alternativa;
    return {
        inversion: document.getElementById(`inversion${sufijo}`).value,
        tasa: document.getElementById(`tasaDescuento${sufijo}`).value,
        vidaUtil: document.getElementById(`vidaUtil${sufijo}`).value,
        flujoEfectivo: document.getElementById(`flujoEfectivo${sufijo}`).value,
        valorSalvamento: document.getElementById(`valorSalvamento${sufijo}`).value
    };
}

/**
 * Muestra un mensaje de error en la alerta
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarError(mensaje) {
    const alerta = document.getElementById('alertaError');
    const mensajeParagrafo = document.getElementById('mensajeError');
    
    mensajeParagrafo.textContent = mensaje;
    alerta.style.display = 'block';
    
    // Auto-cerrar después de 6 segundos
    setTimeout(() => {
        alerta.style.display = 'none';
    }, 6000);
}

/**
 * Oculta la alerta de error
 */
function ocultarError() {
    document.getElementById('alertaError').style.display = 'none';
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
        
        // Convertir a números
        datosAlternativaA = {
            inversionInicial: parseFloat(datosAlternativaA.inversion),
            tasaDescuento: parseFloat(datosAlternativaA.tasa),
            vidaUtil: parseInt(datosAlternativaA.vidaUtil),
            flujoEfectivo: parseFloat(datosAlternativaA.flujoEfectivo),
            valorSalvamento: parseFloat(datosAlternativaA.valorSalvamento)
        };
        
        datosAlternativaB = {
            inversionInicial: parseFloat(datosAlternativaB.inversion),
            tasaDescuento: parseFloat(datosAlternativaB.tasa),
            vidaUtil: parseInt(datosAlternativaB.vidaUtil),
            flujoEfectivo: parseFloat(datosAlternativaB.flujoEfectivo),
            valorSalvamento: parseFloat(datosAlternativaB.valorSalvamento)
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
            metodosSeleccionados
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
    document.getElementById('flujoA-resumen').textContent = formatearMoneda(datosAlternativaA.flujoEfectivo);
    document.getElementById('salvA-resumen').textContent = formatearMoneda(datosAlternativaA.valorSalvamento);
    
    // Datos de entrada resumen - Alternativa B
    document.getElementById('invB-resumen').textContent = formatearMoneda(datosAlternativaB.inversionInicial);
    document.getElementById('tasaB-resumen').textContent = formatearNumero(datosAlternativaB.tasaDescuento);
    document.getElementById('vidaB-resumen').textContent = datosAlternativaB.vidaUtil;
    document.getElementById('flujoB-resumen').textContent = formatearMoneda(datosAlternativaB.flujoEfectivo);
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
        
        const resultado = generarReportePDF(
            datosAlternativaA,
            datosAlternativaB,
            resultadosAlternativaA,
            resultadosAlternativaB,
            datosComparacion.comparacion,
            datosComparacion.recomendacion
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
