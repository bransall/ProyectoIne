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
            let vpn = -inversionInicial;
            for (let t = 1; t <= vidaUtil; t++) {
                vpn += flujoEfectivo / Math.pow(1 + tasa, t);
            }
            vpn += valorSalvamento / Math.pow(1 + tasa, vidaUtil);
            return vpn;
        }

        // Método de bisección
        let tasaBaja = -0.99;      // -99%
        let tasaAlta = 10;          // 1000%
        let tol = 0.000001;         // Tolerancia
        let maxIter = 1000;         // Máximo de iteraciones
        let iteraciones = 0;

        // Verificar que hay solución
        let vpnBaja = vpnConTasa(tasaBaja);
        let vpnAlta = vpnConTasa(tasaAlta);

        // Si ambos tienen el mismo signo, puede no haber solución o estar fuera del rango
        if ((vpnBaja > 0 && vpnAlta > 0) || (vpnBaja < 0 && vpnAlta < 0)) {
            // Ampliar el rango de búsqueda
            tasaBaja = -0.999;
            tasaAlta = 100;
            vpnBaja = vpnConTasa(tasaBaja);
            vpnAlta = vpnConTasa(tasaAlta);
        }

        // Bisección
        while ((tasaAlta - tasaBaja) > tol && iteraciones < maxIter) {
            let tasaMedia = (tasaBaja + tasaAlta) / 2;
            let vpnMedia = vpnConTasa(tasaMedia);

            if (Math.abs(vpnMedia) < tol) {
                return tasaMedia * 100; // Retornar en porcentaje
            }

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
        return tir * 100; // Retornar en porcentaje
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
    
    let analisis = `<strong>VPN - Valor Presente Neto</strong>: Mide el valor actual de los flujos netos. `;
    analisis += `La Alternativa ${mejor} tiene un VPN superior (${formatearMoneda(Math.max(vpnA, vpnB))}) comparado con ${formatearMoneda(Math.min(vpnA, vpnB))}, `;
    analisis += `una diferencia de ${formatearMoneda(diferenciaVPN)} (${porcentajeDif.toFixed(1)}%). `;
    analisis += `Esto significa que la Alternativa ${mejor} generará más valor económico después de recuperar la inversión inicial.`;
    
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
    
    let analisis = `<strong>CAE - Costo Anual Equivalente</strong>: Convierte el costo presente en un costo anual uniforme. `;
    analisis += `La Alternativa ${mejor} tiene un CAE más bajo (${formatearMoneda(Math.min(caeA, caeB))}) frente a ${formatearMoneda(Math.max(caeA, caeB))}, `;
    analisis += `una diferencia de ${formatearMoneda(diferenciaCae)} anuales (${porcentajeDif.toFixed(1)}%). `;
    analisis += `En proyectos con vidas útiles diferentes, esto es el criterio más importante pues normaliza los costos a un período común.`;
    
    return { mejor, analisis };
}

/**
 * Genera análisis técnico detallado para TIR
 */
function analizarTIR(tirA, tirB) {
    const diferenciaTir = Math.abs(tirA - tirB);
    const mejor = tirA > tirB ? 'A' : 'B';
    const peor = mejor === 'A' ? 'B' : 'A';
    
    let analisis = `<strong>TIR - Tasa Interna de Retorno</strong>: Representa la tasa de rendimiento porcentual de la inversión. `;
    analisis += `La Alternativa ${mejor} genera un retorno de ${tirA.toFixed(2)}% frente al ${tirB.toFixed(2)}% de la Alternativa ${peor}, `;
    analisis += `una diferencia de ${diferenciaTir.toFixed(2)} puntos porcentuales. `;
    analisis += `Una TIR mayor indica mejor rentabilidad relativa en el período de inversión.`;
    
    return { mejor, analisis };
}

/**
 * Compara dos alternativas de inversión SOLO basándose en los métodos seleccionados
 * @param {object} resultadosA - Resultados de Alternativa A
 * @param {object} resultadosB - Resultados de Alternativa B
 * @param {number} vidaUtilA - Vida útil de Alternativa A
 * @param {number} vidaUtilB - Vida útil de Alternativa B
 * @param {object} metodos - {vpn: boolean, cae: boolean, tir: boolean}
 * @returns {object} Comparación y recomendación técnica
 */
