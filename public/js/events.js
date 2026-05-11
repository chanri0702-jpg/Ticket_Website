let currentEventId = null;
let eventToDelete = null;
let currentBlocks = []; // blocks from selected venue
 
document.getElementById('image').addEventListener('input', function () {
  const val = this.value.trim();
  if (val) {
    document.getElementById('previewImg').src = val;
    document.getElementById('imagePreview').style.display = 'block';
  } else {
    document.getElementById('imagePreview').style.display = 'none';
  }
});

function onVenueChange() {
  const venueId = document.getElementById('venueID').value;
  const venue = existingVenues.find(v => v._id === venueId);
  currentBlocks = [];
 
  if (venue && venue.seatTemplate && venue.seatTemplate.length > 0) {
    // extract unique block names
    const blockNames = [...new Set(venue.seatTemplate.map(s => s.block))];
    currentBlocks = blockNames;
  }
 
  const priceType = document.querySelector('input[name="priceType"]:checked').value;
  if (priceType === 'custom') renderBlockPriceInputs();
}
 

function togglePricing(type) {
  document.getElementById('uniformPricing').style.display = type === 'uniform' ? 'block' : 'none';
  document.getElementById('customPricing').style.display = type === 'custom' ? 'block' : 'none';
  if (type === 'custom') renderBlockPriceInputs();
}
 
function renderBlockPriceInputs(existingPrices = {}) {
  const container = document.getElementById('blockPriceInputs');
  container.innerHTML = '';
 
  if (currentBlocks.length === 0) {
    container.innerHTML = '<p class="toggle-hint">No blocks found. Select a venue with a custom seating layout.</p>';
    return;
  }
 
  currentBlocks.forEach(block => {
    const item = document.createElement('div');
    item.className = 'row-config-item';
    item.innerHTML = `
      <label>${block}</label>
      <input type="number" class="block-price-input" data-block="${block}"
        placeholder="R0.00" min="0" step="0.01"
        value="${existingPrices[block] !== undefined ? existingPrices[block] : ''}">
    `;
    container.appendChild(item);
  });
}
 

function collectPricing() {
  const priceType = document.querySelector('input[name="priceType"]:checked').value;
 
  if (priceType === 'uniform') {
    const price = parseFloat(document.getElementById('price').value);
    if (isNaN(price) || price < 0) return null;
    return { type: 'uniform', price };
  } else {
    const inputs = document.querySelectorAll('.block-price-input');
    const blockPrices = {};
    let valid = true;
    inputs.forEach(input => {
      const val = parseFloat(input.value);
      if (isNaN(val) || val < 0) { valid = false; return; }
      blockPrices[input.dataset.block] = val;
    });
    if (!valid || Object.keys(blockPrices).length === 0) return null;
    return { type: 'custom', blockPrices };
  }
}
 
async function submitEvent(e) {
  e.preventDefault();
 
  const name        = document.getElementById('name').value.trim();
  const description = document.getElementById('description').value.trim();
  const host        = document.getElementById('host').value.trim();
  const category    = document.getElementById('category').value;
  const venueID     = document.getElementById('venueID').value;
  const image       = document.getElementById('image').value.trim();
 
  if (!name || !category || !venueID) {
    alert('Please fill in all required fields.');
    return;
  }
 
  const pricing = collectPricing();
  if (!pricing) {
    alert('Please complete the pricing configuration.');
    return;
  }
 
  const payload = {
    name,
    description,
    host,
    category,
    venueID,
    image,
    price: pricing.type === 'uniform' ? pricing.price : 0,
    blockPrices: pricing.type === 'custom' ? pricing.blockPrices : null,
    priceType: pricing.type
  };
 
  const isEditing = !!currentEventId;
  const url    = isEditing ? `/api/events/${currentEventId}` : '/api/events';
  const method = isEditing ? 'PUT' : 'POST';
 
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      alert(isEditing ? 'Event updated successfully!' : 'Event added successfully!');
      window.location.reload();
    } else {
      alert('Error: ' + (data.message || 'Something went wrong'));
    }
  } catch (err) {
    alert('Failed to save event: ' + err.message);
  }
}
 

function loadEvent(eventId) {
  const ev = existingEvents.find(e => e._id === eventId);
  if (!ev) return;
 
  currentEventId = eventId;
 
  // sidebar active state
  document.querySelectorAll('.venue-list-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.querySelector(`.venue-list-item[data-id="${eventId}"]`);
  if (activeItem) activeItem.classList.add('active');
 
  // header and buttons
  document.getElementById('formTitle').textContent = ev.name;
  document.getElementById('formSubtitle').textContent = `${ev.category} · ${ev.host || ''}`;
  document.getElementById('submitBtn').textContent = 'Update Event';
  document.getElementById('clearBtn').style.display = 'none';
  document.getElementById('deleteBtn').style.display = 'block';
 
  // fill fields
  document.getElementById('eventId').value  = eventId;
  document.getElementById('name').value        = ev.name || '';
  document.getElementById('description').value = ev.description || '';
  document.getElementById('host').value        = ev.host || '';
  document.getElementById('category').value    = ev.category || '';
  document.getElementById('venueID').value     = ev.venueID || '';
  document.getElementById('image').value       = ev.image || '';
 
  if (ev.image) {
    document.getElementById('previewImg').src = ev.image;
    document.getElementById('imagePreview').style.display = 'block';
  }
 
  // load venue blocks
  onVenueChange();
 
  // set pricing
  const priceType = ev.priceType || 'uniform';
  document.querySelector(`input[name="priceType"][value="${priceType}"]`).checked = true;
  togglePricing(priceType);
 
  if (priceType === 'uniform') {
    document.getElementById('price').value = ev.price || '';
  } else {
    renderBlockPriceInputs(ev.blockPrices || {});
  }
}
 

function resetForm() {
  currentEventId = null;
  currentBlocks  = [];
  document.getElementById('eventForm').reset();
  document.getElementById('imagePreview').style.display    = 'none';
  document.getElementById('blockPriceInputs').innerHTML    = '';
  document.getElementById('uniformPricing').style.display  = 'block';
  document.getElementById('customPricing').style.display   = 'none';
  document.getElementById('formTitle').textContent         = 'Add New Event';
  document.getElementById('formSubtitle').textContent      = 'Fill in the details below to add a new event';
  document.getElementById('submitBtn').textContent         = 'Add Event';
  document.getElementById('clearBtn').style.display        = 'block';
  document.getElementById('deleteBtn').style.display       = 'none';
  document.querySelectorAll('.venue-list-item').forEach(el => el.classList.remove('active'));
}
 
function deleteEvent() {
  eventToDelete = currentEventId;
  document.getElementById('confirmModal').style.display = 'flex';
}
 
async function confirmDelete() {
  if (!eventToDelete) return;
  try {
    const res = await fetch(`/api/events/${eventToDelete}`, { method: 'DELETE' });
    if (res.ok) {
      closeModal();
      window.location.reload();
    } else {
      const data = await res.json();
      alert('Error: ' + (data.message || 'Failed to delete event'));
    }
  } catch (err) {
    alert('Failed to delete event: ' + err.message);
  }
}
 
function closeModal() {
  document.getElementById('confirmModal').style.display = 'none';
  eventToDelete = null;
}