FASE 1

Contexto: Soy estudiante de ingeniería y necesito desarrollar un sistema de evaluación financiera.Stack Tecnológico: HTML5, CSS3 (Bootstrap 5) y JavaScript (Vanilla).Tarea: Crea una aplicación de una sola página (SPA) con una interfaz limpia y profesional que permita:Entrada de Datos: Dos columnas para comparar "Alternativa A" y "Alternativa B". Campos: Inversión Inicial, Tasa de Descuento (%), Vida Útil (años), Flujo de Efectivo Anual y Valor de Salvamento.Cálculos Financieros (JS):VPN: Suma de flujos descontados.CAE: Basado en la fórmula de anualidad: $A = P \times \frac{i(1+i)^n}{(1+i)^n - 1}$.TIR: Cálculo mediante el método de bisección o aproximación para encontrar la tasa donde el VPN sea cero.Comparación: Un cuadro de resultados que destaque en verde la mejor alternativa según cada método (Mayor VPN, Mayor TIR, Menor CAE).Exportación: Botón para generar un archivo PDF con el resumen de los cálculos (puedes usar la CDN de jspdf).Estilo: Usa Bootstrap 5 para que se vea moderno. Incluye validaciones para que los campos no queden vacíos.

FASE 2

2. Estructura de Archivos Recomendada
Para mantener el orden en tu grupo de trabajo, les sugiero organizar el código así:

index.html: Estructura de los formularios y la tabla de resultados (usando clases de Bootstrap).

style.css: Personalización mínima (colores corporativos, márgenes).

finance.js: Toda la lógica matemática. Mantengan las funciones separadas: calcularVPN(), calcularCAE(), calcularTIR().

report.js: Función específica para tomar los resultados y generar el PDF.

FASE 3

. Tips para el Éxito del Proyecto
Librería para el PDF: En su index.html, agreguen este script antes de cerrar el <body>:
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
Esto les ahorrará horas de trabajo para cumplir con el requisito del reporte.

Manejo de Vidas Diferentes: Si la Alternativa A dura 3 años y la B dura 6, el CAE es el criterio de desempate real. Agreguen una pequeña nota de texto en su interfaz que diga: "En alternativas con vida útil distinta, el CAE es el método preferido". Eso les dará puntos extra con su profesor por el criterio técnico.

Validación de Datos: Asegúrense de que si el usuario ingresa una Tasa de Interés del 15%, el código lo convierta a 0.15 antes de operar. Es el error más común en estos sistemas.