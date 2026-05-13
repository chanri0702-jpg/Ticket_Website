let currentVenueId = null;
let venueToDelete = null;
 
document.getElementById('layoutImage').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('previewImg').src = e.target.result;
      document.getElementById('imagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});
 
function toggleCustomSeating() {
  const checked = document.getElementById('customSeating').checked;
  document.getElementById('customSeatingPanel').style.display = checked ? 'block' : 'none';
  if (!checked) {
    document.getElementById('blocksContainer').innerHTML = '';
    document.getElementById('numBlocks').value = '';
  }
}
 
function generateBlocks() {
  const numBlocks = parseInt(document.getElementById('numBlocks').value);
  if (!numBlocks || numBlocks < 1 || numBlocks > 20) {
    alert('Please enter a number of blocks between 1 and 20.');
    return;
  }
 
  const container = document.getElementById('blocksContainer');
  const existing = container.querySelectorAll('.block-form').length;
 
  // only regenerate if count changed
  if (existing === numBlocks) return;
 
  container.innerHTML = '';
 
  for (let i = 0; i < numBlocks; i++) {
    container.appendChild(createBlockForm(i));
  }
}
 
function createBlockForm(index, blockData = null) {
  const div = document.createElement('div');
  div.className = 'block-form';
  div.dataset.index = index;
 
  const blockName = blockData ? blockData.block : `Block ${index + 1}`;
  const numRows = blockData ? blockData.rows.length : '';
  const rowType = blockData ? (blockData.uniform ? 'uniform' : 'custom') : 'uniform';
  const uniformCount = blockData && blockData.uniform ? blockData.rows[0].seats : '';
 
  div.innerHTML = `
    <div class="block-form-header">
      <h4>Block ${index + 1}</h4>
    </div>
    <div class="block-form-body">
      <div class="block-name-row">
        <div class="form-group">
          <label>Block Name *</label>
          <input type="text" class="block-name" placeholder="e.g. VIP, Floor, Balcony" value="${blockName}" required>
        </div>
        <div class="form-group">
          <label>Number of Rows *</label>
          <input type="number" class="block-rows" placeholder="e.g. 5" min="1" max="50" value="${numRows}"
            onchange="updateRowInputs(this, ${index})">
        </div>
      </div>
 
      <div class="form-group">
        <label>Row Configuration</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" name="rowType_${index}" value="uniform" ${rowType === 'uniform' ? 'checked' : ''}
              onchange="toggleRowType(${index}, 'uniform')">
            Uniform rows
          </label>
          <label class="radio-label">
            <input type="radio" name="rowType_${index}" value="custom" ${rowType === 'custom' ? 'checked' : ''}
              onchange="toggleRowType(${index}, 'custom')">
            Custom rows
          </label>
        </div>
      </div>
 
      <!-- Uniform: single input -->
      <div class="uniform-config" id="uniformConfig_${index}" style="display:${rowType === 'uniform' ? 'block' : 'none'};">
        <div class="form-group">
          <label>Seats per Row *</label>
          <input type="number" class="uniform-seats" placeholder="e.g. 10" min="1" value="${uniformCount}">
        </div>
      </div>
 
      <!-- Custom: per-row inputs -->
      <div class="custom-config rows-config" id="customConfig_${index}" style="display:${rowType === 'custom' ? 'block' : 'none'};">
        ${blockData && !blockData.uniform ? renderCustomRows(blockData.rows) : ''}
      </div>
    </div>
  `;
 
  return div;
}
 
function renderCustomRows(rows) {
  return rows.map((r, i) => `
    <div class="row-config-item">
      <label>Row ${String.fromCharCode(65 + i)}</label>
      <input type="number" class="custom-row-seats" placeholder="seats" min="1" value="${r.seats}">
    </div>
  `).join('');
}
 
function toggleRowType(blockIndex, type) {
  document.getElementById(`uniformConfig_${blockIndex}`).style.display = type === 'uniform' ? 'block' : 'none';
  document.getElementById(`customConfig_${blockIndex}`).style.display = type === 'custom' ? 'block' : 'none';
 
  // if switching to custom, generate row inputs based on current row count
  if (type === 'custom') {
    const blockForm = document.querySelector(`.block-form[data-index="${blockIndex}"]`);
    const numRows = parseInt(blockForm.querySelector('.block-rows').value) || 0;
    generateCustomRowInputs(blockIndex, numRows);
  }
}
 
function updateRowInputs(input, blockIndex) {
  const numRows = parseInt(input.value) || 0;
  const blockForm = document.querySelector(`.block-form[data-index="${blockIndex}"]`);
  const isCustom = blockForm.querySelector(`input[name="rowType_${blockIndex}"]:checked`).value === 'custom';
  if (isCustom) generateCustomRowInputs(blockIndex, numRows);
}
 
function generateCustomRowInputs(blockIndex, numRows) {
  const container = document.getElementById(`customConfig_${blockIndex}`);
  container.innerHTML = '';
  for (let i = 0; i < numRows; i++) {
    const item = document.createElement('div');
    item.className = 'row-config-item';
    item.innerHTML = `
      <label>Row ${String.fromCharCode(65 + i)}</label>
      <input type="number" class="custom-row-seats" placeholder="seats" min="1">
    `;
    container.appendChild(item);
  }
}
 
function collectSeatTemplate() {
  const blockForms = document.querySelectorAll('.block-form');
  const seatTemplate = [];
  let valid = true;
 
  blockForms.forEach((blockForm, blockIndex) => {
    const blockName = blockForm.querySelector('.block-name').value.trim();
    const numRows = parseInt(blockForm.querySelector('.block-rows').value);
    const rowType = blockForm.querySelector(`input[name="rowType_${blockIndex}"]:checked`).value;
 
    if (!blockName || !numRows) { valid = false; return; }
 
    if (rowType === 'uniform') {
      const seatsPerRow = parseInt(blockForm.querySelector('.uniform-seats').value);
      if (!seatsPerRow) { valid = false; return; }
      for (let r = 0; r < numRows; r++) {
        for (let s = 1; s <= seatsPerRow; s++) {
          seatTemplate.push({ row: String.fromCharCode(65 + r), seatNumber: s, block: blockName });
        }
      }
    } else {
      const rowInputs = blockForm.querySelectorAll('.custom-row-seats');
      rowInputs.forEach((input, r) => {
        const seats = parseInt(input.value);
        if (!seats) { valid = false; return; }
        for (let s = 1; s <= seats; s++) {
          seatTemplate.push({ row: String.fromCharCode(65 + r), seatNumber: s, block: blockName });
        }
      });
    }
  });
 
  return valid ? seatTemplate : null;
}
 
async function submitVenue(e) {
  e.preventDefault();
 
  const name = document.getElementById('name').value.trim();
  const address1 = document.getElementById('address1').value.trim();
  const address2 = document.getElementById('address2').value.trim();
  const zip = document.getElementById('zip').value.trim();
  const totalSeats = parseInt(document.getElementById('totalSeats').value);
  const customSeating = document.getElementById('customSeating').checked;
 
  if (!name || !address1 || !zip || !totalSeats) {
    alert('Please fill in all required fields.');
    return;
  }
 
  let seatTemplate = [];
  if (customSeating) {
    seatTemplate = collectSeatTemplate();
    if (!seatTemplate) {
      alert('Please complete all block and row configurations.');
      return;
    }
  }
 
  // Upload layout image to Cloudinary if a new file was selected
  let layoutImage = document.getElementById('currentLayoutImage') ? document.getElementById('currentLayoutImage').value : '';
  const imageFile = document.getElementById('layoutImage').files[0];
  if (imageFile) {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const uploadRes = await fetch('/api/upload-image', { method: 'POST', body: formData, credentials: 'include' });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        alert('Image upload failed: ' + (err.message || 'Unknown error'));
        return;
      }
      const uploadData = await uploadRes.json();
      layoutImage = uploadData.url;
    } catch (err) {
      alert('Image upload failed: ' + err.message);
      return;
    }
  }

  const payload = { name, address1, address2, zip, totalSeats, seatTemplate, layoutImage };
 
  const isEditing = !!currentVenueId;
  const url = isEditing ? `/api/venues/${currentVenueId}` : '/api/venues';
  const method = isEditing ? 'PUT' : 'POST';
 
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
 
    const data = await res.json();
    if (res.ok) {
      alert(isEditing ? 'Venue updated successfully!' : 'Venue added successfully!');
      window.location.reload();
    } else {
      alert('Error: ' + (data.message || 'Something went wrong'));
    }
  } catch (err) {
    alert('Failed to save venue: ' + err.message);
  }
}
 
