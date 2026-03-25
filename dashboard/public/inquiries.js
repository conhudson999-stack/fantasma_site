/* ══════════════════════════════════════════════════════════════════════
   INQUIRY VIEWS
   ══════════════════════════════════════════════════════════════════════ */

const STATUS_LABELS = { new: 'New', contacted: 'Contacted', booked: 'Booked', lost: 'Lost' };
const STATUS_ORDER = ['new', 'contacted', 'booked', 'lost'];
const SOURCES = ['instagram', 'referral', 'google', 'contact_form', 'other'];
const INTERESTS = ['1-on-1', 'small_group', 'camp', 'clinic', 'other'];

function sourceLabel(s) {
  const map = { instagram: 'Instagram', referral: 'Referral', google: 'Google', contact_form: 'Contact Form', other: 'Other' };
  return map[s] || s || '';
}

function interestLabel(s) {
  const map = { '1-on-1': '1-on-1', small_group: 'Small Group', camp: 'Camp', clinic: 'Clinic', other: 'Other' };
  return map[s] || s || '';
}

/* ── Board ───────────────────────────────────────────────────────── */
async function renderBoard() {
  const content = $('#content');
  const inquiries = await api('GET', '/api/inquiries');

  const grouped = {};
  for (const s of STATUS_ORDER) grouped[s] = [];
  for (const inq of inquiries) {
    if (grouped[inq.status]) grouped[inq.status].push(inq);
    else grouped.new.push(inq);
  }

  // Sort each column: overdue first, then soonest follow-up, then newest
  const todayStr = new Date().toISOString().slice(0, 10);
  for (const s of STATUS_ORDER) {
    grouped[s].sort((a, b) => {
      const aOverdue = a.follow_up_date && a.follow_up_date < todayStr ? 1 : 0;
      const bOverdue = b.follow_up_date && b.follow_up_date < todayStr ? 1 : 0;
      if (bOverdue !== aOverdue) return bOverdue - aOverdue;
      if (a.follow_up_date && b.follow_up_date) return a.follow_up_date.localeCompare(b.follow_up_date);
      if (a.follow_up_date) return -1;
      if (b.follow_up_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    });
  }

  let html = '<h1 class="page-title">INQUIRY BOARD</h1><div class="board">';

  for (const status of STATUS_ORDER) {
    const items = grouped[status];
    html += `
      <div class="board-column">
        <div class="board-column-header">
          <span class="board-column-title">${STATUS_LABELS[status]}</span>
          <span class="board-column-count">${items.length}</span>
        </div>
    `;

    for (const inq of items) {
      const days = daysAgo(inq.created_at);
      const overdue = inq.follow_up_date && inq.follow_up_date < todayStr;
      html += `
        <div class="inquiry-card" data-id="${inq.id}">
          <div class="inquiry-card-name">${inq.name}</div>
          <div class="inquiry-card-meta">
            ${inq.interest ? `<span class="pill">${interestLabel(inq.interest)}</span>` : ''}
            ${inq.source ? `<span>${sourceLabel(inq.source)}</span>` : ''}
            <span>${days}d ago</span>
            ${inq.follow_up_date ? `<span class="pill ${overdue ? 'overdue' : ''}">Follow-up: ${formatDate(inq.follow_up_date)}</span>` : ''}
          </div>
        </div>
      `;
    }

    html += '</div>';
  }

  html += '</div>';

  // Detail panel placeholder
  html += '<div class="detail-panel" id="detail-panel"></div>';

  content.innerHTML = html;

  // Card click → open detail
  content.querySelectorAll('.inquiry-card').forEach(card => {
    card.addEventListener('click', () => openDetailPanel(card.dataset.id));
  });
}

/* ── Detail Panel ────────────────────────────────────────────────── */
async function openDetailPanel(id) {
  const panel = $('#detail-panel');
  const data = await api('GET', `/api/inquiries/${id}`);

  const daysSinceCreated = daysAgo(data.created_at);
  const lastNote = data.notes && data.notes.length > 0 ? data.notes[data.notes.length - 1] : null;
  const daysSinceNote = lastNote ? daysAgo(lastNote.created_at) : null;

  panel.innerHTML = `
    <button class="detail-panel-close" id="close-panel">&times;</button>
    <h2>${data.name}</h2>

    <div class="flex gap-16 mb-16">
      <div><span class="text-muted" style="font-size:11px">Created</span><br><strong>${daysSinceCreated}d ago</strong></div>
      ${daysSinceNote !== null ? `<div><span class="text-muted" style="font-size:11px">Last Note</span><br><strong>${daysSinceNote}d ago</strong></div>` : ''}
    </div>

    <div class="detail-section">
      <div class="form-row">
        <div class="form-group">
          <label>Status</label>
          <select id="d-status">
            ${STATUS_ORDER.map(s => `<option value="${s}" ${data.status === s ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Follow-up</label>
          <input type="date" id="d-followup" value="${data.follow_up_date || ''}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Email</label>
          <input type="text" id="d-email" value="${data.email || ''}">
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="text" id="d-phone" value="${data.phone || ''}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Source</label>
          <select id="d-source">
            <option value="">—</option>
            ${SOURCES.map(s => `<option value="${s}" ${data.source === s ? 'selected' : ''}>${sourceLabel(s)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Interest</label>
          <select id="d-interest">
            <option value="">—</option>
            ${INTERESTS.map(s => `<option value="${s}" ${data.interest === s ? 'selected' : ''}>${interestLabel(s)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Player Age</label>
          <input type="number" id="d-age" value="${data.player_age || ''}">
        </div>
        <div class="form-group">
          <label>Position</label>
          <input type="text" id="d-position" value="${data.player_position || ''}">
        </div>
      </div>

      ${data.message ? `
        <div class="form-group">
          <label>Message</label>
          <textarea readonly style="background:var(--gray-100)">${data.message}</textarea>
        </div>
      ` : ''}
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Notes</div>
      <div id="d-notes">
        ${(data.notes || []).slice().reverse().map(n => `
          <div class="note-item">
            <button class="note-delete" data-note-id="${n.id}">&times;</button>
            <div class="note-date">${formatDate(n.created_at.slice(0, 10))}</div>
            <div class="note-text">${n.note}</div>
          </div>
        `).join('')}
        ${(!data.notes || data.notes.length === 0) ? '<p class="text-muted" style="font-size:13px;padding:8px 0">No notes yet.</p>' : ''}
      </div>
      <div class="mt-8">
        <textarea id="d-new-note" placeholder="Add a note..." style="min-height:60px"></textarea>
        <button class="btn btn-navy btn-sm mt-8" id="d-add-note">Add Note</button>
      </div>
    </div>

    <div class="mt-16">
      <button class="btn btn-danger btn-sm" id="d-delete">Delete Inquiry</button>
    </div>
  `;

  panel.classList.add('open');

  // Close
  $('#close-panel').addEventListener('click', () => panel.classList.remove('open'));

  // Auto-save on field change
  const fields = [
    { el: '#d-status', key: 'status' },
    { el: '#d-followup', key: 'follow_up_date' },
    { el: '#d-email', key: 'email' },
    { el: '#d-phone', key: 'phone' },
    { el: '#d-source', key: 'source' },
    { el: '#d-interest', key: 'interest' },
    { el: '#d-age', key: 'player_age', parse: v => v ? parseInt(v) : null },
    { el: '#d-position', key: 'player_position' },
  ];

  for (const f of fields) {
    const el = $(f.el);
    if (!el) continue;
    el.addEventListener('change', async () => {
      const val = f.parse ? f.parse(el.value) : (el.value || null);
      await api('PUT', `/api/inquiries/${id}`, { [f.key]: val });
      refreshStats();
    });
  }

  // Add note
  $('#d-add-note').addEventListener('click', async () => {
    const noteText = $('#d-new-note').value.trim();
    if (!noteText) return;
    await api('POST', `/api/inquiries/${id}/notes`, { note: noteText });
    openDetailPanel(id);
  });

  // Delete notes
  panel.querySelectorAll('.note-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await api('DELETE', `/api/inquiries/${id}/notes/${btn.dataset.noteId}`);
      openDetailPanel(id);
    });
  });

  // Delete inquiry
  $('#d-delete').addEventListener('click', async () => {
    if (!confirm('Delete this inquiry?')) return;
    await api('DELETE', `/api/inquiries/${id}`);
    panel.classList.remove('open');
    refreshStats();
    renderBoard();
  });
}

/* ── Add Inquiry ─────────────────────────────────────────────────── */
async function renderAddInquiry() {
  const content = $('#content');

  content.innerHTML = `
    <h1 class="page-title">ADD INQUIRY</h1>
    <div id="inq-msg"></div>
    <div class="card">
      <div class="form-row">
        <div class="form-group" style="flex:2">
          <label>Name *</label>
          <input type="text" id="inq-name" placeholder="Contact name">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="text" id="inq-email" placeholder="email@example.com">
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="text" id="inq-phone" placeholder="412-555-1234">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Source</label>
          <select id="inq-source">
            <option value="">—</option>
            ${SOURCES.map(s => `<option value="${s}">${sourceLabel(s)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Interest</label>
          <select id="inq-interest">
            <option value="">—</option>
            ${INTERESTS.map(s => `<option value="${s}">${interestLabel(s)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Follow-up Date</label>
          <input type="date" id="inq-followup">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group" style="flex:0.5">
          <label>Player Age</label>
          <input type="number" id="inq-age" placeholder="14">
        </div>
        <div class="form-group" style="flex:0.5">
          <label>Player Position</label>
          <input type="text" id="inq-position" placeholder="CM">
        </div>
        <div class="form-group" style="flex:2">
          <label>Message</label>
          <textarea id="inq-message" placeholder="Notes about the inquiry..."></textarea>
        </div>
      </div>

      <button class="btn btn-gold mt-16" id="save-inq-btn">Save Inquiry</button>
    </div>
  `;

  $('#save-inq-btn').addEventListener('click', async () => {
    const name = $('#inq-name').value.trim();
    if (!name) {
      $('#inq-msg').innerHTML = '<div class="msg msg-error">Name is required.</div>';
      return;
    }

    try {
      await api('POST', '/api/inquiries', {
        name,
        email: $('#inq-email').value || null,
        phone: $('#inq-phone').value || null,
        source: $('#inq-source').value || null,
        interest: $('#inq-interest').value || null,
        follow_up_date: $('#inq-followup').value || null,
        player_age: $('#inq-age').value ? parseInt($('#inq-age').value) : null,
        player_position: $('#inq-position').value || null,
        message: $('#inq-message').value || null,
      });
      refreshStats();
      location.hash = '#board';
    } catch (e) {
      $('#inq-msg').innerHTML = `<div class="msg msg-error">${e.message}</div>`;
    }
  });
}
