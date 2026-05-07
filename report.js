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
    
    // Dado que finance.js ya no contiene HTML, 
    // solo necesitamos hacer trim y limpiar espacios dobles
    let texto = html.trim();
    texto = texto.replace(/  +/g, ' ');
    
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
 * @param {object} metodosSeleccionados - Objeto con vpn, cae, tir booleanos indicando qué métodos mostrar
 */
function generarReportePDF(datosA, datosB, resultadosA, resultadosB, comparacion, recomendacion, metodosSeleccionados) {
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
        if (metodosSeleccionados.vpn) {
            resumen.push(`Mejor VPN: Alternativa ${comparacion.mejorVPN}`);
        }
        if (metodosSeleccionados.tir) {
            resumen.push(`Mejor TIR: Alternativa ${comparacion.mejorTIR}`);
        }
        if (metodosSeleccionados.cae) {
            resumen.push(`Mejor CAE: Alternativa ${comparacion.mejorCAE}`);
        }
        
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
        doc.setFontSize(12);
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
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('RESULTADOS DE CÁLCULOS', margen, yPos);
        
        yPos += 8;
        
        const resultadosTabla = [
            ['Métrica', 'Alternativa A', 'Alternativa B', 'Mejor']
        ];
        
        // Agregar solo las filas de métodos seleccionados
        if (metodosSeleccionados.vpn) {
            resultadosTabla.push([
                'VPN',
                formatearMoneda(resultadosA.vpn),
                formatearMoneda(resultadosB.vpn),
                comparacion.mejorVPN
            ]);
        }
        
        if (metodosSeleccionados.cae) {
            resultadosTabla.push([
                'CAE',
                formatearMoneda(resultadosA.cae),
                formatearMoneda(resultadosB.cae),
                comparacion.mejorCAE
            ]);
        }
        
        if (metodosSeleccionados.tir) {
            resultadosTabla.push([
                'TIR',
                formatearNumero(resultadosA.tir) + '%',
                formatearNumero(resultadosB.tir) + '%',
                comparacion.mejorTIR
            ]);
        }
        
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
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('INTERPRETACIÓN DE RESULTADOS', margen, yPos);
        
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const interpretacion = [];
        if (metodosSeleccionados.vpn) {
            interpretacion.push('VPN (Valor Presente Neto): Indica el valor actual neto del proyecto. Mayor es mejor.');
        }
        if (metodosSeleccionados.cae) {
            interpretacion.push('CAE (Costo Anual Equivalente): Convierte el VPN en anualidad. Menor es mejor.');
        }
        if (metodosSeleccionados.tir) {
            interpretacion.push('TIR (Tasa Interna de Retorno): Rendimiento porcentual del proyecto. Mayor es mejor.');
        }
        
        // Usar ancho fijo consistente (170 puntos)
        const margenInterpretacion = margen + 3;
        const anchoInterpretacionFijo = 170;
        
        interpretacion.forEach(linea => {
            // Verificar si necesita nueva página
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 15;
            }
            
            // Dividir en líneas
            const lineasEnvueltas = doc.splitTextToSize(linea, anchoInterpretacionFijo);
            lineasEnvueltas.forEach(sublinea => {
                if (yPos > pageHeight - 10) {
                    doc.addPage();
                    yPos = 15;
                }
                doc.text(sublinea, margenInterpretacion, yPos);
                yPos += 6;
            });
            yPos += 3; // Espaciado entre items
        });
        
        yPos += 8;
        
        // Nota sobre vidas útiles diferentes
        if (comparacion.vidasDiferentes) {
            // Verificar si necesita nueva página
            if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = 15;
            }
            
            // Usar ancho fijo consistente (170 puntos)
            const margenNota = margen + 3;
            const anchoNotaFijo = 170;
            const notaLineas = doc.splitTextToSize(
                'Las alternativas tienen vidas útiles diferentes. El CAE es el criterio preferido para comparación.',
                anchoNotaFijo
            );
            const notaAltura = 5 + (notaLineas.length * 5) + 3;
            
            doc.setFillColor(212, 237, 218);
            doc.rect(margenNota - 2, yPos - 4, anchoNotaFijo + 4, notaAltura, 'F');
            
            doc.setTextColor(21, 87, 36);
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.text('⚠️ NOTA IMPORTANTE:', margenNota, yPos + 1);
            yPos += 6;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            notaLineas.forEach(linea => {
                doc.text(linea, margenNota, yPos);
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
        if (yPos > pageHeight - 80) {
            doc.addPage();
            yPos = 15;
        }
        
        // Recuadro de recomendación
        doc.setFillColor(...colorExito);
        doc.rect(margen, yPos - 2, anchoContenido, 10, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('✓ RECOMENDACIÓN FINAL', margen + 5, yPos + 3);
        
        yPos += 18; // Espaciado después del título
        
        doc.setTextColor(...colorTexto);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Limpiar HTML de la recomendación
        const recomendacionLimpia = limpiarHTML(recomendacion);
        
        // Usar ancho fijo optimizado para jsPDF (170 es más generoso)
        const margenRecomendacion = margen + 3;
        const anchoRecomendacionFijo = 170; // Ancho aumentado para mejor wrapping
        
        // Dividir en párrafos por saltos de línea
        const parrafos = recomendacionLimpia.split(/\n/).filter(p => p.trim());
        
        parrafos.forEach((parrafo) => {
            if (!parrafo.trim()) return;
            
            // Verificar si necesita nueva página ANTES de escribir
            if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = 15;
            }
            
            // Dividir párrafo en líneas con ancho fijo
            const lineas = doc.splitTextToSize(parrafo.trim(), anchoRecomendacionFijo);
            
            // Escribir cada línea
            lineas.forEach((linea) => {
                if (yPos > pageHeight - 10) {
                    doc.addPage();
                    yPos = 15;
                }
                doc.text(linea, margenRecomendacion, yPos);
                yPos += 6;
            });
            
            yPos += 3; // Espaciado entre párrafos
        });
        
        yPos += 5; // Espaciado final
        
        // ========== NOTAS METODOLÓGICAS ==========
        // Posicionar en la parte inferior de la página
        yPos = pageHeight - 18;
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margen, yPos - 2, pageWidth - margen, yPos - 2);
        
        yPos += 2;
        doc.setTextColor(...colorGris);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        
        const notasMetodologicas = [
            'Este reporte fue generado automáticamente por el Sistema de Evaluación Financiera.',
            'Los cálculos se basan en métodos estándar de análisis financiero.',
            'Se recomienda validar los datos de entrada antes de tomar decisiones.'
        ];
        
        notasMetodologicas.forEach((nota, index) => {
            if (yPos < pageHeight - 2) {
                doc.text(nota, margen + 5, yPos);
                yPos += 3;
            }
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