function compararAlternativas(resultadosA, resultadosB, vidaUtilA, vidaUtilB, metodos = {vpn: true, cae: true, tir: true}) {
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
            recomendacion = `${analisis}<br><br>`;
            recomendacion += `<strong>Conclusión:</strong> Se recomienda la Alternativa ${mejor} por su superior valor presente neto.`;
        } else if (metodos.cae) {
            const { mejor, analisis } = analizarCAE(resultadosA.cae, resultadosB.cae);
            recomendacion = `${analisis}<br><br>`;
            recomendacion += `<strong>Conclusión:</strong> Se recomienda la Alternativa ${mejor} por su menor costo anual equivalente.`;
        } else if (metodos.tir) {
            const { mejor, analisis } = analizarTIR(resultadosA.tir, resultadosB.tir);
            recomendacion = `${analisis}<br><br>`;
            recomendacion += `<strong>Conclusión:</strong> Se recomienda la Alternativa ${mejor} por su superior tasa de retorno.`;
        }
    }
    // CASO 2: Dos métodos seleccionados
    else if (metodosSeleccionados === 2) {
        let analisisCompleto = '';
        
        if (metodos.vpn && metodos.cae) {
            const vpnAnalisis = analizarVPN(resultadosA.vpn, resultadosB.vpn);
            const caeAnalisis = analizarCAE(resultadosA.cae, resultadosB.cae);
            
            analisisCompleto += `${vpnAnalisis.analisis}<br><br>`;
            analisisCompleto += `${caeAnalisis.analisis}<br><br>`;
            
            if (comparacion.mejorVPN === comparacion.mejorCAE) {
                recomendacion = `${analisisCompleto}<strong>Análisis Integrado:</strong> Ambos criterios convergen. La Alternativa ${comparacion.mejorVPN} es superior en VPN y CAE, `;
                recomendacion += `indicando una decisión clara desde perspectivas de valor absoluto y costos anualizados.`;
            } else {
                recomendacion = `${analisisCompleto}<strong>Análisis de Conflicto:</strong> VPN favorece Alternativa ${comparacion.mejorVPN} (mayor valor económico total), `;
                recomendacion += `mientras CAE favorece Alternativa ${comparacion.mejorCAE} (menores costos anuales). `;
                if (vidasDiferentes) {
                    recomendacion += `Con vidas útiles diferentes (${vidaUtilA} vs ${vidaUtilB} años), <strong>se recomienda Alternativa ${comparacion.mejorCAE}</strong> `;
                    recomendacion += `porque el CAE normaliza comparaciones entre proyectos de diferente duración.`;
                } else {
                    recomendacion += `<strong>Se recomienda Alternativa ${comparacion.mejorVPN}</strong> (mejor VPN) como criterio dominante para maximizar valor económico absoluto.`;
                }
            }
        } else if (metodos.vpn && metodos.tir) {
            const vpnAnalisis = analizarVPN(resultadosA.vpn, resultadosB.vpn);
            const tirAnalisis = analizarTIR(resultadosA.tir, resultadosB.tir);
            
            analisisCompleto += `${vpnAnalisis.analisis}<br><br>`;
            analisisCompleto += `${tirAnalisis.analisis}<br><br>`;
            
            if (comparacion.mejorVPN === comparacion.mejorTIR) {
                recomendacion = `${analisisCompleto}<strong>Análisis Integrado:</strong> VPN y TIR coinciden. La Alternativa ${comparacion.mejorVPN} ofrece tanto mayor valor `;
                recomendacion += `como superior tasa de retorno, representando la opción óptima.`;
            } else {
                recomendacion = `${analisisCompleto}<strong>Análisis de Conflicto:</strong> VPN favorece Alternativa ${comparacion.mejorVPN} (mayor creación de valor), `;
                recomendacion += `TIR favorece Alternativa ${comparacion.mejorTIR} (mayor rentabilidad porcentual). `;
                recomendacion += `<strong>Se recomienda Alternativa ${comparacion.mejorVPN}</strong> (mejor VPN) como criterio más conservador, `;
                recomendacion += `ya que asume una tasa de reinversión más realista que la TIR.`;
            }
        } else if (metodos.cae && metodos.tir) {
            const caeAnalisis = analizarCAE(resultadosA.cae, resultadosB.cae);
            const tirAnalisis = analizarTIR(resultadosA.tir, resultadosB.tir);
            
            analisisCompleto += `${caeAnalisis.analisis}<br><br>`;
            analisisCompleto += `${tirAnalisis.analisis}<br><br>`;
            
            if (comparacion.mejorCAE === comparacion.mejorTIR) {
                recomendacion = `${analisisCompleto}<strong>Análisis Integrado:</strong> CAE y TIR coinciden. La Alternativa ${comparacion.mejorCAE} es superior `;
                recomendacion += `tanto en costos anualizados como en rentabilidad porcentual.`;
            } else {
                recomendacion = `${analisisCompleto}<strong>Análisis de Conflicto:</strong> CAE favorece Alternativa ${comparacion.mejorCAE} (costos menores), `;
                recomendacion += `TIR favorece Alternativa ${comparacion.mejorTIR} (mayor rentabilidad). `;
                recomendacion += `<strong>Se recomienda Alternativa ${comparacion.mejorCAE}</strong> (mejor CAE) priorizando eficiencia de costos.`;
            }
        }
    }
    // CASO 3: Los tres métodos seleccionados
    else {
        const vpnAnalisis = analizarVPN(resultadosA.vpn, resultadosB.vpn);
        const caeAnalisis = analizarCAE(resultadosA.cae, resultadosB.cae);
        const tirAnalisis = analizarTIR(resultadosA.tir, resultadosB.tir);
        
        let analisisCompleto = `${vpnAnalisis.analisis}<br><br>`;
        analisisCompleto += `${caeAnalisis.analisis}<br><br>`;
        analisisCompleto += `${tirAnalisis.analisis}<br><br>`;
        
        if (vidasDiferentes) {
            recomendacion = `${analisisCompleto}<strong>Decisión Multicriterio (Vidas Útiles Diferentes):</strong> `;
            recomendacion += `Con vidas útiles distintas (${vidaUtilA} vs ${vidaUtilB} años), el CAE es el criterio más relevante. `;
            recomendacion += `<strong>Se recomienda Alternativa ${comparacion.mejorCAE}</strong> por su inferior CAE, `;
            recomendacion += `lo que significa menores costos anualizados en el período de evaluación común.`;
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
                recomendacion = `${analisisCompleto}<strong>Decisión Multicriterio (Votación 3/3):</strong> `;
                recomendacion += `La Alternativa A gana en ${conteoA} de 3 criterios (${criteriosGanadoresA.join(', ')}), `;
                recomendacion += `mientras Alternativa B gana en ${conteoB} criterio (${criteriosGanadoresB.join(', ')}). `;
                recomendacion += `<strong>Se recomienda Alternativa A</strong> como la opción superior desde análisis holístico.`;
            } else if (conteoB > conteoA) {
                recomendacion = `${analisisCompleto}<strong>Decisión Multicriterio (Votación 3/3):</strong> `;
                recomendacion += `La Alternativa B gana en ${conteoB} de 3 criterios (${criteriosGanadoresB.join(', ')}), `;
                recomendacion += `mientras Alternativa A gana en ${conteoA} criterio (${criteriosGanadoresA.join(', ')}). `;
                recomendacion += `<strong>Se recomienda Alternativa B</strong> como la opción superior desde análisis holístico.`;
            } else if (comparacion.mejorVPN === comparacion.mejorTIR) {
                recomendacion = `${analisisCompleto}<strong>Decisión Multicriterio (Análisis Técnico):</strong> `;
                recomendacion += `Aunque hay divergencia con CAE, VPN y TIR convergen en Alternativa ${comparacion.mejorVPN}. `;
                recomendacion += `<strong>Se recomienda Alternativa ${comparacion.mejorVPN}</strong> priorizando valor absoluto y rendimiento.`;
            } else {
                recomendacion = `${analisisCompleto}<strong>Decisión Multicriterio (Conflicto Técnico):</strong> `;
                recomendacion += `Existe divergencia entre criterios: VPN favorece ${comparacion.mejorVPN}, TIR favorece ${comparacion.mejorTIR}, CAE favorece ${comparacion.mejorCAE}. `;
                recomendacion += `Esta situación requiere evaluar los objetivos estratégicos de la empresa: ¿Maximizar valor? ¿Optimizar rentabilidad? ¿Minimizar costos?`;
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
