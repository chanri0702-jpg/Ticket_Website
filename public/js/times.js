let currentTimeId     = null;
let timeToDelete      = null;
let currentEventId    = null;
let currentVenue      = null;
let currentTimeSlot   = null;  // full time slot loaded from API
let reservedSeats     = [];    // seats being reserved in this session
let selectedBlock     = null;

function showToast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:2rem;right:2rem;padding:.875rem 1.5rem;border-radius:.5rem;font-weight:500;font-size:.9rem;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;max-width:360px;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = type === 'error' ? '#ef4444' : '#22c55e';
  t.style.color = '#fff';
  t.style.opacity = '1';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 3500);
}
 
function onEventSelect() {
  const eventId = document.getElementById('sidebarEventSelect').value;
  currentEventId = eventId || null;
 
  const addBtn = document.getElementById('addTimeBtn');
  const list   = document.getElementById('timesList');
 
  if (!eventId) {
    addBtn.disabled = true;
    list.innerHTML  = '<li class="venue-list-empty">Select an event to view its times</li>';
    resetForm();
    return;
  }
 
  addBtn.disabled = false;
  resetForm();
  renderTimesList(eventId);
}
 
function renderTimesList(eventId) {
  const list  = document.getElementById('timesList');
  const times = allTimes.filter(t => t.eventID === eventId || (t.eventID && t.eventID._id === eventId));
  list.innerHTML = '';
 
  if (times.length === 0) {
    list.innerHTML = '<li class="venue-list-empty">No show times yet</li>';
    return;
  }
 
  times.forEach(t => {
    const li = document.createElement('li');
    li.className    = 'venue-list-item';
    li.dataset.id   = t._id;
    li.onclick      = () => loadTime(t._id);
    li.innerHTML    = `
      <span class="venue-list-address">${formatDate(t.eventTime)}</span>
      <span class="venue-list-city">${t.seatsAvailable ?? t.totalSeats} seats available</span>
    `;
    list.appendChild(li);
  });
}
 
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
}
 
function getVenueForEvent(eventId) {
  const ev = allEvents.find(e => e._id === eventId);
  if (!ev) return null;
  const venueId = ev.venueID?._id || ev.venueID;
  return allVenues.find(v => v._id === venueId) || null;
}
 
function getBlocks(venue) {
  if (!venue || !venue.seatTemplate || venue.seatTemplate.length === 0) return [];
  return [...new Set(venue.seatTemplate.map(s => s.block))];
}

async function submitTime(e) {
  e.preventDefault();
 
  if (!currentEventId) {
    alert('Please select an event first.');
    return;
  }
 
  const eventTime  = document.getElementById('eventTime').value;
  const totalSeats = parseInt(document.getElementById('totalSeats').value);
 
  if (!eventTime || !totalSeats) {
    alert('Please fill in all required fields.');
    return;
  }

  const payload = {
    eventID: currentEventId,
    eventTime,
    totalSeats,
    seatsAvailable: totalSeats
  };
 
  const isEditing = !!currentTimeId;
  const url    = isEditing ? `/api/times/${currentTimeId}` : '/api/times';
  const method = isEditing ? 'PUT' : 'POST';
 
  try {
    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showToast(isEditing ? 'Show time updated!' : 'Show time added!');
      window.location.reload();
    } else {
      showToast('Error: ' + (data.message || 'Something went wrong'), 'error');
    }
  } catch (err) {
    showToast('Failed to save time: ' + err.message, 'error');
  }
}

async function loadTime(timeId) {
  const time = allTimes.find(t => t._id === timeId);
  if (!time) return;

  currentTimeId = timeId;

  // sidebar active
  document.querySelectorAll('.venue-list-item').forEach(el => el.classList.remove('active'));
  const activeEl = document.querySelector(`.venue-list-item[data-id="${timeId}"]`);
  if (activeEl) activeEl.classList.add('active');
 
  // header and buttons
  document.getElementById('formTitle').textContent    = formatDate(time.eventTime);
  document.getElementById('formSubtitle').textContent = `${time.seatsAvailable ?? time.totalSeats} seats available`;
  document.getElementById('submitBtn').textContent    = 'Update Time';
  document.getElementById('clearBtn').style.display   = 'none';
  document.getElementById('deleteBtn').style.display  = 'block';
 
  // fill fields
  document.getElementById('timeId').value      = timeId;
  document.getElementById('eventTime').value   = toDatetimeLocal(time.eventTime);
  document.getElementById('totalSeats').value  = time.totalSeats || '';
 
  // venue and blocks
  currentVenue = getVenueForEvent(currentEventId);
 
  // fetch full time slot from API for seat data
  try {
    const res  = await fetch(`/api/times/${timeId}`);
    currentTimeSlot = await res.json();
    renderSeatsPanel();
    document.getElementById('reserveSection').style.display = 'block';
  } catch (err) {
    console.error('Could not load seat data', err);
  }
}

 
function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
 
