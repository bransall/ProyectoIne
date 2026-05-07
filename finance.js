/* ================================
   FINANCE.JS - Lógica de Cálculos Financieros
   ================================ */

/**
 * Estandariza una tasa de descuento
 * Convierte porcentajes a decimales (15% → 0.15)
 * @param {number} tasa - Tasa en porcentaje o decimal
 * @returns {number} Tasa en formato decimal
 */
function estandarizarTasa(tasa) {
    if (tasa === null || tasa === undefined || isNaN(tasa)) {
        throw new Error("Tasa de descuento inválida");
    }
    
    // Si es mayor a 1, asumir que es porcentaje
    if (tasa > 1) {
        return tasa / 100;
    }
    return tasa;
}

/**
 * Valida que todos los campos de entrada sean válidos
 * @param {object} datos - Objeto con los datos de entrada
 * @returns {object} {valido: boolean, mensaje: string}
 */
function validarDatos(datos) {
    const camposRequeridos = [
        'inversion',
        'tasa',
        'vidaUtil',
        'flujoEfectivo',
        'valorSalvamento'
    ];

    for (let campo of camposRequeridos) {
        if (datos[campo] === null || datos[campo] === undefined || datos[campo] === '') {
            return {
                valido: false,
                mensaje: `El campo ${campo} es obligatorio`
            };
        }

        let valor = parseFloat(datos[campo]);
        if (isNaN(valor)) {
            return {
                valido: false,
                mensaje: `${campo} debe ser un número válido`
            };
        }
    }

    // Validaciones específicas
    let tasa = parseFloat(datos.tasa);
    if (tasa < 0 || tasa > 100) {
        return {
            valido: false,
            mensaje: "La tasa de descuento debe estar entre 0 y 100%"
        };
    }

    let vidaUtil = parseFloat(datos.vidaUtil);
    if (vidaUtil <= 0 || !Number.isInteger(vidaUtil)) {
        return {
            valido: false,
            mensaje: "La vida útil debe ser un número entero mayor a 0"
        };
    }

    return {
        valido: true,
        mensaje: ""
    };
}

/**
 * Calcula el Valor Presente Neto (VPN)
 * VPN = -I₀ + Σ[FC_t / (1+i)^t] + [VS / (1+i)^n]
 * 
 * @param {number} inversionInicial - Inversión inicial
 * @param {number} tasaDescuento - Tasa de descuento (en decimal)
 * @param {number} flujoEfectivo - Flujo de efectivo anual
 * @param {number} vidaUtil - Vida útil en años
 * @param {number} valorSalvamento - Valor de salvamento
 * @returns {number} VPN calculado
 */
function calcularVPN(inversionInicial, tasaDescuento, flujoEfectivo, vidaUtil, valorSalvamento) {
    try {
        tasaDescuento = estandarizarTasa(tasaDescuento);
        
        let vpn = -inversionInicial;
        
        // Suma de flujos de efectivo descontados
        for (let t = 1; t <= vidaUtil; t++) {
            vpn += flujoEfectivo / Math.pow(1 + tasaDescuento, t);
        }
        
        // Agregar valor de salvamento en el último año
        vpn += valorSalvamento / Math.pow(1 + tasaDescuento, vidaUtil);
        
        return vpn;
    } catch (error) {
        console.error("Error en calcularVPN:", error);
        throw error;
    }
}

/**
 * Calcula el Costo Anual Equivalente (CAE)
 * A = P × [i(1+i)^n] / [(1+i)^n - 1]
 * Donde P es el VPN (en valor absoluto) y n es la vida útil
 * 
 * @param {number} vpn - Valor presente neto
 * @param {number} tasaDescuento - Tasa de descuento (en decimal)
 * @param {number} vidaUtil - Vida útil en años
 * @returns {number} CAE calculado
 */
function calcularCAE(vpn, tasaDescuento, vidaUtil) {
    try {
        tasaDescuento = estandarizarTasa(tasaDescuento);
        
        // Usar el valor absoluto del VPN
        let vpnAbsoluto = Math.abs(vpn);
        
        // Casos especiales
        if (tasaDescuento === 0) {
            // Si tasa es 0, CAE = VPN / años
            return vpnAbsoluto / vidaUtil;
        }
        
        // Fórmula: A = P × [i(1+i)^n] / [(1+i)^n - 1]
        let numerador = tasaDescuento * Math.pow(1 + tasaDescuento, vidaUtil);
        let denominador = Math.pow(1 + tasaDescuento, vidaUtil) - 1;
        
        let cae = vpnAbsoluto * (numerador / denominador);
        
        return cae;
    } catch (error) {
        console.error("Error en calcularCAE:", error);
        throw error;
    }
}

