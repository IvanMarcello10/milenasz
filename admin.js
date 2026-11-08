// Base64 user:pass
function getAuthHeader() {
  const auth = sessionStorage.getItem('admin_auth');
  return auth ? 'Basic ' + auth : '';
}

function estaLogado() {
  return sessionStorage.getItem('admin_auth');
}

async function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (!user || !pass) { errEl.textContent = 'Preencha tudo'; return; }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password: pass })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro');

    sessionStorage.setItem('admin_auth', btoa(user + ':' + pass));
    showPanel();
  } catch (e) {
    errEl.textContent = e.message;
  }
}

function logout() {
  sessionStorage.removeItem('admin_auth');
  location.reload();
}

let currentContent = null;

async function loadContent() {
  const res = await fetch('/api/content');
  const data = await res.json();
  currentContent = data.content;
  renderForm();
}

function renderForm() {
  document.querySelectorAll('[data-path]').forEach(el => {
    const path = el.dataset.path;
    const value = getPath(currentContent, path);
    if (value !== undefined) {
      if (el.type === 'checkbox') el.checked = !!value;
      else el.value = value;
    }
  });
  renderPlans();
}

function renderPlans() {
  const container = document.getElementById('plans-container');
  container.innerHTML = '';
  currentContent.plans.forEach((plan, i) => {
    const div = document.createElement('div');
    div.className = 'plan-item';
    div.innerHTML = `
      <div class="grid">
        <label>Label <input class="input" data-plan-index="${i}" data-plan-key="label" value="${plan.label}" /></label>
        <label>Preço <input class="input" type="number" step="0.01" data-plan-index="${i}" data-plan-key="price" value="${plan.price}" /></label>
        <label>Selo <input class="input" data-plan-index="${i}" data-plan-key="badge" value="${plan.badge || ''}" /></label>
        <label class="checkbox-label">
          <input type="checkbox" data-plan-index="${i}" data-plan-key="highlight" ${plan.highlight ? 'checked' : ''} /> Destacar
        </label>
      </div>
      <button class="btn-danger small" onclick="removePlan(${i})">🗑️ Remover</button>
    `;
    container.appendChild(div);
  });
}

function addPlan() {
  currentContent.plans.push({ id: 'novo' + Date.now(), label: 'Novo plano', price: 19.95, badge: '', highlight: false });
  renderPlans();
}

function removePlan(i) {
  if (currentContent.plans.length <= 1) { alert('Precisa ter ao menos 1'); return; }
  if (confirm('Remover?')) {
    currentContent.plans.splice(i, 1);
    renderPlans();
  }
}

async function saveContent() {
  document.querySelectorAll('[data-path]').forEach(el => {
    const path = el.dataset.path;
    const value = el.type === 'number' ? parseFloat(el.value)
                : el.type === 'checkbox' ? el.checked
                : el.value;
    setPath(currentContent, path, value);
  });

  document.querySelectorAll('[data-plan-index]').forEach(el => {
    const i = parseInt(el.dataset.planIndex);
    const k = el.dataset.planKey;
    let v = el.type === 'checkbox' ? el.checked
          : el.type === 'number' ? parseFloat(el.value)
          : el.value;
    currentContent.plans[i][k] = v;
  });

  const statusEl = document.getElementById('save-status');
  statusEl.textContent = 'Salvando (commit no GitHub)...';
  statusEl.className = 'save-status';

  try {
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({ content: currentContent })
    });

    if (res.status === 401) {
      sessionStorage.removeItem('admin_auth');
      alert('Sessão expirada.');
      location.reload();
      return;
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro');

    statusEl.textContent = '✅ Salvo! Aguarde ~30s para o site atualizar.';
    statusEl.className = 'save-status ok';
    setTimeout(() => { statusEl.textContent = ''; }, 5000);
  } catch (e) {
    statusEl.textContent = '❌ ' + e.message;
    statusEl.className = 'save-status err';
  }
}

function getPath(obj, path) { return path.split('.').reduce((o, k) => o?.[k], obj); }
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => { if (!o[k]) o[k] = {}; return o[k]; }, obj);
  target[last] = value;
}

function showPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  loadContent();
}

if (estaLogado()) showPanel();
