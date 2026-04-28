/**
 * Sistema de Temas (Claro/Oscuro)
 * Gestiona la alternancia entre temas y persistencia en LocalStorage
 */

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'appTheme';
        this.LIGHT_THEME = 'light';
        this.DARK_THEME = 'dark';
        this.init();
    }

    /**
     * Inicializa el sistema de temas
     */
    init() {
        // Detectar tema guardado o preferencia del sistema
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const themeToUse = savedTheme || (systemPrefersDark ? this.DARK_THEME : this.LIGHT_THEME);
        
        this.setTheme(themeToUse);
        
        // Escuchar cambios en la preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.setTheme(e.matches ? this.DARK_THEME : this.LIGHT_THEME);
            }
        });

        // Crear botón selector de tema cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            this.crearBotonesControlador();
        });

        // Si el documento ya está cargado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.crearBotonesControlador());
        } else {
            this.crearBotonesControlador();
        }
    }

    /**
     * Establece el tema activo
     * @param {string} theme - 'light' o 'dark'
     */
    setTheme(theme) {
        const validTheme = [this.LIGHT_THEME, this.DARK_THEME].includes(theme) ? theme : this.LIGHT_THEME;
        
        document.documentElement.setAttribute('data-theme', validTheme);
        localStorage.setItem(this.STORAGE_KEY, validTheme);
        
        // Actualizar ícono del botón si existe
        this.actualizarBotonesControlador(validTheme);
    }

    /**
     * Alterna entre temas
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || this.LIGHT_THEME;
        const newTheme = currentTheme === this.LIGHT_THEME ? this.DARK_THEME : this.LIGHT_THEME;
        this.setTheme(newTheme);
    }

    /**
     * Obtiene el tema actual
     * @returns {string} 'light' o 'dark'
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || this.LIGHT_THEME;
    }

    /**
     * Crea el botón selector de tema en el navbar
     */
    crearBotonesControlador() {
        // Buscar el contenedor del navbar
        const navbarContainer = document.querySelector('.navbar .d-flex');
        
        if (!navbarContainer) return;

        // Verificar si ya existe el botón
        if (document.querySelector('#btnToggleTheme')) return;

        // Crear botón
        const btnToggleTheme = document.createElement('button');
        btnToggleTheme.id = 'btnToggleTheme';
        btnToggleTheme.className = 'btn btn-light btn-sm ms-2';
        btnToggleTheme.title = 'Alternar tema (Claro/Oscuro)';
        btnToggleTheme.style.transition = 'all 0.3s ease';
        
        // Insertar antes del span
        const span = navbarContainer.querySelector('span');
        if (span) {
            navbarContainer.insertBefore(btnToggleTheme, span);
        } else {
            navbarContainer.appendChild(btnToggleTheme);
        }

        this.actualizarBotonesControlador(this.getCurrentTheme());
        
        // Event listener
        btnToggleTheme.addEventListener('click', () => {
            this.toggleTheme();
            // Animación
            btnToggleTheme.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                btnToggleTheme.style.transform = 'rotate(0deg)';
            }, 300);
        });
    }

    /**
     * Actualiza la apariencia del botón según el tema
     */
    actualizarBotonesControlador(theme) {
        const btnToggleTheme = document.querySelector('#btnToggleTheme');
        if (!btnToggleTheme) return;

        if (theme === this.DARK_THEME) {
            btnToggleTheme.innerHTML = '☀️ Claro';
        } else {
            btnToggleTheme.innerHTML = '🌙 Oscuro';
        }
    }
}

// Inicializar al cargar el script
const themeManager = new ThemeManager();

// Hacer disponible globalmente
window.toggleTheme = () => themeManager.toggleTheme();
window.setTheme = (theme) => themeManager.setTheme(theme);