/**
 * Calcula la Tasa Interna de Retorno (TIR) usando método de bisección
 * TIR es la tasa donde VPN = 0
 * 
 * @param {number} inversionInicial - Inversión inicial
 * @param {number} flujoEfectivo - Flujo de efectivo anual
 * @param {number} vidaUtil - Vida útil en años
 * @param {number} valorSalvamento - Valor de salvamento
 * @returns {number} TIR en porcentaje
 */
function calcularTIR(inversionInicial, flujoEfectivo, vidaUtil, valorSalvamento) {
    try {
        // Función auxiliar para calcular VPN con una tasa dada
        function vpnConTasa(tasa) {
            // Evitar valores que causen problemas numéricos
            if (tasa <= -1) {
                return Number.POSITIVE_INFINITY;
            }
            
            let vpn = -inversionInicial;
            for (let t = 1; t <= vidaUtil; t++) {
                vpn += flujoEfectivo / Math.pow(1 + tasa, t);
            }
            vpn += valorSalvamento / Math.pow(1 + tasa, vidaUtil);
            return vpn;
        }

        // Método de bisección con rango realista de tasas
        // La TIR típicamente está entre 0% y 100% en proyectos reales
        let tasaBaja = 0;           // 0%
        let tasaAlta = 1.0;         // 100%
        let tol = 0.0001;           // Tolerancia
        let maxIter = 50;           // Iteraciones
        let iteraciones = 0;

        // Evaluar los extremos
        let vpnBaja = vpnConTasa(tasaBaja);
        let vpnAlta = vpnConTasa(tasaAlta);

        // Si ambos tienen el mismo signo, no hay solución en este rango
        if ((vpnBaja > 0 && vpnAlta > 0) || (vpnBaja < 0 && vpnAlta < 0)) {
            // Ampliar el rango de búsqueda más allá de 100%
            tasaBaja = -0.5;        // -50%
            tasaAlta = 3.0;         // 300%
            vpnBaja = vpnConTasa(tasaBaja);
            vpnAlta = vpnConTasa(tasaAlta);
            
            // Si aún no hay cambio de signo, retornar null indicando que no hay TIR real
            if ((vpnBaja > 0 && vpnAlta > 0) || (vpnBaja < 0 && vpnAlta < 0)) {
                // Estimar una TIR aproximada usando método simple
                let paybackSimple = inversionInicial / flujoEfectivo;
                if (paybackSimple <= vidaUtil) {
                    // Proyecto con retorno simple, estimar TIR
                    let estimado = (flujoEfectivo / inversionInicial) - (1 / vidaUtil);
                    return Math.max(0, Math.min(100, estimado * 100));
                }
                return 0; // Si no es viable, retornar 0%
            }
        }

        // Bisección estándar
        while ((tasaAlta - tasaBaja) > tol && iteraciones < maxIter) {
            let tasaMedia = (tasaBaja + tasaAlta) / 2;
            let vpnMedia = vpnConTasa(tasaMedia);

            // Si encontramos una raíz exacta
            if (Math.abs(vpnMedia) < 0.01) {
                let tir = tasaMedia * 100;
                // Asegurar que esté en rango realista
                return Math.max(0, Math.min(100, tir));
            }

            // Decidir hacia dónde continuar
            if ((vpnBaja > 0 && vpnMedia < 0) || (vpnBaja < 0 && vpnMedia > 0)) {
                tasaAlta = tasaMedia;
                vpnAlta = vpnMedia;
            } else {
                tasaBaja = tasaMedia;
                vpnBaja = vpnMedia;
            }

            iteraciones++;
        }

        let tir = (tasaBaja + tasaAlta) / 2;
        tir = tir * 100;
        
        // Limitar a rango realista pero permitir valores fuera si son matemáticamente válidos
        if (tir < 0) return 0;
        if (tir > 300) return null; // Indicar que no hay TIR realista
        
        return tir;
    } catch (error) {
        console.error("Error en calcularTIR:", error);
        throw error;
    }
}

/**
 * Realiza todos los cálculos para una alternativa
 * @param {object} alternativa - Objeto con los parámetros de la alternativa
 * @returns {object} Objeto con los resultados
 */
