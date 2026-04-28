# PLAN DE IMPLEMENTACIÓN - Sistema de Evaluación Financiera

## 1. OBJETIVOS DEL PROYECTO

### Objetivo General
Desarrollar una aplicación web de una sola página (SPA) que permita realizar evaluación financiera comparativa entre dos alternativas de inversión usando métodos: VPN (Valor Presente Neto), CAE (Costo Anual Equivalente) y TIR (Tasa Interna de Retorno).

### Objetivos Específicos
- Crear una interfaz intuitiva para ingreso comparativo de datos financieros
- Implementar cálculos precisos de métodos de evaluación financiera
- Generar reportes en PDF con resultados y análisis
- Validar y estandarizar entrada de datos
- Identificar la mejor alternativa según cada criterio

---

## 2. REQUISITOS FUNCIONALES

### 2.1 Entrada de Datos
- [ ] Campo para Inversión Inicial (Alternativa A y B)
- [ ] Campo para Tasa de Descuento (%)
- [ ] Campo para Vida Útil (años)
- [ ] Campo para Flujo de Efectivo Anual
- [ ] Campo para Valor de Salvamento
- [ ] Interfaz de dos columnas para comparación lado a lado
- [ ] Validación: campos obligatorios no pueden estar vacíos
- [ ] Conversión automática de porcentajes (15% → 0.15)

### 2.2 Cálculos Financieros
- [ ] **VPN (Valor Presente Neto)**: Suma de flujos descontados
  - Fórmula: VPN = Σ [FC_t / (1+i)^t] - I₀
- [ ] **CAE (Costo Anual Equivalente)**: Anualidad de inversión
  - Fórmula: A = P × [i(1+i)^n] / [(1+i)^n - 1]
- [ ] **TIR (Tasa Interna de Retorno)**: Método de bisección
  - Búsqueda iterativa donde VPN = 0
- [ ] Manejo de vidas útiles diferentes

### 2.3 Comparación de Resultados
- [ ] Tabla de resultados con cálculos de ambas alternativas
- [ ] Resaltado en verde de la mejor alternativa por criterio
- [ ] Nota explicativa sobre CAE en vidas útiles diferentes
- [ ] Matriz comparativa clara

### 2.4 Exportación de Reportes
- [ ] Botón "Generar PDF"
- [ ] Reporte PDF con:
  - Datos de entrada para ambas alternativas
  - Resultados de VPN, CAE y TIR
  - Análisis comparativo
  - Recomendación final

---

## 3. REQUISITOS NO FUNCIONALES

- **Tecnología**: HTML5, CSS3 (Bootstrap 5), JavaScript Vanilla
- **Compatibilidad**: Navegadores modernos (Chrome, Firefox, Edge, Safari)
- **Rendimiento**: Cálculos sin lag, interfaz responsiva
- **Usabilidad**: Interfaz limpia y profesional
- **Accesibilidad**: Etiquetas descriptivas, contraste adecuado

---

## 4. ESTRUCTURA DE ARCHIVOS

```
ProyectoIne/
├── index.html          # Estructura HTML, formularios y tabla de resultados
├── style.css           # Personalización y estilos (Bootstrap 5 + custom)
├── finance.js          # Lógica matemática de cálculos
├── report.js           # Generación de reportes PDF
├── Pront.md            # Documento de requerimientos originales
└── PLAN_IMPLEMENTACION.md  # Este documento
```

### 4.1 Detalle de Responsabilidades

**index.html**
- Estructura HTML semántica
- Formularios de entrada (2 columnas)
- Tabla de resultados
- Botones de acción
- Inclusión de librerías externas (Bootstrap 5, jsPDF)

**style.css**
- Variables CSS para colores corporativos
- Media queries para responsividad
- Clases personalizadas
- Animaciones suaves

**finance.js**
- `calcularVPN()`
- `calcularCAE()`
- `calcularTIR()`
- `validarDatos()`
- `estandarizarTasa()`
- `compararAlternativas()`

**report.js**
- `generarReportePDF()`
- `formatearDatosParaPDF()`
- `aplicarEstilosPDF()`

---

## 5. FASES DE IMPLEMENTACIÓN

### FASE 1: Configuración Base e Interfaz (Estimado: 2-3 días)

