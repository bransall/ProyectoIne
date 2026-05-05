/* ================================
   REPORT.JS - Generación de Reportes PDF
   ================================ */

/**
 * Limpia HTML y etiquetas de un texto
 * @param {string} html - Texto con HTML
 * @returns {string} Texto limpio sin HTML
 */
function limpiarHTML(html) {
    if (!html) return '';
    
    // Crear un elemento temporal para parsear HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Obtener solo el texto
    let texto = temp.textContent || temp.innerText || '';
    
    // Limpiar espacios en blanco extras
    texto = texto.replace(/\s+/g, ' ').trim();
    
    return texto;
}

/**
 * Genera un reporte PDF con los resultados del análisis
 * @param {object} datosA - Datos de entrada de Alternativa A
 * @param {object} datosB - Datos de entrada de Alternativa B
 * @param {object} resultadosA - Resultados de cálculos de Alternativa A
 * @param {object} resultadosB - Resultados de cálculos de Alternativa B
 * @param {object} comparacion - Comparación entre alternativas
 * @param {string} recomendacion - Texto de recomendación (puede contener HTML)
 */
function generarReportePDF(datosA, datosB, resultadosA, resultadosB, comparacion, recomendacion) {
    try {
        // Desestructurar jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración
        let yPos = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margen = 15;
        const anchoContenido = pageWidth - (margen * 2);
        
        // Colores
        const colorPrimario = [13, 110, 253];      // Azul
        const colorExito = [25, 135, 84];          // Verde
        const colorTexto = [33, 37, 41];           // Oscuro
        const colorGris = [128, 128, 128];         // Gris
        
        // ========== ENCABEZADO ==========
        doc.setFillColor(...colorPrimario);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('ANÁLISIS DE EVALUACIÓN FINANCIERA', margen, 15);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Comparación de Alternativas de Inversión', margen, 25);
        
        yPos = 45;
        
        // Fecha y hora
        doc.setTextColor(...colorGris);
        doc.setFontSize(9);
        const ahora = new Date();
        const fechaFormato = ahora.toLocaleDateString('es-ES') + ' ' + ahora.toLocaleTimeString('es-ES');
        doc.text('Generado: ' + fechaFormato, pageWidth - margen - 60, yPos);
        
        yPos += 10;
        
        // ========== RESUMEN EJECUTIVO ==========
        doc.setTextColor(...colorTexto);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('RESUMEN EJECUTIVO', margen, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const resumen = [];
        resumen.push(`Mejor VPN: Alternativa ${comparacion.mejorVPN}`);
        resumen.push(`Mejor TIR: Alternativa ${comparacion.mejorTIR}`);
        resumen.push(`Mejor CAE: Alternativa ${comparacion.mejorCAE}`);
        
        resumen.forEach(linea => {
            // Verificar si necesita nueva página
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 15;
            }
            doc.text(linea, margen + 5, yPos);
            yPos += 7; // Mayor espaciado
        });
        
        yPos += 8;
        
        // ========== DATOS DE ENTRADA ==========
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS DE ENTRADA', margen, yPos);
        
        yPos += 8;
        
        // Tabla de datos de entrada
        const datosTabla = [
            ['Concepto', 'Alternativa A', 'Alternativa B'],
            ['Inversión Inicial', formatearMoneda(datosA.inversionInicial), formatearMoneda(datosB.inversionInicial)],
            ['Tasa de Descuento', formatearNumero(datosA.tasaDescuento) + '%', formatearNumero(datosB.tasaDescuento) + '%'],
            ['Vida Útil (años)', datosA.vidaUtil.toString(), datosB.vidaUtil.toString()],
            ['Flujo de Efectivo Anual', formatearMoneda(datosA.flujoEfectivo), formatearMoneda(datosB.flujoEfectivo)],
            ['Valor de Salvamento', formatearMoneda(datosA.valorSalvamento), formatearMoneda(datosB.valorSalvamento)]
        ];
        
        doc.autoTable({
            head: [datosTabla[0]],
            body: datosTabla.slice(1),
            startY: yPos,
            margin: { left: margen, right: margen },
            columnStyles: {
                0: { cellWidth: 50, halign: 'left', textColor: colorPrimario, fontStyle: 'bold' },
                1: { cellWidth: (anchoContenido - 50) / 2, halign: 'right' },
                2: { cellWidth: (anchoContenido - 50) / 2, halign: 'right' }
            },
            headStyles: {
                fillColor: colorPrimario,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                lineHeight: 7
            },
            bodyStyles: {
                textColor: colorTexto,
                lineHeight: 7
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            cellPadding: { top: 4, right: 4, bottom: 4, left: 4 }
        });
        
        yPos = doc.lastAutoTable.finalY + 12;
        
        // Verificar si necesita nueva página
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 15;
        }
        
        // ========== RESULTADOS DE CÁLCULOS ==========
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('RESULTADOS DE CÁLCULOS', margen, yPos);
        
        yPos += 8;
        
        const resultadosTabla = [
            ['Métrica', 'Alternativa A', 'Alternativa B', 'Mejor'],
            [
                'VPN',
                formatearMoneda(resultadosA.vpn),
                formatearMoneda(resultadosB.vpn),
                comparacion.mejorVPN
            ],
            [
                'CAE',
                formatearMoneda(resultadosA.cae),
                formatearMoneda(resultadosB.cae),
                comparacion.mejorCAE
            ],
            [
                'TIR',
                formatearNumero(resultadosA.tir) + '%',
                formatearNumero(resultadosB.tir) + '%',
                comparacion.mejorTIR
            ]
        ];
        
        doc.autoTable({
            head: [resultadosTabla[0]],
            body: resultadosTabla.slice(1),
            startY: yPos,
            margin: { left: margen, right: margen },
            columnStyles: {
                0: { cellWidth: 40, halign: 'left', textColor: colorPrimario, fontStyle: 'bold' },
                1: { cellWidth: (anchoContenido - 40) / 3, halign: 'right' },
                2: { cellWidth: (anchoContenido - 40) / 3, halign: 'right' },
                3: { cellWidth: (anchoContenido - 40) / 3, halign: 'center', fontStyle: 'bold' }
            },
            headStyles: {
                fillColor: colorPrimario,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                lineHeight: 7
            },
            bodyStyles: {
                textColor: colorTexto,
                lineHeight: 7
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            cellPadding: { top: 4, right: 4, bottom: 4, left: 4 }
        });
        
        yPos = doc.lastAutoTable.finalY + 12;
        
        // Verificar si necesita nueva página
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 15;
        }
        
        // ========== INTERPRETACIÓN ==========
        // Verificar si necesita nueva página
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = 15;
        }
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('INTERPRETACIÓN DE RESULTADOS', margen, yPos);
        
        yPos += 10;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        const interpretacion = [];
        interpretacion.push('VPN (Valor Presente Neto): Indica el valor actual neto del proyecto. Mayor es mejor.');
        interpretacion.push('CAE (Costo Anual Equivalente): Convierte el VPN en anualidad. Menor es mejor.');
        interpretacion.push('TIR (Tasa Interna de Retorno): Rendimiento porcentual del proyecto. Mayor es mejor.');
        
        interpretacion.forEach(linea => {
            const lineasEnvueltas = doc.splitTextToSize(linea, anchoContenido - 10);
            lineasEnvueltas.forEach(sublinea => {
                // Verificar si necesita nueva página antes de escribir
                if (yPos > pageHeight - 40) {
                    doc.addPage();
                    yPos = 15;
                }
                doc.text(sublinea, margen + 5, yPos);
                yPos += 6;
            });
            yPos += 4; // Mayor espaciado entre párrafos
        });
        
        yPos += 8;
        
        // Nota sobre vidas útiles diferentes
        if (comparacion.vidasDiferentes) {
            // Verificar si necesita nueva página
            if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = 15;
            }
            
            const notaTextSize = 9;
            const notaLineas = doc.splitTextToSize(
                'Las alternativas tienen vidas útiles diferentes. El CAE es el criterio preferido para comparación.',
                anchoContenido - 10
            );
            const notaAltura = 3 + (notaLineas.length * 5) + 4; // Alto dinámico
            
            doc.setFillColor(212, 237, 218);
            doc.rect(margen, yPos - 3, anchoContenido, notaAltura + 2, 'F');
            
            doc.setTextColor(21, 87, 36);
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.text('⚠️ NOTA IMPORTANTE:', margen + 5, yPos + 2);
            yPos += 7;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(notaTextSize);
            notaLineas.forEach(linea => {
                doc.text(linea, margen + 5, yPos);
                yPos += 5;
            });
            yPos += 3;
        }
        
        yPos += 5;
        
        // Verificar si necesita nueva página
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 15;
        }
        
        // ========== RECOMENDACIÓN FINAL ==========
        // Verificar si necesita nueva página
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 15;
        }
        
        doc.setFillColor(...colorExito);
        doc.rect(margen - 1, yPos - 2, anchoContenido + 2, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('RECOMENDACIÓN FINAL', margen + 5, yPos + 2);
        
        yPos += 15; // Mayor espaciado después del título
        
        doc.setTextColor(...colorTexto);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setLineHeightFactor(1.6); // Aumentar más la altura de línea
        
        // Limpiar HTML de la recomendación
        const recomendacionLimpia = limpiarHTML(recomendacion);
        const recomLineas = doc.splitTextToSize(recomendacionLimpia, anchoContenido - 10);
        recomLineas.forEach((linea, index) => {
            // Verificar si necesita nueva página - margen más generoso
            if (yPos > pageHeight - 35) {
                doc.addPage();
                yPos = 15;
            }
            doc.text(linea, margen + 5, yPos);
            yPos += 8; // Mayor espaciado entre líneas
        });
        
        yPos += 10; // Mayor espaciado final
        
        // ========== NOTAS METODOLÓGICAS ==========
        doc.setTextColor(...colorGris);
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        
        const notasMetodologicas = [
            'Este reporte fue generado automáticamente por el Sistema de Evaluación Financiera.',
            'Los cálculos se basan en métodos estándar de análisis financiero.',
            'Se recomienda validar los datos de entrada antes de tomar decisiones.'
        ];
        
        notasMetodologicas.forEach((nota, index) => {
            doc.text(nota, margen, pageHeight - 15 + (index * 4));
        });
        
        // ========== GUARDAR PDF ==========
        const nombreArchivo = 'Evaluacion_Financiera_' + new Date().toISOString().slice(0, 10) + '.pdf';
        doc.save(nombreArchivo);
        
        return {
            exito: true,
            mensaje: 'PDF generado exitosamente: ' + nombreArchivo
        };
    } catch (error) {
        console.error("Error en generarReportePDF:", error);
        return {
            exito: false,
            mensaje: 'Error al generar PDF: ' + error.message
        };
    }
}
