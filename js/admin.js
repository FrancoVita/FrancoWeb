let proyectosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!sessionStorage.getItem('isAdmin')) {
    window.location.href = 'index.html';
    return;
  }

  cargarProyectosAdmin();

  const buscador = document.getElementById("buscador");
  if (buscador) {
    buscador.addEventListener("input", filtrarProyectos);
  }

  const form = document.getElementById('formulario');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await agregarProyecto();
    });
  }

  window.addEventListener("beforeunload", () => {
    sessionStorage.removeItem("isAdmin");
  });
});

function volverAlInicio() {
  sessionStorage.removeItem('isAdmin');
  window.location.href = 'index.html';
}

async function cargarProyectosAdmin() {
  const res = await fetch('/data/proyectos.json');
  proyectosGlobal = await res.json();
  renderizarProyectos(proyectosGlobal);
}

function renderizarProyectos(lista) {
  const galeria = document.getElementById('galeria');
  if (!galeria) return;

  galeria.innerHTML = '';
  lista.forEach(p => {
const primeraImagen = p.imagenes && p.imagenes.length > 0 ? '/' + p.imagenes[0] : '/img/placeholder.jpg';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${p.descripcion}</h3>
      <img src="${primeraImagen}" alt="Imagen del proyecto" onclick="verDetalle(${p.id})" style="cursor:pointer;">
      <div class="acciones">
        <span class="material-symbols-outlined edit-icon" onclick="abrirEditor(${p.id})">edit</span>
        <span class="material-symbols-outlined delete-icon" onclick="eliminar(${p.id})">delete_forever</span>
      </div>
    `;
    galeria.appendChild(card);
  });
}



function filtrarProyectos() {
  const texto = document.getElementById('buscador').value.toLowerCase();
  const filtrados = proyectosGlobal.filter(p => p.descripcion.toLowerCase().includes(texto));
  renderizarProyectos(filtrados);
}

async function agregarProyecto() {
  const fileInput = document.getElementById('imagen');
  const descripcion = document.getElementById('descripcion').value;
  const descripcionLarga = document.getElementById('descripcionLarga').value;
  const formData = new FormData();

  for (const file of fileInput.files) {
    formData.append('imagenes', file);
  }

  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  const { urls } = await uploadRes.json();

  await fetch('/api/proyectos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descripcion, descripcionLarga, imagenes: urls })
  });

  document.getElementById('formulario').reset();
  cargarProyectosAdmin();
}

async function eliminar(id) {
  const pass = prompt('Para eliminar este proyecto, ingresa la contraseña de administrador:');
  if (!pass) return;

  if (!confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) return;

  const res = await fetch(`/api/proyectos/${id}?password=${encodeURIComponent(pass)}`, {
    method: 'DELETE'
  });

  if (res.ok) {
    cargarProyectosAdmin();
  } else {
    const err = await res.json();
    alert('❌ No se pudo eliminar: ' + err.error);
  }
}

function verDetalle(id) {
  window.location.href = `/proyecto.html?id=${id}`;
}

// ================== Editor ======================

let proyectoEditando = null;

function abrirEditor(id) {
  const proyecto = proyectosGlobal.find(p => p.id === id);
  if (!proyecto) return;
  proyectoEditando = proyecto;
  document.getElementById('editTitulo').value = proyecto.descripcion || '';
  document.getElementById('editDescripcion').value = proyecto.descripcionLarga || '';
  mostrarImagenesEditor(proyecto.imagenes || []);
  document.getElementById('editorProyecto').style.display = 'flex';
}

function mostrarImagenesEditor(imagenes) {
  const cont = document.getElementById('editImagenes');
  cont.innerHTML = '';
  imagenes.forEach((url, idx) => {
    // Corrige la URL si es relativa
    if (!url.startsWith('http') && !url.startsWith('/')) {
      url = '/' + url;
    }

    const div = document.createElement('div');
    div.style = "display:inline-block;position:relative;margin:5px;";
    div.innerHTML = `
      <img src="${url}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;">
      <span onclick="eliminarImagenEditor(${idx})" style="position:absolute;top:0;right:0;background:red;color:white;cursor:pointer;border-radius:50%;padding:2px 6px;">&times;</span>
    `;
    cont.appendChild(div);
  });
}


function eliminarImagenEditor(idx) {
  proyectoEditando.imagenes.splice(idx, 1);
  mostrarImagenesEditor(proyectoEditando.imagenes);
}

function cerrarEditor() {
  proyectoEditando = null;
  document.getElementById('editorProyecto').style.display = 'none';
}

async function guardarEdicionProyecto() {
  const id = proyectoEditando.id;
  const descripcion = document.getElementById('editTitulo').value;
  const descripcionLarga = document.getElementById('editDescripcion').value;
  let imagenes = [...proyectoEditando.imagenes];

  const nuevas = document.getElementById('editNuevasImagenes').files;
  if (nuevas.length > 0) {
    const formData = new FormData();
    for (const file of nuevas) formData.append('imagenes', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    imagenes = imagenes.concat(data.urls);
  }
try{
  await fetch(`/api/proyectos/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ descripcion, descripcionLarga, imagenes })
});
}catch(err){
  console.error(err);
    alert('Error al guardar proyecto');
  console.error(err);
}

cerrarEditor();
cargarProyectosAdmin();

}

document.getElementById('imagen').addEventListener('change', function () {
  const lista = document.getElementById('lista-imagenes');
  lista.innerHTML = ''; // Limpiar lista previa

  const archivos = this.files;

  if (archivos.length === 0) {
    lista.innerHTML = '<li>No se seleccionaron imágenes.</li>';
    return;
  }

  for (const archivo of archivos) {
    const li = document.createElement('li');
    li.textContent = archivo.name;
    lista.appendChild(li);
  }
});