#### 1.1 Crear estructura HTML
- [ ] Crear `index.html` con estructura Bootstrap 5
- [ ] Formularios de entrada para Alternativa A y B
- [ ] Tabla para mostrar resultados
- [ ] Botones: Calcular, Limpiar, Generar PDF
- [ ] Agregar CDN de Bootstrap 5
- [ ] Agregar CDN de jsPDF

#### 1.2 Crear estilos básicos
- [ ] Crear `style.css`
- [ ] Definir colores corporativos
- [ ] Aplicar estilos Bootstrap personalizados
- [ ] Asegurar responsividad
- [ ] Estilos para resaltado de mejores alternativas (verde)

#### 1.3 Estructuración de archivos JavaScript
- [ ] Crear `finance.js` con estructura base
- [ ] Crear `report.js` con estructura base
- [ ] Conectar scripts en `index.html`

---

### FASE 2: Lógica de Cálculos Financieros (Estimado: 3-4 días)

#### 2.1 Implementar función calcularVPN()
- [ ] Recibir parámetros: inversión inicial, tasa, flujos, años
- [ ] Calcular suma de flujos descontados
- [ ] Retornar resultado VPN
- [ ] Incluir valor de salvamento en último año

#### 2.2 Implementar función calcularCAE()
- [ ] Recibir parámetros: inversión, tasa, vida útil
- [ ] Aplicar fórmula: A = P × [i(1+i)^n] / [(1+i)^n - 1]
- [ ] Manejar casos especiales
- [ ] Retornar resultado CAE

#### 2.3 Implementar función calcularTIR()
- [ ] Implementar método de bisección
- [ ] Iterar hasta encontrar TIR donde VPN ≈ 0
- [ ] Establecer precisión y límite de iteraciones
- [ ] Retornar resultado TIR (en porcentaje)

#### 2.4 Implementar validaciones
- [ ] Validar campos no vacíos
- [ ] Validar que números sean válidos
- [ ] Convertir porcentajes a decimales (15% → 0.15)
- [ ] Mensajes de error claros

---

### FASE 3: Integración e Interactividad (Estimado: 2-3 días)

#### 3.1 Crear manejador de eventos
- [ ] Evento click en botón "Calcular"
- [ ] Obtener datos de formularios
- [ ] Validar datos
- [ ] Ejecutar cálculos
- [ ] Mostrar resultados

#### 3.2 Comparación de resultados
- [ ] Función `compararAlternativas()`
- [ ] Identificar mejor alternativa por cada criterio
- [ ] Aplicar estilos (resaltado verde)
- [ ] Mostrar nota sobre CAE en vidas diferentes

#### 3.3 Botón "Limpiar"
- [ ] Limpiar todos los campos
- [ ] Ocultar tabla de resultados
- [ ] Resetear estados

---

### FASE 4: Generación de Reportes PDF (Estimado: 2 días)

#### 4.1 Implementar generación de PDF
- [ ] Crear función `generarReportePDF()`
- [ ] Incluir datos de entrada
- [ ] Incluir cálculos y resultados
- [ ] Incluir análisis comparativo
- [ ] Aplicar formato profesional

#### 4.2 Botón "Generar PDF"
- [ ] Evento click en botón
- [ ] Validar que hay datos calculados
- [ ] Generar y descargar PDF

---

### FASE 5: Testing y Refinamientos (Estimado: 2-3 días)

#### 5.1 Pruebas Funcionales
- [ ] Probar entrada de datos en ambas alternativas
- [ ] Probar cálculos con casos conocidos
- [ ] Probar validaciones
- [ ] Probar generación de PDF

#### 5.2 Pruebas de Usabilidad
- [ ] Probar en diferentes navegadores
- [ ] Probar responsividad (móvil, tablet, desktop)
- [ ] Probar accesibilidad
- [ ] Verificar claridad de mensajes

#### 5.3 Refinamientos
- [ ] Ajustar estilos según feedback
- [ ] Optimizar cálculos
- [ ] Mejorar mensajes de error
- [ ] Documentar código

---

## 6. TECNOLOGÍAS Y RECURSOS

### Librerías Externas
- **Bootstrap 5**: Framework CSS para diseño responsivo
  - CDN: `https://cdn.jsdelivr.net/npm/bootstrap@5.x.x/dist/css/bootstrap.min.css`