function renderSeatsPanel() {
  const panel = document.getElementById('seatsPanel');
  if (!currentTimeSlot) return;
 
  const hasLayout = currentTimeSlot.seats && currentTimeSlot.seats.length > 0;
 
  if (!hasLayout) {
    // No seating layout — show total available
    panel.innerHTML = `
      <div class="form-group">
        <label>Seats Available</label>
        <input type="number" id="manualSeatsAvailable" value="${currentTimeSlot.seatsAvailable}"
          min="0" max="${currentTimeSlot.totalSeats}" placeholder="Available seats">
      </div>
      <button type="button" class="btn-generate" style="margin-top:0.75rem;"
        onclick="saveManualSeats()">Save Seats</button>
    `;
    return;
  }
 
  // Group seats by block
  const blocks = {};
  currentTimeSlot.seats.forEach(seat => {
    if (!blocks[seat.block]) blocks[seat.block] = { total: 0, available: 0, reserved: 0 };
    blocks[seat.block].total++;
    if (seat.isAvailable) blocks[seat.block].available++;
    if (seat.heldBy === '__reserved__') blocks[seat.block].reserved++;
  });
 
  panel.innerHTML = `
    <div class="seats-availability">
      ${Object.entries(blocks).map(([name, data]) => `
        <div class="block-availability-card">
          <div class="block-name">${name}</div>
          <div class="block-count">${data.available}</div>
          <div class="block-total">of ${data.total} available</div>
        </div>
      `).join('')}
    </div>
  `;
}
 
