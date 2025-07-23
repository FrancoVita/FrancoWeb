async function cargarProyectosVisitante() {
  const galeria = document.getElementById('galeriaVisitante');
  galeria.innerHTML = '';
  try {
    const res = await fetch('data/proyectos.json');
    const proyectos = await res.json();

    proyectos.forEach(p => {
      // Ruta defensiva para imagen
      let imagen = (p.imagenes && p.imagenes[0]) ? p.imagenes[0] : 'placeholder.jpg';

      // Asegurar que empiece con slash si es relativa
      if (!imagen.startsWith('http') && !imagen.startsWith('/')) {
        imagen = '/' + imagen;
      }

      const card = document.createElement('div');
      card.className = 'card-proyecto';
      card.style.cursor = 'pointer';
      card.onclick = () => verDetalle(p.id);

      card.innerHTML  = `
        <img src="${imagen}" alt="Proyecto" />
        <div class="contenido">
          <h3>${p.descripcion}</h3>
          <p class="descripcion">${p.descripcionLarga || p.descripcion}</p>
        </div>
      `;
      galeria.appendChild(card);
    });

  } catch (err) {
    galeria.innerHTML = '<p>Error al cargar proyectos.</p>';
    console.error(err);
  }
}


function verDetalle(id) {
  const url = `/proyecto.html?id=${id}`;
  console.log('Redirigiendo a:', url);
  window.location.href = url;
}


window.onload = cargarProyectosVisitante;
