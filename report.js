/* ================================
   REPORT.JS - Generación de Reportes PDF
   ================================ */

/**
 * Genera un reporte PDF con los resultados del análisis
 * @param {object} datosA - Datos de entrada de Alternativa A
 * @param {object} datosB - Datos de entrada de Alternativa B
 * @param {object} resultadosA - Resultados de cálculos de Alternativa A
 * @param {object} resultadosB - Resultados de cálculos de Alternativa B
 * @param {object} comparacion - Comparación entre alternativas
 * @param {string} recomendacion - Texto de recomendación
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
            doc.text(linea, margen + 5, yPos);
            yPos += 6;
        });
        
        yPos += 5;
        
        // ========== DATOS DE ENTRADA ==========
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS DE ENTRADA', margen, yPos);
        
        yPos += 8;
        
        // Tabla de datos de entrada
        const datosTabla = [
            ['Concepto', 'Alternativa A', 'Alternativa B'],
            ['Inversión Inicial', formatearMoneda(datosA.inversionInicial), formatearMoneda(datosB.inversionInicial)],
            ['Tasa de Descuento', formatearPorcentaje(datosA.tasaDescuento), formatearPorcentaje(datosB.tasaDescuento)],
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
                0: { cellWidth: 60, halign: 'left', textColor: colorPrimario, fontStyle: 'bold' },
                1: { cellWidth: (anchoContenido - 60) / 2, halign: 'right' },
                2: { cellWidth: (anchoContenido - 60) / 2, halign: 'right' }
            },
            headStyles: {
                fillColor: colorPrimario,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            bodyStyles: {
                textColor: colorTexto
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        
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
                formatearPorcentaje(resultadosA.tir),
                formatearPorcentaje(resultadosB.tir),
                comparacion.mejorTIR
            ]
        ];
        
        doc.autoTable({
            head: [resultadosTabla[0]],
            body: resultadosTabla.slice(1),
            startY: yPos,
            margin: { left: margen, right: margen },
            columnStyles: {
                0: { cellWidth: 50, halign: 'left', textColor: colorPrimario, fontStyle: 'bold' },
                1: { cellWidth: (anchoContenido - 50) / 3, halign: 'right' },
                2: { cellWidth: (anchoContenido - 50) / 3, halign: 'right' },
                3: { cellWidth: (anchoContenido - 50) / 3, halign: 'center', fontStyle: 'bold' }
            },
            headStyles: {
                fillColor: colorPrimario,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            bodyStyles: {
                textColor: colorTexto
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        
        // Verificar si necesita nueva página
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 15;
        }
        
        // ========== INTERPRETACIÓN ==========
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('INTERPRETACIÓN DE RESULTADOS', margen, yPos);
        
        yPos += 8;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        const interpretacion = [];
        interpretacion.push('VPN (Valor Presente Neto): Indica el valor actual neto del proyecto. Mayor es mejor.');
        interpretacion.push('CAE (Costo Anual Equivalente): Convierte el VPN en anualidad. Menor es mejor.');
        interpretacion.push('TIR (Tasa Interna de Retorno): Rendimiento porcentual del proyecto. Mayor es mejor.');
        
        interpretacion.forEach(linea => {
            const lineasEnvueltas = doc.splitTextToSize(linea, anchoContenido - 10);
            lineasEnvueltas.forEach(sublinea => {
                doc.text(sublinea, margen + 5, yPos);
                yPos += 5;
            });
            yPos += 2;
        });
        
        yPos += 5;
        
        // Nota sobre vidas útiles diferentes
        if (comparacion.vidasDiferentes) {
            doc.setFillColor(212, 237, 218);
            doc.rect(margen, yPos - 3, anchoContenido, 20, 'F');
            
            doc.setTextColor(21, 87, 36);
            doc.setFont(undefined, 'bold');
            doc.text('⚠️ NOTA IMPORTANTE:', margen + 5, yPos);
            yPos += 6;
            
            doc.setFont(undefined, 'normal');
            const notaLineas = doc.splitTextToSize(
                'Las alternativas tienen vidas útiles diferentes. El CAE es el criterio preferido para comparación.',
                anchoContenido - 10
            );
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
        doc.setFillColor(...colorExito);
        doc.rect(margen - 1, yPos - 3, anchoContenido + 2, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('RECOMENDACIÓN FINAL', margen + 5, yPos + 2);
        
        yPos += 12;
        
        doc.setTextColor(...colorTexto);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const recomLineas = doc.splitTextToSize(recomendacion, anchoContenido - 10);
        recomLineas.forEach(linea => {
            doc.text(linea, margen + 5, yPos);
            yPos += 6;
        });
        
        yPos += 10;
        
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