async function saveManualSeats() {
  const count = parseInt(document.getElementById('manualSeatsAvailable').value);
  if (isNaN(count) || count < 0) {
    showToast('Please enter a valid number of seats.', 'error');
    return;
  }
  try {
    const res = await fetch(`/api/times/${currentTimeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatsAvailable: count })
    });
    if (res.ok) showToast('Seats updated successfully!');
    else showToast('Failed to update seats.', 'error');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
 
function openReservePanel() {
  if (!currentTimeSlot) return;
  reservedSeats = [];
 
  const hasLayout = currentTimeSlot.seats && currentTimeSlot.seats.length > 0;
  document.getElementById('noLayoutMode').style.display  = hasLayout ? 'none'  : 'block';
  document.getElementById('layoutMode').style.display    = hasLayout ? 'block' : 'none';
 
  if (hasLayout) {
    // populate block dropdown
    const blocks = [...new Set(currentTimeSlot.seats.map(s => s.block))];
    const select = document.getElementById('blockSelect');
    select.innerHTML = '<option value="">— Select block —</option>' +
      blocks.map(b => `<option value="${b}">${b}</option>`).join('');
    document.getElementById('seatGrid').innerHTML = '';
    
    // Display venue layout image if available
    if (currentVenue && currentVenue.layoutImage) {
      const imgContainer = document.createElement('div');
      imgContainer.style.cssText = 'margin-bottom:1.5rem;text-align:center;';
      const img = document.createElement('img');
      img.src = currentVenue.layoutImage;
      img.alt = currentVenue.name + ' seating layout';
      img.style.cssText = 'max-width:100%;height:auto;border-radius:.5rem;max-height:250px;';
      imgContainer.appendChild(img);
      document.getElementById('seatGrid').parentElement.insertBefore(imgContainer, document.getElementById('seatGrid'));
    }
    
    document.getElementById('reservedListSection').style.display = 'none';
  }
 
  document.getElementById('reserveOverlay').style.display = 'flex';
}
 
function closeReservePanel(e) {
  if (e && e.target !== document.getElementById('reserveOverlay')) return;
  document.getElementById('reserveOverlay').style.display = 'none';
  reservedSeats = [];
  
  // Clean up any layout images
  const layoutImages = document.querySelectorAll('#layoutMode > div:first-child img[alt*="seating layout"]');
  layoutImages.forEach(img => img.parentElement.remove());
}
 
function renderBlockSeats() {
  const block  = document.getElementById('blockSelect').value;
  const grid   = document.getElementById('seatGrid');
  grid.innerHTML = '';
  if (!block || !currentTimeSlot) return;
  selectedBlock = block;
 
  // group by row
  const rows = {};
  currentTimeSlot.seats
    .filter(s => s.block === block)
    .forEach(s => {
      if (!rows[s.row]) rows[s.row] = [];
      rows[s.row].push(s);
    });
 
  Object.keys(rows).sort().forEach(rowKey => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'seat-row';
    rowDiv.innerHTML = `<span class="seat-row-label">${rowKey}</span>`;
 
    rows[rowKey].sort((a,b) => a.seatNumber - b.seatNumber).forEach(seat => {
      const isReserved  = reservedSeats.some(r => r._id === seat._id);
      const isTaken     = !seat.isAvailable && seat.heldBy !== '__reserved__';
      const isAdminHeld = seat.heldBy === '__reserved__';
 
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = `seat-btn ${isTaken ? 'seat-taken' : ''} ${isAdminHeld ? 'seat-reserved' : ''} ${isReserved ? 'seat-selected' : ''}`;
      btn.textContent = seat.seatNumber;
      btn.title     = `${rowKey}${seat.seatNumber} · ${isTaken ? 'Booked' : isAdminHeld ? 'Reserved' : 'Available'}`;
      btn.disabled  = isTaken;
 
      btn.onclick = () => toggleSeatSelection(seat, btn);
      rowDiv.appendChild(btn);
    });
 
    grid.appendChild(rowDiv);
  });
 
  // legend
  const legend = document.createElement('div');
  legend.className = 'seat-legend';
  legend.innerHTML = `
    <div class="legend-item"><div class="legend-dot" style="background:#f8fafc;border:1.5px solid #e2e8f0;"></div> Available</div>
    <div class="legend-item"><div class="legend-dot" style="background:#6366f1;"></div> Selected</div>
    <div class="legend-item"><div class="legend-dot" style="background:#fef3c7;border:1.5px solid #fcd34d;"></div> Reserved</div>
    <div class="legend-item"><div class="legend-dot" style="background:#fee2e2;border:1.5px solid #fca5a5;"></div> Booked</div>
  `;
  grid.appendChild(legend);
}
 
function toggleSeatSelection(seat, btn) {
  const idx = reservedSeats.findIndex(r => r._id === seat._id);
  if (idx === -1) {
    reservedSeats.push(seat);
    btn.classList.add('seat-selected');
  } else {
    reservedSeats.splice(idx, 1);
    btn.classList.remove('seat-selected');
  }
  updateReservedList();
}
 
function updateReservedList() {
  const section = document.getElementById('reservedListSection');
  const list    = document.getElementById('reservedList');
  section.style.display = reservedSeats.length > 0 ? 'block' : 'none';
  list.innerHTML = '';
 
  reservedSeats.forEach(seat => {
    const item = document.createElement('div');
    item.className = 'reserved-item';
    item.innerHTML = `
      <div class="reserved-item-info">
        <span class="reserved-item-badge">${seat.block}</span>
        <span>Row ${seat.row} · Seat ${seat.seatNumber}</span>
      </div>
      <button class="reserved-item-remove" onclick="removeReserved('${seat._id}')" title="Remove">✕</button>
    `;
    list.appendChild(item);
  });
}
 
function removeReserved(seatId) {
  reservedSeats = reservedSeats.filter(s => s._id !== seatId);
  updateReservedList();
  renderBlockSeats(); // refresh grid to deselect
}
 
async function saveReservedSeats() {
  if (!currentTimeId) return;
 
  const hasLayout = currentTimeSlot.seats && currentTimeSlot.seats.length > 0;
 
  if (!hasLayout) {
    // no layout mode — just save count
    const count = parseInt(document.getElementById('noLayoutReserveCount').value);
    if (isNaN(count) || count < 1) {
      showToast('Please enter a valid number of seats to reserve.', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/times/${currentTimeId}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      if (res.ok) {
        showToast('Seats reserved!');
        document.getElementById('reserveOverlay').style.display = 'none';
        window.location.reload();
      } else {
        const d = await res.json();
        showToast('Error: ' + d.message, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
    return;
  }
 
  // layout mode — send seat IDs
  if (reservedSeats.length === 0) {
    showToast('No seats selected.', 'error');
    return;
  }
 
  try {
    const res = await fetch(`/api/times/${currentTimeId}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatIds: reservedSeats.map(s => s._id) })
    });
    if (res.ok) {
      showToast(`${reservedSeats.length} seat(s) reserved!`);
      document.getElementById('reserveOverlay').style.display = 'none';
      window.location.reload();
    } else {
      const d = await res.json();
      showToast('Error: ' + d.message, 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
 
function resetForm() {
  currentTimeId   = null;
  currentTimeSlot = null;
  reservedSeats   = [];
 
  document.getElementById('timesForm').reset();
  document.getElementById('formTitle').textContent    = 'Add Show Time';
  document.getElementById('formSubtitle').textContent = 'Fill in the event details below';
  document.getElementById('submitBtn').textContent    = 'Add Show Time';
  document.getElementById('clearBtn').style.display   = 'block';
  document.getElementById('deleteBtn').style.display  = 'none';
  document.getElementById('reserveSection').style.display = 'none';
  document.getElementById('seatsPanel').innerHTML     = '<p class="toggle-hint">Save the time slot first, then manage seats.</p>';
  document.querySelectorAll('.venue-list-item').forEach(el => el.classList.remove('active'));
 
  // set venue for current event
  currentVenue = currentEventId ? getVenueForEvent(currentEventId) : null;
  document.getElementById('selectedEventId').value = currentEventId || '';
}
 
function deleteTime() {
  timeToDelete = currentTimeId;
  document.getElementById('confirmModal').style.display = 'flex';
}
 
async function confirmDelete() {
  if (!timeToDelete) return;
  try {
    const res = await fetch(`/api/times/${timeToDelete}`, { method: 'DELETE' });
    if (res.ok) {
      closeModal();
      window.location.reload();
    } else {
      const d = await res.json();
      showToast('Error: ' + (d.message || 'Failed to delete'), 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
 
function closeModal() {
  document.getElementById('confirmModal').style.display = 'none';
  timeToDelete = null;
}