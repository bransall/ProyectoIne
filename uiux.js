/**
 * ============================================
 * MEJORAS DE UX/UI Y ACCESIBILIDAD
 * ============================================
 * Atajos de teclado, validaciones mejoradas,
 * tooltips y mejoras de accesibilidad
 */

/**
 * Inicializa los atajos de teclado globales
 */
function inicializarAtajosKeyboard() {
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + Enter = Calcular
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            calcularResultados();
        }
        
        // Alt + L = Limpiar
        if (event.altKey && event.key === 'l') {
            event.preventDefault();
            limpiarFormulario();
        }
        
        // Alt + H = Historial
        if (event.altKey && event.key === 'h') {
            event.preventDefault();
            mostrarPanelHistorial();
        }
        
        // Alt + S = Sensibilidad
        if (event.altKey && event.key === 's') {
            event.preventDefault();
            const boton = document.querySelector('[onclick="mostrarAnalisisSensibilidad()"]');
            if (boton) boton.click();
        }
        
        // Alt + E = Descargar Excel
        if (event.altKey && event.key === 'e') {
            event.preventDefault();
            const boton = document.querySelector('[onclick="generarExcel()"]');
            if (boton) boton.click();
        }
        
        // ? = Mostrar ayuda
        if (event.key === '?') {
            event.preventDefault();
            mostrarAyudaAtajos();
        }
    });
}

/**
 * Muestra un modal con los atajos de teclado disponibles
 */
function mostrarAyudaAtajos() {
    const ayuda = `
    <div class="ayuda-atajos-modal">
        <div class="ayuda-atajos-content">
            <button class="btn-cerrar" onclick="cerrarAyudaAtajos()">×</button>
            <h3>⌨️ Atajos de Teclado Disponibles</h3>
            <table class="tabla-atajos">
                <tr>
                    <td class="atajo-tecla">Ctrl/Cmd + Enter</td>
                    <td class="atajo-desc">Calcular resultados</td>
                </tr>
                <tr>
                    <td class="atajo-tecla">Alt + L</td>
                    <td class="atajo-desc">Limpiar formulario</td>
                </tr>
                <tr>
                    <td class="atajo-tecla">Alt + H</td>
                    <td class="atajo-desc">Abrir historial</td>
                </tr>
                <tr>
                    <td class="atajo-tecla">Alt + S</td>
                    <td class="atajo-desc">Análisis de sensibilidad</td>
                </tr>
                <tr>
                    <td class="atajo-tecla">Alt + E</td>
                    <td class="atajo-desc">Descargar Excel</td>
                </tr>
                <tr>
                    <td class="atajo-tecla">?</td>
                    <td class="atajo-desc">Mostrar esta ayuda</td>
                </tr>
            </table>
        </div>
    </div>
    `;
    
    // Crear elemento modal
    const modal = document.createElement('div');
    modal.id = 'ayudaAtajosModal';
    modal.innerHTML = ayuda;
    modal.classList.add('modal-overlay');
    document.body.appendChild(modal);
    
    // Cerrar al hacer click fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarAyudaAtajos();
        }
    });
}

/**
 * Cierra el modal de ayuda
 */
function cerrarAyudaAtajos() {
    const modal = document.getElementById('ayudaAtajosModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Valida todos los campos del formulario
 * @returns {Object} Objeto con validaciones y errores
 */
function validarFormularioCompleto() {
    const campos = [
        { id: 'inversionA', nombre: 'Inversión A', min: 0, requerido: true },
        { id: 'tasaDescuentoA', nombre: 'Tasa A', min: 0, max: 100, requerido: true },
        { id: 'vidaUtilA', nombre: 'Vida Útil A', min: 1, requerido: true },
        { id: 'flujoEfectivoA', nombre: 'Flujo A', min: 0, requerido: true },
        { id: 'valorSalvamentoA', nombre: 'Salvamento A', min: 0, requerido: false },
        { id: 'inversionB', nombre: 'Inversión B', min: 0, requerido: true },
        { id: 'tasaDescuentoB', nombre: 'Tasa B', min: 0, max: 100, requerido: true },
        { id: 'vidaUtilB', nombre: 'Vida Útil B', min: 1, requerido: true },
        { id: 'flujoEfectivoB', nombre: 'Flujo B', min: 0, requerido: true },
        { id: 'valorSalvamentoB', nombre: 'Salvamento B', min: 0, requerido: false }
    ];
    
    const errores = [];
    const validaciones = {};
    
    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        const valor = parseFloat(elemento.value);
        
        validaciones[campo.id] = true;
        
        if (campo.requerido && (elemento.value === '' || isNaN(valor))) {
            errores.push(`${campo.nombre} es requerido`);
            validaciones[campo.id] = false;
            elemento.classList.add('campo-error');
        } else if (!isNaN(valor)) {
            if (campo.min !== undefined && valor < campo.min) {
                errores.push(`${campo.nombre} debe ser >= ${campo.min}`);
                validaciones[campo.id] = false;
                elemento.classList.add('campo-error');
            }
            if (campo.max !== undefined && valor > campo.max) {
                errores.push(`${campo.nombre} debe ser <= ${campo.max}`);
                validaciones[campo.id] = false;
                elemento.classList.add('campo-error');
            }
            
            if (validaciones[campo.id]) {
                elemento.classList.remove('campo-error');
            }
        }
    });
    
    // Validación especial: al menos un método debe estar seleccionado
    const metodos = obtenerMetodosSeleccionados();
    if (!metodos.vpn && !metodos.cae && !metodos.tir) {
        errores.push('Debe seleccionar al menos un método de evaluación');
    }
    
    return {
        valido: errores.length === 0,
        errores,
        validaciones
    };
}

