/* ── To-Do List ─────────────────────────────────────────────────────── */

async function renderTodos() {
  const content = $('#content');
  content.innerHTML = `
    <div class="todo-page-header">
      <h1 class="page-title">TO-DO LIST</h1>
      <button class="btn btn-gold" id="todo-toggle-form">+ New Task</button>
    </div>

    <!-- Inline Add Form (hidden by default) -->
    <div class="card todo-form-card" id="todo-form-card" style="display:none">
      <form id="todo-form">
        <div class="form-row">
          <div class="form-group" style="flex:3">
            <label>Task</label>
            <input type="text" id="todo-title" placeholder="What needs to be done?" required>
          </div>
          <div class="form-group" style="flex:1">
            <label>Priority</label>
            <select id="todo-priority">
              <option value="high">High</option>
              <option value="medium" selected>Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div class="form-group" style="flex:1">
            <label>Due Date</label>
            <input type="date" id="todo-due">
          </div>
        </div>
        <div class="form-group">
          <label>Notes (optional)</label>
          <textarea id="todo-desc" rows="2" placeholder="Additional details..."></textarea>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-gold">Add Task</button>
          <button type="button" class="btn btn-outline" id="todo-cancel-form">Cancel</button>
        </div>
      </form>
    </div>

    <!-- Filter Tabs -->
    <div class="todo-tabs">
      <button class="todo-tab active" data-filter="active">Active</button>
      <button class="todo-tab" data-filter="all">All</button>
      <button class="todo-tab" data-filter="completed">Completed</button>
    </div>

    <!-- Todo List -->
    <div id="todo-list"></div>
  `;

  // Toggle form
  $('#todo-toggle-form').addEventListener('click', () => {
    const card = $('#todo-form-card');
    const showing = card.style.display !== 'none';
    card.style.display = showing ? 'none' : 'block';
    if (!showing) $('#todo-title').focus();
  });

  $('#todo-cancel-form').addEventListener('click', () => {
    $('#todo-form-card').style.display = 'none';
  });

  // Submit
  $('#todo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = $('#todo-title').value.trim();
    if (!title) return;

    await api('POST', '/api/todos', {
      title,
      description: $('#todo-desc').value.trim() || null,
      priority: $('#todo-priority').value,
      due_date: $('#todo-due').value || null
    });

    $('#todo-title').value = '';
    $('#todo-desc').value = '';
    $('#todo-priority').value = 'medium';
    $('#todo-due').value = '';
    $('#todo-form-card').style.display = 'none';
    loadTodos();
  });

  // Filter tabs
  $$('.todo-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.todo-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadTodos();
    });
  });

  loadTodos();
}

async function loadTodos() {
  const activeTab = document.querySelector('.todo-tab.active');
  const filter = activeTab ? activeTab.dataset.filter : 'active';
  let url = '/api/todos';
  if (filter === 'active') url += '?completed=false';
  else if (filter === 'completed') url += '?completed=true';

  const todos = await api('GET', url);
  const list = $('#todo-list');

  if (todos.length === 0) {
    list.innerHTML = `
      <div class="todo-empty">
        ${filter === 'completed' ? 'No completed tasks yet.' : 'No tasks yet. Hit "+ New Task" to add one.'}
      </div>
    `;
    return;
  }

  list.innerHTML = todos.map(t => {
    const overdue = t.due_date && !t.completed && t.due_date < todayLocal();
    const priorityClass = `todo-priority--${t.priority}`;
    const dueLabel = t.due_date ? formatDate(t.due_date) : '';
    const dueClass = overdue ? 'todo-due--overdue' : '';

    return `
      <div class="todo-item ${t.completed ? 'todo-item--done' : ''}" data-id="${t.id}">
        <div class="todo-check">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTodo(${t.id}, this.checked)">
        </div>
        <div class="todo-priority-bar ${priorityClass}"></div>
        <div class="todo-body">
          <div class="todo-title">${escTodo(t.title)}</div>
          ${t.description ? `<div class="todo-description">${escTodo(t.description)}</div>` : ''}
          <div class="todo-meta">
            <span class="pill ${priorityClass}">${t.priority.toUpperCase()}</span>
            ${dueLabel ? `<span class="todo-due ${dueClass}">${overdue ? 'OVERDUE: ' : 'Due: '}${dueLabel}</span>` : ''}
          </div>
        </div>
        <div class="todo-actions">
          <button class="remove-row" onclick="deleteTodo(${t.id})" title="Delete">&times;</button>
        </div>
      </div>
    `;
  }).join('');
}

function escTodo(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function toggleTodo(id, completed) {
  await api('PUT', `/api/todos/${id}`, { completed });
  loadTodos();
}

async function deleteTodo(id) {
  if (!confirm('Delete this task?')) return;
  await api('DELETE', `/api/todos/${id}`);
  loadTodos();
}
