$(document).ready(function () {

    const API_KEY = '95176c8edea30e33338e0eaddd53a916';

    const bancoCiudades = [
        'Buenos Aires', 'Tokyo', 'London', 'New York', 'Paris', 
        'Sydney', 'Berlin', 'Rome', 'Madrid', 'Cairo', 'Toronto', 'Seoul'
    ];

    // Cargar 4 tarjetas aleatorias al inicio
    cargarCiudadesAleatorias(4);

    // Evento de búsqueda al hacer clic en el botón
    $('#btn-buscar').click(function () {
        const ciudad = $('#ciudad-input').val().trim();

        if (ciudad !== '' && patronCiudad.test(ciudad)) {
            obtenerYAgregarClima(ciudad, false); // false = no es al inicio
            $('#ciudad-input').val('');
        } else {
            mostrarToast('⚠️ Por favor, ingresa una ciudad válida', 3000, 'linear-gradient(to right, #f59e0b, #fbbf24)', '#000');
        }
    });

    // Evento de búsqueda al presionar 'Enter'
    $('#ciudad-input').keypress(function (e) {
        if (e.which === 13) {
            $('#btn-buscar').click();
        }
    });

    // Evento para eliminar tarjeta
    $(document).on('click', '.btn-eliminar', function () {
        $(this).closest('.tarjeta').fadeOut(300, function () {$(this).remove();});
    });

    // Toastify centralizado
    function mostrarToast(texto, duracion, fondo, color) {
        Toastify({
            text: texto,
            duration: duracion,
            gravity: 'top',
            position: 'right',
            style: {
                background: fondo,
                color: color,
                borderRadius: '8px',
                fontWeight: 'bold'
            }
        }).showToast();
    }

    // Normaliza: minúsculas, sin tildes
    function normalizar(texto) {
        return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    // Patrón válido: letras (con tildes), espacios, ., ', -
    const patronCiudad = /^[\p{L}\s.'-]+$/u;

    // Obtener N ciudades aleatorias sin repetir del array
    function cargarCiudadesAleatorias(cantidad) {
        const ciudadesMezcladas = bancoCiudades.sort(() => 0.5 - Math.random());
        const seleccionadas = ciudadesMezcladas.slice(0, cantidad);

        seleccionadas.forEach(ciudad => {
            obtenerYAgregarClima(ciudad, true); // true = carga inicial
        });
    }

    // Petición AJAX con $.getJSON + skeleton
    function obtenerYAgregarClima(ciudad, alInicio) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(ciudad)}&appid=${API_KEY}&units=metric&lang=es`;

        // Insertar skeleton antes de la petición
        const skeletonHTML = `
            <div class="tarjeta tarjeta-esqueleto" aria-hidden="true">
                <div class="contenido-tarjeta">
                    <div class="esqueleto esqueleto-titulo"></div>
                    <div class="esqueleto esqueleto-icono"></div>
                    <div class="esqueleto esqueleto-temperatura"></div>
                    <div class="esqueleto esqueleto-descripcion"></div>
                    <div class="esqueleto esqueleto-pildora"></div>
                </div>
            </div>
        `;
        const $skeleton = $(skeletonHTML);
        if (alInicio) {
            $('#grid-clima').prepend($skeleton);
        } else {
            $('#grid-clima').append($skeleton);
        }

        $.getJSON(url)
            .done(function (data) {
                const nombreCiudad = data.name;
                
                // ==========================================
                // VALIDACIÓN: EVITAR CIUDADES DUPLICADAS
                // Compara nombre canónico contra data-name de tarjetas
                // ==========================================
                let ciudadExiste = false;
                const nombreNorm = normalizar(nombreCiudad);
                
                $('.tarjeta').each(function () {
                    const dataName = $(this).data('name');
                    if (dataName && normalizar(dataName) === nombreNorm) {
                        ciudadExiste = true;
                        
                        if (!alInicio) {
                            $(this)
                                   .fadeOut(150).fadeIn(150)
                                   .fadeOut(150).fadeIn(150);
                        }
                    }
                });

                if (ciudadExiste) {
                    $skeleton.remove();
                    if (!alInicio) {
                        mostrarToast(`ℹ️ La ciudad "${nombreCiudad}" ya está en pantalla`, 2500, 'linear-gradient(to right, #0284c7, #38bdf8)', '#fff');
                    }
                    return;
                }

                const temperatura = Math.round(data.main.temp);
                const descripcion = data.weather[0].description;
                const humedad = data.main.humidity;
                const icono = data.weather[0].icon;
                const iconCode = icono.replace(/[dn]$/, ''); // quita d/n para data-clima

                // Mapear icono a data-clima
                let dataClima = 'nublado';
                if (iconCode === '01') dataClima = icono.endsWith('d') ? 'soleado' : 'noche';
                else if (['02', '03', '04', '50'].includes(iconCode)) dataClima = 'nublado';
                else if (['09', '10'].includes(iconCode)) dataClima = 'lluvia';
                else if (iconCode === '11') dataClima = 'tormenta';
                else if (iconCode === '13') dataClima = 'nieve';

                const tarjetaHTML = `
                    <div class="tarjeta" data-clima="${dataClima}" data-name="${nombreCiudad}">
                        <button class="btn-eliminar" title="Eliminar tarjeta" aria-label="Eliminar tarjeta">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <div class="contenido-tarjeta">
                            <h2 class="titulo-tarjeta">${nombreCiudad}</h2>
                            <img class="imagen-tarjeta" src="https://openweathermap.org/img/wn/${icono}@2x.png" alt="${descripcion}">
                            <p class="temperatura-tarjeta">${temperatura}°C</p>
                            <p class="descripcion-tarjeta">${descripcion}</p>
                            <div class="humedad-tarjeta">
                                <i class="fa-solid fa-droplet"></i> Humedad: ${humedad}%
                            </div>
                        </div>
                    </div>
                `;

                $skeleton.replaceWith(tarjetaHTML);
            })
            .fail(function () {
                $skeleton.remove();
                if (!alInicio) {
                    mostrarToast(`❌ No se encontró "${ciudad}". Intenta con otra.`, 3500, 'linear-gradient(to right, #b91c1c, #ef4444)', '#fff');
                }
            });
    }

});