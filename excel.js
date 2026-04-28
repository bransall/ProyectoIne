/**
 * Módulo de Exportación a Excel
 * Permite exportar datos de cálculos a archivos Excel con múltiples hojas
 */

/**
 * Genera un archivo Excel con los datos del cálculo actual
 */
function generarExcel() {
    if (!resultadosAlternativaA || !resultadosAlternativaB) {
        mostrarError('Primero debe realizar un cálculo antes de exportar a Excel.');
        return;
    }
    
    try {
        // Crear nuevo workbook
        const wb = XLSX.utils.book_new();
        
        // Agregar hojas
        agregarHojaEntrada(wb);
        agregarHojaResultados(wb);
        agregarHojaSensibilidad(wb);
        agregarHojaComparativo(wb);
        
        // Descargar archivo
        const timestamp = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `Evaluacion_Financiera_${timestamp}.xlsx`);
        
        mostrarExito('Archivo Excel generado exitosamente!');
        
    } catch (error) {
        console.error("Error al generar Excel:", error);
        mostrarError("Error al generar el archivo Excel: " + error.message);
    }
}

/**
 * Agrega la hoja de datos de entrada al workbook
 */
function agregarHojaEntrada(wb) {
    const datos = [];
    
    // Encabezado
    datos.push(['DATOS DE ENTRADA']);
    datos.push(['']);
    
    // Alternativa A
    datos.push(['ALTERNATIVA A', '', 'ALTERNATIVA B']);
    datos.push(['Parámetro', 'Valor', '', 'Parámetro', 'Valor']);
    
    const campos = [
        ['Inversión Inicial', formatearMoneda(datosAlternativaA.inversionInicial), '', 'Inversión Inicial', formatearMoneda(datosAlternativaB.inversionInicial)],
        ['Tasa de Descuento', formatearPorcentaje(datosAlternativaA.tasaDescuento) + '%', '', 'Tasa de Descuento', formatearPorcentaje(datosAlternativaB.tasaDescuento) + '%'],
        ['Vida Útil (años)', datosAlternativaA.vidaUtil, '', 'Vida Útil (años)', datosAlternativaB.vidaUtil],
        ['Flujo Anual', formatearMoneda(datosAlternativaA.flujoEfectivo), '', 'Flujo Anual', formatearMoneda(datosAlternativaB.flujoEfectivo)],
        ['Salvamento', formatearMoneda(datosAlternativaA.valorSalvamento), '', 'Salvamento', formatearMoneda(datosAlternativaB.valorSalvamento)]
    ];
    
    campos.forEach(fila => datos.push(fila));
    
    const ws = XLSX.utils.aoa_to_sheet(datos);
    ws['!cols'] = [{wch: 22}, {wch: 18}, {wch: 3}, {wch: 22}, {wch: 18}];
    XLSX.utils.book_append_sheet(wb, ws, "Entrada");
}

/**
 * Agrega la hoja de resultados al workbook
 */
function agregarHojaResultados(wb) {
    const datos = [];
    
    // Encabezado
    datos.push(['RESULTADOS DEL ANÁLISIS']);
    datos.push(['Fecha: ' + new Date().toLocaleString()]);
    datos.push(['']);
    
    // Tabla comparativa
    datos.push(['Métrica', 'Alternativa A', 'Alternativa B', 'Mejor']);
    
    const metodos = obtenerMetodosSeleccionados();
    
    if (metodos.vpn) {
        datos.push([
            'VPN (Valor Presente Neto)',
            formatearMoneda(resultadosAlternativaA.vpn),
            formatearMoneda(resultadosAlternativaB.vpn),
            datosComparacion.comparacion.mejorVPN
        ]);
    }
    
    if (metodos.cae) {
        datos.push([
            'CAE (Costo Anual Equivalente)',
            formatearMoneda(resultadosAlternativaA.cae),
            formatearMoneda(resultadosAlternativaB.cae),
            datosComparacion.comparacion.mejorCAE
        ]);
    }
    
    if (metodos.tir) {
        datos.push([
            'TIR (Tasa Interna de Retorno)',
            formatearPorcentaje(resultadosAlternativaA.tir) + '%',
            formatearPorcentaje(resultadosAlternativaB.tir) + '%',
            datosComparacion.comparacion.mejorTIR
        ]);
    }
    
    // Recomendación
    datos.push(['']);
    datos.push(['RECOMENDACIÓN']);
    datos.push([datosComparacion.recomendacion]);
    
    const ws = XLSX.utils.aoa_to_sheet(datos);
    ws['!cols'] = [{wch: 30}, {wch: 18}, {wch: 18}, {wch: 12}];
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
}