function calcularAlternativa(alternativa) {
    try {
        const vpn = calcularVPN(
            alternativa.inversionInicial,
            alternativa.tasaDescuento,
            alternativa.flujoEfectivo,
            alternativa.vidaUtil,
            alternativa.valorSalvamento
        );

        const cae = calcularCAE(vpn, alternativa.tasaDescuento, alternativa.vidaUtil);

        const tir = calcularTIR(
            alternativa.inversionInicial,
            alternativa.flujoEfectivo,
            alternativa.vidaUtil,
            alternativa.valorSalvamento
        );

        return {
            vpn: vpn,
            cae: cae,
            tir: tir,
            valido: true
        };
    } catch (error) {
        return {
            valido: false,
            error: error.message
        };
    }
}

/**
 * Compara dos alternativas y determina la mejor por cada criterio
 * @param {object} resultadosA - Resultados de alternativa A
 * @param {object} resultadosB - Resultados de alternativa B
 * @returns {object} Comparación y recomendación
 */
/**
 * Genera análisis técnico detallado para VPN
 */
function analizarVPN(vpnA, vpnB) {
    const diferenciaVPN = Math.abs(vpnA - vpnB);
    const porcentajeDif = (diferenciaVPN / Math.max(Math.abs(vpnA), Math.abs(vpnB))) * 100;
    const mejor = vpnA > vpnB ? 'A' : 'B';
    const peor = mejor === 'A' ? 'B' : 'A';
    
    let analisis = `VPN - Valor Presente Neto: Mide el valor actual de los flujos netos.`;
    analisis += `\nLa Alternativa ${mejor} tiene un VPN superior (${formatearMoneda(Math.max(vpnA, vpnB))}) comparado con ${formatearMoneda(Math.min(vpnA, vpnB))}.`;
    analisis += `\nDiferencia: ${formatearMoneda(diferenciaVPN)} (${porcentajeDif.toFixed(1)}%).`;
    analisis += `\nSignificado: La Alternativa ${mejor} generará más valor económico después de recuperar la inversión inicial.`;
    
    return { mejor, analisis };
}

/**
 * Genera análisis técnico detallado para CAE
 */
function analizarCAE(caeA, caeB) {
    const diferenciaCae = Math.abs(caeA - caeB);
    const porcentajeDif = (diferenciaCae / Math.max(caeA, caeB)) * 100;
    const mejor = caeA < caeB ? 'A' : 'B';
    const peor = mejor === 'A' ? 'B' : 'A';
    
    let analisis = `CAE - Costo Anual Equivalente: Convierte el costo presente en un costo anual uniforme.`;
    analisis += `\nLa Alternativa ${mejor} tiene un CAE más bajo (${formatearMoneda(Math.min(caeA, caeB))}) frente a ${formatearMoneda(Math.max(caeA, caeB))}.`;
    analisis += `\nDiferencia: ${formatearMoneda(diferenciaCae)} anuales (${porcentajeDif.toFixed(1)}%).`;
    analisis += `\nImportancia: En proyectos con vidas útiles diferentes, este criterio normaliza los costos a un período común.`;
    
    return { mejor, analisis };
}

/**
 * Genera análisis técnico detallado para TIR
 */
function analizarTIR(tirA, tirB, tasaDescuentoA = 0, tasaDescuentoB = 0) {
    const diferenciaTir = Math.abs(tirA - tirB);
    const mejor = tirA > tirB ? 'A' : 'B';
    const peor = mejor === 'A' ? 'B' : 'A';
    
    let analisis = `TIR - Tasa Interna de Retorno: Representa la tasa de rendimiento porcentual que iguala el VPN a cero.`;
    analisis += `\nLa Alternativa ${mejor} ofrece TIR del ${tirA.toFixed(2)}% frente al ${tirB.toFixed(2)}% de Alternativa ${peor}, una diferencia de ${diferenciaTir.toFixed(2)} puntos porcentuales.`;
    
    // Agregar análisis de viabilidad si se proporcionan tasas de descuento
    if (tasaDescuentoA > 0 || tasaDescuentoB > 0) {
        analisis += `\nAnálisis de Viabilidad:`;
        
        let viableA = tirA >= tasaDescuentoA;
        let viableB = tirB >= tasaDescuentoB;
        
        if (viableA && viableB) {
            analisis += `\nAmbas alternativas son viables (TIR >= tasa de descuento).`;
            analisis += `\nAlternativa ${mejor} es preferible por su mayor rentabilidad.`;
        } else if (!viableA && !viableB) {
            analisis += `\nAmbas alternativas no son viables (TIR < tasa de descuento).`;
        } else if (viableA) {
            analisis += `\nSolo Alternativa A es viable (TIR >= tasa de descuento).`;
        } else {
            analisis += `\nSolo Alternativa B es viable (TIR >= tasa de descuento).`;
        }
    }
    
    return { mejor, analisis };
}

