// ✅ Mostrar campo de login
function mostrarLoginAdmin() {
  const loginDiv = document.getElementById('adminLogin');
  loginDiv.classList.remove('d-none');
  loginDiv.classList.add('d-block');
}

// ✅ Validar contraseña y redirigir
async function login() {
  const pass = document.getElementById('adminPass').value;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pass })
  });

  if (res.ok) {
    sessionStorage.setItem('isAdmin', 'true');
    window.location.href = '/admin.html';  // ✅ corregido
  } else {
    alert('Contraseña incorrecta');
  }
}

// ✅ Redirigir a modo visitante
function entrarComoVisitante(e) {
  if (e) e.preventDefault();
  sessionStorage.removeItem('isAdmin');
window.location.href = `/portfolio.html`;
}
