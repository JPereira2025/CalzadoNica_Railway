// --- MÓDULO: DASHBOARD ---
// Etapas del módulo:
// 1. loadDashboardStats(): carga las métricas de productos, empleados, categorías y estilos.
// 2. setupCarousel(): inicializa el carrusel de imágenes del dashboard.
// 3. renderiza estadísticas y gestiona la UI del panel principal.

/**
 * Carga y muestra las estadísticas del dashboard
 */
function loadDashboardStats() {
    Promise.all([
        apiCall('stats.php?type=productos'),
        apiCall('stats.php?type=empleados'),
        apiCall('stats.php?type=categorias'),
        apiCall('stats.php?type=estilos')
    ]).then(([prod, emp, cat, est]) => {
        $("#stat-productos").text(prod.count || 0);
        $("#stat-empleados").text(emp.count || 0);
        $("#stat-categorias").text(cat.count || 0);
        $("#stat-estilos").text(est.count || 0);
    }).catch(error => {
        console.error('Error cargando estadísticas:', error);
        showNotification('No se pudieron cargar las estadísticas.', 'warning');
    });
}

/**
 * Configura el carrusel de imágenes del dashboard
 */
function setupCarousel() {
    let currentSlide = 0;
    const slides = $('.carousel-slide');
    const indicators = $('.carousel-indicator');
    const totalSlides = slides.length;

    function showSlide(index) {
        slides.css('opacity', '0');
        indicators.css('opacity', '0.5');
        $(slides[index]).css('opacity', '1');
        $(indicators[index]).css('opacity', '1');
        currentSlide = index;
    }

    function nextSlide() {
        showSlide((currentSlide + 1) % totalSlides);
    }

    function prevSlide() {
        showSlide((currentSlide - 1 + totalSlides) % totalSlides);
    }

    // Inicializar
    showSlide(0);

    // Cambio automático cada 5 segundos
    setInterval(nextSlide, 5000);

    // Botones
    $('#nextBtn').on('click', nextSlide);
    $('#prevBtn').on('click', prevSlide);

    // Indicadores
    indicators.on('click', function() {
        showSlide($(this).data('slide'));
    });
}