/**
 * Compara dos alternativas de inversión SOLO basándose en los métodos seleccionados
 * @param {object} resultadosA - Resultados de Alternativa A
 * @param {object} resultadosB - Resultados de Alternativa B
 * @param {number} vidaUtilA - Vida útil de Alternativa A
 * @param {number} vidaUtilB - Vida útil de Alternativa B
 * @param {object} metodos - {vpn: boolean, cae: boolean, tir: boolean}
 * @param {number} tasaDescuentoA - Tasa de descuento de Alternativa A (en decimal)
 * @param {number} tasaDescuentoB - Tasa de descuento de Alternativa B (en decimal)
 * @returns {object} Comparación y recomendación técnica
 */
function compararAlternativas(resultadosA, resultadosB, vidaUtilA, vidaUtilB, metodos = {vpn: true, cae: true, tir: true}, tasaDescuentoA = 0, tasaDescuentoB = 0) {
    let comparacion = {
        mejorVPN: resultadosA.vpn > resultadosB.vpn ? 'A' : 'B',
        mejorTIR: resultadosA.tir > resultadosB.tir ? 'A' : 'B',
        mejorCAE: resultadosA.cae < resultadosB.cae ? 'A' : 'B' // Menor es mejor en CAE
    };

    // Análisis de vidas útiles diferentes
    let vidasDiferentes = vidaUtilA !== vidaUtilB;
    let recomendacion = '';
    
    // Contar cuántos métodos están seleccionados
    let metodosSeleccionados = Object.values(metodos).filter(v => v).length;
    
    // CASO 1: Solo un método seleccionado
    if (metodosSeleccionados === 1) {
        if (metodos.vpn) {
            const { mejor, analisis } = analizarVPN(resultadosA.vpn, resultadosB.vpn);
            recomendacion = `${analisis}
`;
            recomendacion += `Conclusión: Se recomienda la Alternativa ${mejor} por su superior valor presente neto.`;
        } else if (metodos.cae) {
            const { mejor, analisis } = analizarCAE(resultadosA.cae, resultadosB.cae);
            recomendacion = `${analisis}
`;
            recomendacion += `Conclusión: Se recomienda la Alternativa ${mejor} por su menor costo anual equivalente.`;
        } else if (metodos.tir) {
            const { mejor, analisis } = analizarTIR(resultadosA.tir, resultadosB.tir, tasaDescuentoA, tasaDescuentoB);
            recomendacion = `${analisis}
`;
            recomendacion += `Conclusión: Se recomienda la Alternativa ${mejor} por su superior tasa de retorno.`;
        }
    }
    // CASO 2: Dos métodos seleccionados
    else if (metodosSeleccionados === 2) {
        let analisisCompleto = '';
        
        if (metodos.vpn && metodos.cae) {
            const vpnAnalisis = analizarVPN(resultadosA.vpn, resultadosB.vpn);
            const caeAnalisis = analizarCAE(resultadosA.cae, resultadosB.cae);
            
            analisisCompleto += `${vpnAnalisis.analisis}
`;
            analisisCompleto += `${caeAnalisis.analisis}
`;
            
            if (comparacion.mejorVPN === comparacion.mejorCAE) {
                recomendacion = `${analisisCompleto}\nAnálisis Integrado: Ambos criterios convergen.`;
                recomendacion += `\nLa Alternativa ${comparacion.mejorVPN} es superior en VPN y CAE.`;
                recomendacion += `\nEstá indicando una decisión clara desde perspectivas de valor absoluto y costos anualizados.`;
            } else {
                recomendacion = `${analisisCompleto}\nAnálisis de Conflicto:`;
                recomendacion += `\nVPN favorece Alternativa ${comparacion.mejorVPN} (mayor valor económico total).`;
                recomendacion += `\nCAE favorece Alternativa ${comparacion.mejorCAE} (menores costos anuales).`;
                if (vidasDiferentes) {
                    recomendacion += `\nCon vidas útiles diferentes (${vidaUtilA} vs ${vidaUtilB} años):`;
                    recomendacion += `\nSe recomienda Alternativa ${comparacion.mejorCAE}.`;
                    recomendacion += `\nEl CAE normaliza comparaciones entre proyectos de diferente duración.`;
                } else {
                    recomendacion += `\nSe recomienda Alternativa ${comparacion.mejorVPN} (mejor VPN).`;
                    recomendacion += `\nEs el criterio dominante para maximizar valor económico absoluto.`;
                }
            }
        } else if (metodos.vpn && metodos.tir) {
            const vpnAnalisis = analizarVPN(resultadosA.vpn, resultadosB.vpn);
            const tirAnalisis = analizarTIR(resultadosA.tir, resultadosB.tir, tasaDescuentoA, tasaDescuentoB);
            
            analisisCompleto += `${vpnAnalisis.analisis}
`;
            analisisCompleto += `${tirAnalisis.analisis}
`;
            
            if (comparacion.mejorVPN === comparacion.mejorTIR) {
                recomendacion = `${analisisCompleto}\nAnálisis Integrado: VPN y TIR coinciden.`;
                recomendacion += `\nLa Alternativa ${comparacion.mejorVPN} ofrece tanto mayor valor como superior tasa de retorno.`;
                recomendacion += `\nRepresenta la opción óptima.`;
            } else {
                recomendacion = `${analisisCompleto}\nAnálisis de Conflicto:`;
                recomendacion += `\nVPN favorece Alternativa ${comparacion.mejorVPN} (mayor creación de valor).`;
                recomendacion += `\nTIR favorece Alternativa ${comparacion.mejorTIR} (mayor rentabilidad porcentual).`;
                recomendacion += `\nSe recomienda Alternativa ${comparacion.mejorVPN} (mejor VPN).`;
                recomendacion += `\nEs el criterio más conservador, asume tasa de reinversión más realista que la TIR.`;
            }
        } else if (metodos.cae && metodos.tir) {
            const caeAnalisis = analizarCAE(resultadosA.cae, resultadosB.cae);
            const tirAnalisis = analizarTIR(resultadosA.tir, resultadosB.tir, tasaDescuentoA, tasaDescuentoB);
            
            analisisCompleto += `${caeAnalisis.analisis}
`;
            analisisCompleto += `${tirAnalisis.analisis}
`;
            
            if (comparacion.mejorCAE === comparacion.mejorTIR) {
                recomendacion = `${analisisCompleto}\nAnálisis Integrado: CAE y TIR coinciden.`;
                recomendacion += `\nLa Alternativa ${comparacion.mejorCAE} es superior tanto en costos anualizados como en rentabilidad porcentual.`;
            } else {
                recomendacion = `${analisisCompleto}\nAnálisis de Conflicto:`;
                recomendacion += `\nCAE favorece Alternativa ${comparacion.mejorCAE} (costos menores).`;
                recomendacion += `\nTIR favorece Alternativa ${comparacion.mejorTIR} (mayor rentabilidad).`;
                recomendacion += `\nSe recomienda Alternativa ${comparacion.mejorCAE} (mejor CAE).`;
                recomendacion += `\nPriorizando eficiencia de costos.`;
            }
        }
    }
    // CASO 3: Los tres métodos seleccionados
    else {
        const vpnAnalisis = analizarVPN(resultadosA.vpn, resultadosB.vpn);
        const caeAnalisis = analizarCAE(resultadosA.cae, resultadosB.cae);
        const tirAnalisis = analizarTIR(resultadosA.tir, resultadosB.tir, tasaDescuentoA, tasaDescuentoB);
        
        let analisisCompleto = `${vpnAnalisis.analisis}
`;
        analisisCompleto += `${caeAnalisis.analisis}
`;
        analisisCompleto += `${tirAnalisis.analisis}
`;
        
        if (vidasDiferentes) {
            recomendacion = `${analisisCompleto}\nDecisión Multicriterio (Vidas Útiles Diferentes):`;
            recomendacion += `\nCon vidas útiles distintas (${vidaUtilA} vs ${vidaUtilB} años), el CAE es el criterio más relevante.`;
            recomendacion += `\nSe recomienda Alternativa ${comparacion.mejorCAE} por su inferior CAE.`;
            recomendacion += `\nSignifica menores costos anualizados en el período de evaluación común.`;
        } else {
            let conteoA = 0, conteoB = 0;
            let criteriosGanadoresA = [], criteriosGanadoresB = [];
            
            if (comparacion.mejorVPN === 'A') { conteoA++; criteriosGanadoresA.push('VPN'); } 
            else { conteoB++; criteriosGanadoresB.push('VPN'); }
            
            if (comparacion.mejorCAE === 'A') { conteoA++; criteriosGanadoresA.push('CAE'); } 
            else { conteoB++; criteriosGanadoresB.push('CAE'); }
            
            if (comparacion.mejorTIR === 'A') { conteoA++; criteriosGanadoresA.push('TIR'); } 
            else { conteoB++; criteriosGanadoresB.push('TIR'); }
            
            if (conteoA > conteoB) {
                recomendacion = `${analisisCompleto}\nDecisión Multicriterio (Votación 3/3):`;
                recomendacion += `\nAlternativa A gana en ${conteoA} de 3 criterios: ${criteriosGanadoresA.join(', ')}.`;
                recomendacion += `\nAlternativa B gana en ${conteoB} criterio: ${criteriosGanadoresB.join(', ')}.`;
                recomendacion += `\nSe recomienda Alternativa A como la opción superior desde análisis holístico.`;
            } else if (conteoB > conteoA) {
                recomendacion = `${analisisCompleto}\nDecisión Multicriterio (Votación 3/3):`;
                recomendacion += `\nAlternativa B gana en ${conteoB} de 3 criterios: ${criteriosGanadoresB.join(', ')}.`;
                recomendacion += `\nAlternativa A gana en ${conteoA} criterio: ${criteriosGanadoresA.join(', ')}.`;
                recomendacion += `\nSe recomienda Alternativa B como la opción superior desde análisis holístico.`;
            } else if (comparacion.mejorVPN === comparacion.mejorTIR) {
                recomendacion = `${analisisCompleto}\nDecisión Multicriterio (Análisis Técnico):`;
                recomendacion += `\nHay divergencia con CAE, pero VPN y TIR convergen en Alternativa ${comparacion.mejorVPN}.`;
                recomendacion += `\nSe recomienda Alternativa ${comparacion.mejorVPN}.`;
                recomendacion += `\nPriorizando valor absoluto y rendimiento.`;
            } else {
                recomendacion = `${analisisCompleto}\nDecisión Multicriterio (Conflicto Técnico):`;
                recomendacion += `\nExiste divergencia entre criterios.`;
                recomendacion += `\nVPN favorece Alternativa ${comparacion.mejorVPN}.`;
                recomendacion += `\nTIR favorece Alternativa ${comparacion.mejorTIR}.`;
                recomendacion += `\nCAE favorece Alternativa ${comparacion.mejorCAE}.`;
                recomendacion += `\nRequiere evaluar objetivos estratégicos: ¿Maximizar valor? ¿Optimizar rentabilidad? ¿Minimizar costos?`;
            }
        }
    }

    return {
        comparacion,
        vidasDiferentes,
        recomendacion
    };
}