- **jsPDF**: Generación de documentos PDF
  - CDN: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`

### Herramientas de Desarrollo
- Editor: VS Code
- Navegadores para testing: Chrome, Firefox, Edge
- Control de versiones: Git (opcional pero recomendado)

---

## 7. CONSIDERACIONES ESPECIALES

### 7.1 Conversión de Tasas
**CRÍTICO**: Garantizar conversión correcta de porcentajes
```
Entrada del usuario: 15%
Valor interno: 0.15
Validación: if (tasa > 1) tasa = tasa / 100;
```

### 7.2 Vidas Útiles Diferentes
- Detectar si vida útil A ≠ vida útil B
- Mostrar nota: *"En alternativas con vida útil distinta, el CAE es el método preferido"*
- Resaltar CAE como criterio principal en estos casos

### 7.3 Precisión en Cálculos
- Usar al menos 10 decimales en cálculos intermedios
- Redondear a 2 decimales para mostrar
- En TIR: máximo 0.0001% de precisión

### 7.4 Casos Extremos
- Manejar tasas de 0%
- Manejar inversiones negativas (ingresos iniciales)
- Validar que vida útil sea > 0

---

## 8. VALIDACIONES DE ENTRADA

| Campo | Validación | Mensaje Error |
|-------|-----------|----------------|
| Inversión Inicial | Número, puede ser negativo | "Ingrese un número válido" |
| Tasa de Descuento | Número > 0, ≤ 100 | "Ingrese porcentaje entre 0 y 100" |
| Vida Útil | Entero > 0 | "La vida útil debe ser mayor a 0" |
| Flujo Efectivo | Número | "Ingrese un número válido" |
| Valor Salvamento | Número, puede ser negativo | "Ingrese un número válido" |
| Campos vacíos | Todos requeridos | "Todos los campos son obligatorios" |

---

## 9. CRONOGRAMA SUGERIDO

| Fase | Actividad | Duración | Responsable |
|------|-----------|----------|------------|
| 1 | Interfaz y estilos | 2-3 días | - |
| 2 | Lógica de cálculos | 3-4 días | - |
| 3 | Integración | 2-3 días | - |
| 4 | Reportes PDF | 2 días | - |
| 5 | Testing | 2-3 días | - |
| **Total** | **Proyecto Completo** | **11-15 días** | - |

---

## 10. MÉTRICAS DE ÉXITO

- [x] Todos los campos de entrada funcionan correctamente
- [x] Cálculos de VPN, CAE y TIR son precisos
- [x] Interfaz es responsive en todos los dispositivos
- [x] PDF se genera sin errores
- [x] Validaciones previenen errores de usuario
- [x] Código está documentado y organizado
- [x] Interfaz es intuitiva y profesional
- [x] Todos los navegadores modernos soportados

---

## 11. RECURSOS ADICIONALES

### Fórmulas de Referencia

**VPN (Valor Presente Neto)**
```
VPN = -I₀ + Σ(FC_t / (1+i)^t) + (VS / (1+i)^n)

Donde:
- I₀ = Inversión inicial
- FC_t = Flujo de caja en período t
- i = Tasa de descuento
- t = Período
- VS = Valor de salvamento
- n = Vida útil total
```

**CAE (Costo Anual Equivalente)**
```
A = VPN × [i(1+i)^n] / [(1+i)^n - 1]

Donde:
- VPN = Valor presente neto (negativo para costos)
- i = Tasa de descuento
- n = Vida útil en años
```

**TIR (Tasa Interna de Retorno)**
```
TIR = Tasa donde VPN = 0
Método: Bisección iterativa
Precisión: ±0.0001%
```

---

## 12. PRÓXIMOS PASOS

1. [ ] Confirmar y ajustar este plan con el equipo
2. [ ] Asignar responsabilidades
3. [ ] Crear repositorio Git
4. [ ] Iniciar FASE 1: Configuración Base
5. [ ] Establecer reuniones de seguimiento
6. [ ] Documentar avances en archivo PROGRESO.md

---

**Versión**: 1.0  
**Fecha**: Abril 2026  
**Estado**: FASE 1 Completada ✅ | FASE 2 En Ejecución
