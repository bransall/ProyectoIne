// ============================================================================
// GRAPHS.JS - Gestión de Gráficos con Chart.js
// ============================================================================

// Variables globales para los gráficos
let chartVPN = null;
let chartCAE = null;
let chartTIR = null;

// ============================================================================
// 1. FUNCIÓN PARA LIMPIAR GRÁFICOS ANTERIORES
// ============================================================================

function limpiarGraficos() {
    if (chartVPN) chartVPN.destroy();
    if (chartCAE) chartCAE.destroy();
    if (chartTIR) chartTIR.destroy();
    
    chartVPN = null;
    chartCAE = null;
    chartTIR = null;
}

// ============================================================================
// 2. FUNCIÓN PARA CREAR GRÁFICO VPN
// ============================================================================

function crearGraficoVPN(vpnA, vpnB) {
    const ctx = document.getElementById('chartVPN');
    
    if (!ctx) return;
    
    // Determinar colores según si es positivo o negativo
    const colorA = vpnA >= 0 ? '#28a745' : '#dc3545';
    const colorB = vpnB >= 0 ? '#28a745' : '#dc3545';
    
    chartVPN = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Alternativa A', 'Alternativa B'],
            datasets: [{
                label: 'VPN ($)',
                data: [vpnA, vpnB],
                backgroundColor: [colorA, colorB],
                borderColor: [colorA, colorB],
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatearMoneda(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-ES');
                        }
                    }
                }
            }
        }
    });
}

// ============================================================================
// 3. FUNCIÓN PARA CREAR GRÁFICO CAE
// ============================================================================

function crearGraficoCAE(caeA, caeB) {
    const ctx = document.getElementById('chartCAE');
    
    if (!ctx) return;
    
    chartCAE = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Alternativa A', 'Alternativa B'],
            datasets: [{
                label: 'CAE ($)',
                data: [caeA, caeB],
                backgroundColor: ['#ffc107', '#fd7e14'],
                borderColor: ['#ffc107', '#fd7e14'],
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatearMoneda(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-ES');
                        }
                    }
                }
            }
        }
    });
}

// ============================================================================
// 4. FUNCIÓN PARA CREAR GRÁFICO TIR
// ============================================================================

function crearGraficoTIR(tirA, tirB) {
    const ctx = document.getElementById('chartTIR');
    
    if (!ctx) return;
    
    chartTIR = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Alternativa A', 'Alternativa B'],
            datasets: [{
                label: 'TIR (%)',
                data: [tirA, tirB],
                backgroundColor: ['#0d6efd', '#0dcaf0'],
                borderColor: ['#0d6efd', '#0dcaf0'],
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatearPorcentaje(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        }
                    }
                }
            }
        }
    });
}

// ============================================================================
// 5. FUNCIÓN PARA ACTUALIZAR TODOS LOS GRÁFICOS
// ============================================================================

function actualizarGraficos(resultadosA, resultadosB, metodos) {
    // Limpiar gráficos anteriores
    limpiarGraficos();
    
    // Obtener contenedores de gráficos
    const chartVPNContainer = document.getElementById('chartVPN')?.parentElement?.parentElement;
    const chartCAEContainer = document.getElementById('chartCAE')?.parentElement?.parentElement;
    const chartTIRContainer = document.getElementById('chartTIR')?.parentElement?.parentElement;
    
    // Mostrar/ocultar y crear gráficos según los métodos seleccionados
    if (metodos.vpn) {
        if (chartVPNContainer) chartVPNContainer.style.display = '';
        crearGraficoVPN(resultadosA.vpn, resultadosB.vpn);
    } else {
        if (chartVPNContainer) chartVPNContainer.style.display = 'none';
    }
    
    if (metodos.cae) {
        if (chartCAEContainer) chartCAEContainer.style.display = '';
        crearGraficoCAE(resultadosA.cae, resultadosB.cae);
    } else {
        if (chartCAEContainer) chartCAEContainer.style.display = 'none';
    }
    
    if (metodos.tir) {
        if (chartTIRContainer) chartTIRContainer.style.display = '';
        crearGraficoTIR(resultadosA.tir, resultadosB.tir);
    } else {
        if (chartTIRContainer) chartTIRContainer.style.display = 'none';
    }
}

// ============================================================================
// 6. FUNCIÓN PARA AJUSTAR ALTURA DE GRÁFICOS RESPONSIVAMENTE
// ============================================================================

function ajustarAlturaGraficos() {
    const contenedores = document.querySelectorAll('[class*="col-"]');
    
    contenedores.forEach(contenedor => {
        const canvas = contenedor.querySelector('canvas');
        if (canvas && canvas.parentElement) {
            // Ajustar altura según ancho de pantalla
            if (window.innerWidth < 768) {
                canvas.parentElement.style.minHeight = '250px';
            } else {
                canvas.parentElement.style.minHeight = '300px';
            }
        }
    });
}

// ============================================================================
// 7. EVENT LISTENER PARA REDIMENSIONAMIENTO
// ============================================================================

window.addEventListener('resize', function() {
    ajustarAlturaGraficos();
    
    // Redibujar gráficos al cambiar el tamaño
    if (chartVPN) chartVPN.resize();
    if (chartCAE) chartCAE.resize();
    if (chartTIR) chartTIR.resize();
});

// ============================================================================
// 8. INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    ajustarAlturaGraficos();
});