/**
 * Formatea un número como moneda (Formato El Salvador)
 * Separador de miles: , (coma)
 * Separador decimal: . (punto)
 * Signo: $ a la izquierda
 * Ejemplo: $1,234,567.89
 * @param {number} valor - Valor a formatear
 * @returns {string} Valor formateado
 */
function formatearMoneda(valor) {
    // Asegurar que es un número
    const num = parseFloat(valor);
    
    // Separar en parte entera y decimal
    const partes = num.toFixed(2).split('.');
    const parteEntera = partes[0];
    const parteDecimal = partes[1];
    
    // Agregar separador de miles a la parte entera
    const enteroFormateado = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Retornar con formato: $X,XXX,XXX.XX
    return `$${enteroFormateado}.${parteDecimal}`;
}

/**
 * Formatea un número como porcentaje
 * @param {number} valor - Valor a formatear
 * @returns {string} Valor formateado
 */
function formatearPorcentaje(valor) {
    return parseFloat(valor).toFixed(2) + '%';
}

/**
 * Formatea un número con 2 decimales y separador de miles
 * Formato El Salvador: X,XXX,XXX.XX
 * @param {number} valor - Valor a formatear
 * @returns {string} Valor formateado
 */
function formatearNumero(valor) {
    const num = parseFloat(valor);
    const partes = num.toFixed(2).split('.');
    const parteEntera = partes[0];
    const parteDecimal = partes[1];
    
    // Agregar separador de miles
    const enteroFormateado = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return `${enteroFormateado}.${parteDecimal}`;
}
