const saveBtn = document.getElementById('saveBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusEl = document.getElementById('status');
const pdfListEl = document.getElementById('pdfList');
const api = globalThis.pdfApp;

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function createPdfItem(item) {
  const li = document.createElement('li');
  li.className = 'pdf-item';

  const name = document.createElement('span');
  name.className = 'pdf-item-name';
  name.textContent = item.name;
  name.title = item.path;

  const actions = document.createElement('div');
  actions.className = 'pdf-item-actions';

  const dragBtn = document.createElement('button');
  dragBtn.className = 'drag-btn';
  dragBtn.textContent = 'Arrastar';
  dragBtn.draggable = true;
  dragBtn.title = 'Clique e arraste para fora da janela';
  dragBtn.addEventListener('dragstart', () => {
    api.startDrag(item.path);
  });

  const openBtn = document.createElement('button');
  openBtn.className = 'open-btn';
  openBtn.textContent = 'Mostrar';
  openBtn.addEventListener('click', async () => {
    await api.openFolder(item.path);
  });

  actions.appendChild(dragBtn);
  actions.appendChild(openBtn);
  li.appendChild(name);
  li.appendChild(actions);

  return li;
}

async function loadPdfList() {
  const files = await api.listPdfs();
  pdfListEl.innerHTML = '';

  if (!files.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Nenhum PDF encontrado em Downloads.';
    pdfListEl.appendChild(empty);
    return;
  }

  files.forEach((file) => {
    pdfListEl.appendChild(createPdfItem(file));
  });
}

saveBtn.addEventListener('click', async () => {
  saveBtn.disabled = true;
  setStatus('Validando dados da área de colagem...');

  try {
    const result = await api.saveFromClipboard();
    setStatus(`✅ Salvo com sucesso: ${result.fileName}`, 'success');
    await loadPdfList();
  } catch (error) {
    setStatus(`❌ ${error.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
  }
});

refreshBtn.addEventListener('click', async () => {
  await loadPdfList();
  setStatus('Lista atualizada.');
});

loadPdfList().catch((error) => {
  setStatus(`❌ Erro ao carregar lista: ${error.message}`, 'error');
});