function loadVenue(venueId) {
  const venue = existingVenues.find(v => v._id === venueId);
  if (!venue) return;
 
  currentVenueId = venueId;
 
  // update active state in sidebar
  document.querySelectorAll('.venue-list-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.querySelector(`.venue-list-item[data-id="${venueId}"]`);
  if (activeItem) activeItem.classList.add('active');
 
  // update header and buttons for edit mode
  document.getElementById('formTitle').textContent = venue.name;
  document.getElementById('formSubtitle').textContent = `${venue.address1} · ${venue.zip}`;
  document.getElementById('submitBtn').textContent = 'Update Venue';
  document.getElementById('clearBtn').style.display = 'none';
  document.getElementById('deleteBtn').style.display = 'block';
 
  // fill basic fields
  document.getElementById('venueId').value = venueId;
  document.getElementById('name').value = venue.name || '';
  document.getElementById('address1').value = venue.address1 || '';
  document.getElementById('address2').value = venue.address2 || '';
  document.getElementById('zip').value = venue.zip || '';
  document.getElementById('totalSeats').value = venue.totalSeats || '';

  // show existing layout image
  const previewImg = document.getElementById('previewImg');
  const imagePreview = document.getElementById('imagePreview');
  let currentHidden = document.getElementById('currentLayoutImage');
  if (!currentHidden) {
    currentHidden = document.createElement('input');
    currentHidden.type = 'hidden';
    currentHidden.id = 'currentLayoutImage';
    document.getElementById('venueForm').appendChild(currentHidden);
  }
  if (venue.layoutImage) {
    currentHidden.value = venue.layoutImage;
    previewImg.src = venue.layoutImage;
    imagePreview.style.display = 'block';
  } else {
    currentHidden.value = '';
    imagePreview.style.display = 'none';
  }
 
  // handle seating template
  const hasSeating = venue.seatTemplate && venue.seatTemplate.length > 0;
  document.getElementById('customSeating').checked = hasSeating;
  document.getElementById('customSeatingPanel').style.display = hasSeating ? 'block' : 'none';
 
  if (hasSeating) {
    const blocks = {};
    venue.seatTemplate.forEach(seat => {
      if (!blocks[seat.block]) blocks[seat.block] = {};
      if (!blocks[seat.block][seat.row]) blocks[seat.block][seat.row] = 0;
      blocks[seat.block][seat.row] = Math.max(blocks[seat.block][seat.row], seat.seatNumber);
    });
 
    const blockNames = Object.keys(blocks);
    document.getElementById('numBlocks').value = blockNames.length;
 
    const container = document.getElementById('blocksContainer');
    container.innerHTML = '';
 
    blockNames.forEach((blockName, i) => {
      const rows = Object.keys(blocks[blockName]).sort();
      const seatCounts = rows.map(r => ({ seats: blocks[blockName][r] }));
      const isUniform = seatCounts.every(r => r.seats === seatCounts[0].seats);
 
      const blockData = {
        block: blockName,
        rows: seatCounts,
        uniform: isUniform
      };
 
      container.appendChild(createBlockForm(i, blockData));
    });
  }
}
 
function resetForm() {
  currentVenueId = null;
  document.getElementById('venueForm').reset();
  document.getElementById('blocksContainer').innerHTML = '';
  document.getElementById('customSeatingPanel').style.display = 'none';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('formTitle').textContent = 'Add New Venue';
  document.getElementById('formSubtitle').textContent = 'Fill in the details below to add a new venue';
  document.getElementById('submitBtn').textContent = 'Add Venue';
  document.getElementById('clearBtn').style.display = 'block';
  document.getElementById('deleteBtn').style.display = 'none';
  document.querySelectorAll('.venue-list-item').forEach(el => el.classList.remove('active'));
}
 
function deleteVenue() {
  venueToDelete = currentVenueId;
  document.getElementById('confirmModal').style.display = 'flex';
}
 
async function confirmDelete() {
  if (!venueToDelete) return;
  try {
    const res = await fetch(`/api/venues/${venueToDelete}`, { method: 'DELETE' });
    if (res.ok) {
      closeModal();
      window.location.reload();
    } else {
      const data = await res.json();
      alert('Error: ' + (data.message || 'Failed to delete venue'));
    }
  } catch (err) {
    alert('Failed to delete venue: ' + err.message);
  }
}
 
function closeModal() {
  document.getElementById('confirmModal').style.display = 'none';
  venueToDelete = null;
}