/**
 * Muestra errores de validación en el modal elegante
 */
function mostrarErroresValidacion(resultadoValidacion) {
    if (resultadoValidacion.errores.length === 0) {
        return;
    }
    
    // Formatear los errores para mostrar
    const listaErrores = resultadoValidacion.errores
        .map(error => `• ${error}`)
        .join('\n');
    
    const mensajeCompleto = `Errores de Validación:\n\n${listaErrores}`;
    
    // Usar el modal elegante
    mostrarError(mensajeCompleto);
}

/**
 * Agrega tooltips a elementos
 */
function inicializarTooltips() {
    const tooltips = [
        { selector: '[aria-label*="Inversión"]', texto: 'Cantidad total de dinero invertido al inicio del proyecto' },
        { selector: '[aria-label*="Tasa"]', texto: 'Tasa de descuento anual para actualizar flujos (en porcentaje)' },
        { selector: '[aria-label*="Vida"]', texto: 'Número de años que durará el proyecto' },
        { selector: '[aria-label*="Flujo"]', texto: 'Ingreso neto anual esperado durante la vida del proyecto' },
        { selector: '[aria-label*="Salvamento"]', texto: 'Valor residual del proyecto al final de su vida útil' }
    ];
    
    tooltips.forEach(tooltip => {
        const elementos = document.querySelectorAll(tooltip.selector);
        elementos.forEach(elemento => {
            elemento.setAttribute('data-tooltip', tooltip.texto);
            elemento.setAttribute('title', tooltip.texto);
            elemento.classList.add('tiene-tooltip');
        });
    });
}

/**
 * Mejora la accesibilidad añadiendo labels y aria attributes
 */
function mejorarAccesibilidad() {
    // Agregar role y aria-labels a botones
    document.querySelectorAll('button').forEach(btn => {
        if (!btn.getAttribute('aria-label')) {
            const texto = btn.textContent.trim();
            btn.setAttribute('aria-label', texto);
        }
    });
    
    // Agregar aria-label a inputs
    document.querySelectorAll('input[type="number"]').forEach(input => {
        if (!input.getAttribute('aria-label')) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                input.setAttribute('aria-label', label.textContent);
            }
        }
    });
    
    // Agregar aria-describedby a campos de formulario
    document.querySelectorAll('.form-control').forEach(input => {
        input.setAttribute('aria-describedby', input.id + '-help');
    });
}

/**
 * Agrega indicadores visuales de campo completado
 */
function inicializarIndicadoresCompletitud() {
    const campos = document.querySelectorAll('input[type="number"]');
    
    campos.forEach(campo => {
        campo.addEventListener('change', function() {
            const valor = parseFloat(this.value);
            if (!isNaN(valor) && valor >= 0) {
                this.classList.add('campo-completado');
            } else {
                this.classList.remove('campo-completado');
            }
        });
        
        // Disparar en carga si tiene valor
        if (campo.value !== '') {
            campo.dispatchEvent(new Event('change'));
        }
    });
}

/**
 * Muestra un indicador de progreso visual en el formulario
 */
function actualizarIndicadorProgreso() {
    const campos = document.querySelectorAll('input[type="number"]');
    const camposCompletados = Array.from(campos).filter(c => {
        const valor = parseFloat(c.value);
        return !isNaN(valor) && valor >= 0;
    }).length;
    
    const porcentaje = (camposCompletados / campos.length) * 100;
    
    let indicador = document.getElementById('indicadorProgreso');
    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'indicadorProgreso';
        indicador.className = 'progreso-formulario';
        document.querySelector('[class*="form-label"]').parentElement.parentElement.insertBefore(
            indicador,
            document.querySelector('[class*="form-label"]').parentElement.parentElement.firstChild
        );
    }
    
    indicador.innerHTML = `
        <div class="progreso-label">Formulario: ${camposCompletados}/${campos.length} campos</div>
        <div class="progreso-bar">
            <div class="progreso-fill" style="width: ${porcentaje}%"></div>
        </div>
    `;
}

/**
 * Inicializa todas las mejoras de UX/UI
 */
function inicializarMejorasUIUX() {
    // Ejecutar mejoras
    inicializarAtajosKeyboard();
    inicializarTooltips();
    mejorarAccesibilidad();
    inicializarIndicadoresCompletitud();
    
    // Agregar listeners para campos
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', actualizarIndicadorProgreso);
        input.addEventListener('change', function() {
            // Limpiar errores al corregir
            if (this.classList.contains('campo-error')) {
                const validacion = validarFormularioCompleto();
                if (validacion.validaciones[this.id]) {
                    this.classList.remove('campo-error');
                }
            }
        });
    });
    
    // Hook a calcularResultados para añadir validación
    const calcularOriginal = window.calcularResultados;
    window.calcularResultados = function() {
        const validacion = validarFormularioCompleto();
        
        if (!validacion.valido) {
            mostrarErroresValidacion(validacion);
            return false;
        }
        
        // Limpiar alerta si existe
        const alerta = document.getElementById('alertaValidacion');
        if (alerta) alerta.remove();
        
        // Llamar función original
        return calcularOriginal.call(this);
    };
    
    console.log('✅ Mejoras UX/UI inicializadas correctamente');
}

// Ejecutar mejoras cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarMejorasUIUX);
} else {
    inicializarMejorasUIUX();
}