/**
 * Agrega la hoja de sensibilidad al workbook
 */
function agregarHojaSensibilidad(wb) {
    const datos = [];
    
    // Encabezado
    datos.push(['ANÁLISIS DE SENSIBILIDAD']);
    datos.push(['Parámetro Analizado: Tasa de Descuento']);
    datos.push(['']);
    
    // Tabla de sensibilidad
    const datosModificados = calcularSensibilidad(datosAlternativaA, 'tasa');
    
    datos.push(['Variación', 'VPN', 'Viabilidad']);
    
    datosModificados.forEach(row => {
        datos.push([
            row.etiqueta + (row.esBase ? ' (Caso Base)' : ''),
            parseFloat(row.vpn.toFixed(2)),
            row.vpn >= 0 ? 'Viable' : 'No Viable'
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(datos);
    ws['!cols'] = [{wch: 18}, {wch: 18}, {wch: 15}];
    
    // Agregar formato numérico al VPN
    for (let i = 4; i < datos.length; i++) {
        const cellRef = 'B' + (i + 1);
        if (ws[cellRef]) {
            ws[cellRef].t = 'n';
            ws[cellRef].z = '#,##0.00';
        }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, "Sensibilidad");
}

/**
 * Agrega la hoja comparativa al workbook
 */
function agregarHojaComparativo(wb) {
    const datos = [];
    
    // Encabezado
    datos.push(['ANÁLISIS COMPARATIVO DETALLADO']);
    datos.push(['']);
    
    // Comparación por método
    datos.push(['COMPARACIÓN POR MÉTODO']);
    datos.push(['Método', 'Alternativa A', 'Alternativa B', 'Diferencia', 'Ganador']);
    
    const metodos = obtenerMetodosSeleccionados();
    
    if (metodos.vpn) {
        const diff = resultadosAlternativaB.vpn - resultadosAlternativaA.vpn;
        datos.push([
            'VPN',
            resultadosAlternativaA.vpn.toFixed(2),
            resultadosAlternativaB.vpn.toFixed(2),
            diff.toFixed(2),
            diff > 0 ? 'B' : (diff < 0 ? 'A' : 'Empate')
        ]);
    }
    
    if (metodos.cae) {
        const diff = resultadosAlternativaA.cae - resultadosAlternativaB.cae; // Menor es mejor para CAE
        datos.push([
            'CAE',
            resultadosAlternativaA.cae.toFixed(2),
            resultadosAlternativaB.cae.toFixed(2),
            diff.toFixed(2),
            diff > 0 ? 'B' : (diff < 0 ? 'A' : 'Empate')
        ]);
    }
    
    if (metodos.tir) {
        const diff = resultadosAlternativaB.tir - resultadosAlternativaA.tir;
        datos.push([
            'TIR',
            (resultadosAlternativaA.tir * 100).toFixed(2) + '%',
            (resultadosAlternativaB.tir * 100).toFixed(2) + '%',
            (diff * 100).toFixed(2) + '%',
            diff > 0 ? 'B' : (diff < 0 ? 'A' : 'Empate')
        ]);
    }
    
    // Resumen de decisión
    datos.push(['']);
    datos.push(['RESUMEN DE DECISIÓN']);
    datos.push(['Alternativa Recomendada', datosComparacion.comparacion.mejorAlternativa]);
    datos.push(['Razón', datosComparacion.recomendacion]);
    
    const ws = XLSX.utils.aoa_to_sheet(datos);
    ws['!cols'] = [{wch: 15}, {wch: 18}, {wch: 18}, {wch: 15}, {wch: 12}];
    XLSX.utils.book_append_sheet(wb, ws, "Comparativo");
}

/**
 * Muestra alerta de éxito
 */
function mostrarExito(mensaje) {
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success alert-dismissible fade show';
    alerta.role = 'alert';
    alerta.innerHTML = `
        <strong>✅ Éxito:</strong> ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alerta.style.position = 'fixed';
    alerta.style.top = '20px';
    alerta.style.right = '20px';
    alerta.style.zIndex = '9999';
    alerta.style.minWidth = '300px';
    
    document.body.appendChild(alerta);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}
