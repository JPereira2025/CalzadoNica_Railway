// --- MÓDULO: DASHBOARD ---
// Etapas del módulo:
// 1. loadDashboardStats(): carga las métricas de productos, empleados, categorías y estilos.
// 2. setupCarousel(): inicializa el carrusel de imágenes del dashboard.
// 3. renderiza estadísticas y gestiona la UI del panel principal.

/**
 * Carga y muestra las estadísticas del dashboard
 */
function loadDashboardStats() {
    apiCall('stats.php')
        .then(stats => {
            $("#stat-productos").text(stats.productos || 0);
            $("#stat-empleados").text(stats.empleados || 0);
            $("#stat-categorias").text(stats.categorias || 0);
            $("#stat-estilos").text(stats.estilos || 0);

            const ventasCount = stats.ventas || 0;
            const ventasPares = stats.ventas_pares || 0;
            const ingresos = Number(stats.ventas_total || 0);

            $("#stat-ventas").text(ventasCount);
            $("#stat-ventas-pares").text(ventasPares);
            $("#stat-ingresos").text('C$' + ingresos.toFixed(2).replace(new RegExp('\\B(?=(\\d{3})+(?!\\d))', 'g'), ","));
        })
        .catch(error => {
            console.error('Error cargando estadísticas:', error);
            showNotification('No se pudieron cargar las estadísticas.', 'warning');
        });
}

/**
 * Configura el carrusel de imágenes del dashboard
 */
function setupCarousel() {
    const $page = $('#dashboard-page');
    if ($page.data('carousel-initialized')) return;

    const slides = $page.find('.carousel-slide');
    const indicators = $page.find('.carousel-indicator');
    const totalSlides = slides.length;
    if (totalSlides === 0) return;

    let currentSlide = 0;

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

    // Botones e indicadores delegados dentro de la página
    $page.off('click', '#nextBtn').on('click', '#nextBtn', nextSlide);
    $page.off('click', '#prevBtn').on('click', '#prevBtn', prevSlide);
    $page.off('click', '.carousel-indicator').on('click', '.carousel-indicator', function() {
        showSlide($(this).data('slide'));
    });
    $page.data('carousel-initialized', true);
}
