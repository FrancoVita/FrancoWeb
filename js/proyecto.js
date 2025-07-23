async function cargarDetalleProyecto() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));

  if (!id) {
    alert('ID de proyecto no proporcionado');
    return;
  }

  try {
    const res = await fetch('/data/proyectos.json');
    const proyectos = await res.json();
    const proyecto = proyectos.find(p => p.id === id);

    if (!proyecto) {
      document.getElementById('titulo').innerText = 'Proyecto no encontrado';
      return;
    }

    document.getElementById('titulo').innerText = proyecto.descripcion;
    document.getElementById('descripcionLarga').innerText = proyecto.descripcionLarga || '';

    const galeria = document.getElementById('galeria');
    galeria.innerHTML = '';

    // Normalizamos rutas
    const imagenes = proyecto.imagenes.map(url =>
      url.startsWith('http') || url.startsWith('/') ? url : '/' + url
    );

    imagenes.forEach((url, index) => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = "Imagen del proyecto";
      img.onclick = () => mostrarLightbox(index, imagenes);
      galeria.appendChild(img);
    });

  } catch (err) {
    console.error('Error al cargar proyecto:', err);
  }
}

// Abre el modal y configura el carrusel con las imágenes
function mostrarLightbox(indexInicial, imagenes) {
  const carouselInner = document.getElementById('carousel-inner');
  carouselInner.innerHTML = '';

  imagenes.forEach((url, i) => {
    if (!url.startsWith('http') && !url.startsWith('/')) {
      url = '/' + url;
    }

    const div = document.createElement('div');
    div.className = 'carousel-item' + (i === indexInicial ? ' active' : '');

    const img = document.createElement('img');
    img.className = 'd-block w-100';
    img.src = url;
    img.alt = `Imagen ${i + 1}`;

    div.appendChild(img);
    carouselInner.appendChild(div);
  });

  // Mostrar modal Bootstrap
  const modal = new bootstrap.Modal(document.getElementById('modalGaleria'));
  modal.show();
}

window.onload = cargarDetalleProyecto;
