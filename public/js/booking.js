const API = '/api'

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id)
const fmt = n => 'R ' + Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = d => new Date(d).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
const getUrlParam = name => {
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

function toast(msg, type = 'success') {
  const t = $('toast')
  t.textContent = msg
  t.className = `show ${type}`
  clearTimeout(window._toastTimer)
  window._toastTimer = setTimeout(() => { t.className = '' }, 3500)
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', ['book','history','admin'][i] === name)
  })
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  $(`tab-${name}`).classList.add('active')
  if (name === 'admin') loadAnalytics()
}

// ─── BOOKING TAB ─────────────────────────────────────────────────────────────
let selectedSeats   = []
let currentTimeSlot = null
let currentEvent    = null

async function initBookingTab() {
  try {
    const res    = await fetch(`${API}/events`)
    const events = await res.json()
    const sel    = $('book-event')
    events.forEach(e => {
      const opt = document.createElement('option')
      opt.value       = e._id
      opt.textContent = e.name
      opt.dataset.price = e.price
      opt.dataset.host  = e.host || '—'
      opt.dataset.image = e.image || ''
      sel.appendChild(opt)
    })
    
    // Pre-fill event if coming from view-event page
    const eventId = getUrlParam('eventId')
    const timeId = getUrlParam('timeId')
    if (eventId) {
      // Make sure the option exists
      const option = Array.from(sel.options).find(o => o.value === eventId)
      if (option) {
        sel.value = eventId
        await onEventChange()
        
        // Pre-fill time if provided
        if (timeId) {
          // Wait a moment for times to load
          await new Promise(r => setTimeout(r, 100))
          const timeSel = $('book-time')
          const timeOption = Array.from(timeSel.options).find(o => o.value === timeId)
          if (timeOption) {
            timeSel.value = timeId
            await onTimeChange()
          }
        }
      }
    }
  } catch { toast('Could not load events', 'error') }
}

async function onEventChange() {
  const sel   = $('book-event')
  const opt   = sel.options[sel.selectedIndex]
  const evId  = sel.value
  currentEvent = evId ? { 
    id: evId, 
    price: +opt.dataset.price, 
    host: opt.dataset.host, 
    name: opt.textContent,
    image: opt.dataset.image
  } : null

  // Reset time slot
  const tSel = $('book-time')
  tSel.innerHTML = '<option value="">— choose a time —</option>'
  $('time-info').style.display = 'none'
  $('seat-map-inner').innerHTML = '<div class="empty-state"><p>Select a time slot to view the seat map.</p></div>'
  selectedSeats = []
  updateOrderSummary()

  if (!evId) { $('event-info').style.display = 'none'; return }
  $('ev-host').textContent  = opt.dataset.host || '—'
  $('ev-price').textContent = fmt(opt.dataset.price)
  $('event-info').style.display = 'flex'

  try {
    const res   = await fetch(`${API}/times/event/${evId}`)
    const times = await res.json()
    times.forEach(t => {
      const o = document.createElement('option')
      o.value       = t._id
      o.textContent = `${fmtDate(t.eventTime)} — ${t.seatsAvailable}/${t.totalSeats} seats`
      tSel.appendChild(o)
    })
  } catch { toast('Could not load time slots', 'error') }
}

async function onTimeChange() {
  const timeId = $('book-time').value
  selectedSeats = []
  updateOrderSummary()

  const blockSel = $('book-block')
  blockSel.innerHTML = '<option value="">— choose a block —</option>'
  $('block-selector').style.display = 'none'
  $('seat-map-inner').innerHTML = '<div class="empty-state"><p>Select an event and time slot to view the seat map.</p></div>'

  if (!timeId) { $('time-info').style.display = 'none'; return }

  try {
    const res  = await fetch(`${API}/times/${timeId}`)
    currentTimeSlot = await res.json()
    $('ti-avail').textContent = currentTimeSlot.seatsAvailable
    $('ti-total').textContent = currentTimeSlot.totalSeats
    $('time-info').style.display = 'flex'

    if (currentTimeSlot.seats && currentTimeSlot.seats.length > 0) {
      // Populate block dropdown
      const blocks = [...new Set(currentTimeSlot.seats.map(s => s.block))].sort()
      blocks.forEach(b => {
        const o = document.createElement('option')
        o.value = b
        const avail = currentTimeSlot.seats.filter(s => s.block === b && s.isAvailable).length
        const total = currentTimeSlot.seats.filter(s => s.block === b).length
        o.textContent = `${b} — ${avail}/${total} available`
        blockSel.appendChild(o)
      })
      $('block-selector').style.display = 'block'
      // Auto-select first block and render it
      if (blocks.length > 0) {
        blockSel.value = blocks[0]
        renderSeatMap(currentTimeSlot.seats.filter(s => s.block === blocks[0]))
      } else {
        $('seat-map-inner').innerHTML = '<div class="empty-state"><p>No seats available in any block.</p></div>'
      }
    } else {
      renderSeatMap(currentTimeSlot.seats || [])
    }
  } catch { toast('Could not load seat map', 'error') }
}

function onBlockChange() {
  const block = $('book-block').value
  if (!block || !currentTimeSlot) {
    $('seat-map-inner').innerHTML = '<div class="empty-state"><p>Select a block above to view its seats.</p></div>'
    return
  }
  renderSeatMap(currentTimeSlot.seats.filter(s => s.block === block))
}

function renderSeatMap(seats) {
  // Group by row only (block is already filtered)
  const rows = {}
  seats.forEach(s => {
    if (!rows[s.row]) rows[s.row] = []
    rows[s.row].push(s)
  })

  const container = $('seat-map-inner')
  container.innerHTML = ''

  // Display venue layout image if available
  if (currentTimeSlot && currentTimeSlot.eventID) {
    const event = currentTimeSlot.eventID
    let venue = null
    
    // Handle nested populate: eventID could have venueID
    if (event.venueID) {
      venue = typeof event.venueID === 'object' ? event.venueID : null
    }
    
    /* console.log('[BookingDebug] currentTimeSlot.eventID:', event)
    console.log('[BookingDebug] venue:', venue)
    console.log('[BookingDebug] venue.layoutImage:', venue ? venue.layoutImage : 'NO VENUE') */
    
    if (venue && venue.layoutImage) {
      const imgContainer = document.createElement('div')
      imgContainer.style.cssText = 'margin-bottom:1.5rem;text-align:center;'
      const img = document.createElement('img')
      img.src = venue.layoutImage
      img.alt = (venue.name || 'Venue') + ' seating layout'
      img.style.cssText = 'max-width:100%;height:auto;border-radius:.5rem;max-height:400px;'
      img.onerror = () => { imgContainer.remove() }
      imgContainer.appendChild(img)
      container.appendChild(imgContainer)
    }
  }

  const now = new Date()

  if (Object.keys(rows).length === 0) {
    container.innerHTML += '<div class="empty-state"><p>No seats found in this block.</p></div>'
    return
  }

  const blocks = { '': rows }   // single-block wrapper for loop below
  Object.entries(blocks).forEach(([block, rows]) => {
    Object.entries(rows).sort().forEach(([row, rowSeats]) => {
      const rowEl = document.createElement('div')
      rowEl.className = 'seat-row'
      const lbl = document.createElement('div')
      lbl.className   = 'row-label'
      lbl.textContent = row
      rowEl.appendChild(lbl)

      rowSeats.sort((a, b) => a.seatNumber - b.seatNumber).forEach(s => {
        const seatEl = document.createElement('div')
        seatEl.className   = 'seat'
        seatEl.textContent = s.seatNumber

        const heldByOther = s.heldUntil && new Date(s.heldUntil) > now && s.heldBy !== $('book-email').value
        const isAvail     = s.isAvailable && !heldByOther

        if (!isAvail) {
          seatEl.classList.add('taken')
          seatEl.title = 'Not available'
        } else {
          seatEl.classList.add('available')
          seatEl.title = `${s.block} ${row}${s.seatNumber}`
          seatEl.onclick = () => toggleSeat(seatEl, s)
        }
        rowEl.appendChild(seatEl)
      })
      container.appendChild(rowEl)
    })
  })
}

function toggleSeat(el, seat) {
  const key = `${seat.block}|${seat.row}|${seat.seatNumber}`
  const idx = selectedSeats.findIndex(s => `${s.block}|${s.row}|${s.seatNumber}` === key)
  if (idx === -1) {
    selectedSeats.push({ row: seat.row, seatNumber: seat.seatNumber, block: seat.block })
    el.classList.replace('available', 'selected')
  } else {
    selectedSeats.splice(idx, 1)
    el.classList.replace('selected', 'available')
  }
  updateOrderSummary()
}

function updateOrderSummary() {
  const hasSeats = selectedSeats.length > 0 && currentEvent
  $('summary-placeholder').style.display = hasSeats ? 'none' : 'block'
  $('order-summary').style.display       = hasSeats ? 'block' : 'none'
  if (!hasSeats) return

  const tags = selectedSeats.map(s =>
    `<span class="sel-seat-tag">${s.block} ${s.row}${s.seatNumber}</span>`
  ).join('')

  $('selected-seats-display').innerHTML = `
    <div class="selected-summary">
      <div style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.5rem">Selected Seats (${selectedSeats.length})</div>
      ${tags}
    </div>`

  const total = (currentEvent.price * selectedSeats.length).toFixed(2)
  $('order-total').textContent = fmt(total)
}

async function confirmBooking() {
  const email  = $('book-email').value.trim()
  const timeId = $('book-time').value
  if (!email)              return toast('Please enter your email address', 'error')
  if (!currentEvent)       return toast('Please select an event', 'error')
  if (!timeId)             return toast('Please select a time slot', 'error')
  if (!selectedSeats.length) return toast('Please select at least one seat', 'error')

  const btn = $('confirm-btn')
  btn.innerHTML = '<span class="loader"></span> Processing…'
  btn.disabled  = true

  try {
    const res  = await fetch(`${API}/bookings`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        eventID: currentEvent.id,
        timeID:  timeId,
        seats:   selectedSeats
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)

    toast(`Booking confirmed! Total: ${fmt(data.total)}`, 'success')
    selectedSeats = []
    await onTimeChange()          // reload seat map
    updateOrderSummary()
  } catch (err) {
    toast(err.message || 'Booking failed', 'error')
  } finally {
    btn.textContent = 'Confirm Booking'
    btn.disabled    = false
  }
}

// ─── HISTORY TAB ──────────────────────────────────────────────────────────────
async function loadHistory() {
  const email = $('history-email').value.trim()
  if (!email) return toast('Please enter an email address', 'error')

  const list = $('history-list')
  list.innerHTML = '<div style="text-align:center;padding:2rem"><span class="loader"></span></div>'

  try {
    const res      = await fetch(`${API}/bookings/user/${encodeURIComponent(email)}`)
    const bookings = await res.json()

    if (!bookings.length) {
      list.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          </svg>
          <p>No bookings found for <strong>${email}</strong></p>
        </div>`
      return
    }

    list.innerHTML = '<div class="booking-list"></div>'
    const ul = list.querySelector('.booking-list')

    bookings.forEach(b => {
      const eventName = b.eventID?.name || 'Event'
      const time      = b.timeID?.eventTime ? fmtDate(b.timeID.eventTime) : '—'
      const tickets   = b.tickets.map(t =>
        `<span class="ticket-tag">${t.block} ${t.row}${t.seatNumber}</span>`
      ).join('')
      const paydate   = fmtDate(b.paydate)

      const card = document.createElement('div')
      card.className = 'booking-card'
      card.innerHTML = `
        <div class="booking-accent-bar"></div>
        <div class="booking-body">
          <div class="booking-event">${eventName}</div>
          <div class="booking-meta">📅 ${time} &nbsp;·&nbsp; Booked ${paydate}</div>
          <div class="booking-tickets">${tickets}</div>
        </div>
        <div class="booking-actions">
          <div>
            <div class="booking-total"><strong>${fmt(b.total)}</strong></div>
            <button class="btn btn-danger btn-sm" onclick="cancelBooking('${b._id}', this)">Cancel</button>
          </div>
        </div>`
      ul.appendChild(card)
    })
  } catch { toast('Failed to load bookings', 'error') }
}

async function cancelBooking(id, btn) {
  if (!confirm('Cancel this booking and release the seats?')) return
  btn.textContent = '…'
  btn.disabled    = true
  try {
    const res  = await fetch(`${API}/bookings/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    toast(`Booking cancelled. Refund: ${fmt(data.refund || 0)}`, 'success')
    btn.closest('.booking-card').remove()
  } catch (err) {
    toast(err.message || 'Cancel failed', 'error')
    btn.textContent = 'Cancel'
    btn.disabled    = false
  }
}

// ─── ADMIN ANALYTICS ──────────────────────────────────────────────────────────
async function loadAnalytics() {
  ['stat-bookings','stat-tickets','stat-revenue'].forEach(id => { $(id).textContent = '…' })
  $('popular-events-list').innerHTML = '<div class="loader"></div>'
  $('capacity-list').innerHTML       = '<div class="loader"></div>'
  $('chart-container').innerHTML     = '<div class="loader"></div>'

  try {
    const res  = await fetch(`${API}/bookings/admin/analytics`)
    const data = await res.json()

    // Summary stats
    $('stat-bookings').textContent = data.summary.totalBookings.toLocaleString()
    $('stat-tickets').textContent  = data.summary.totalTickets.toLocaleString()
    $('stat-revenue').textContent  = fmt(data.summary.totalRevenue)

    // Popular events table
    if (!data.popularEvents.length) {
      $('popular-events-list').innerHTML = '<p style="color:var(--muted);text-align:center;padding:1rem">No data yet.</p>'
    } else {
      $('popular-events-list').innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Event</th>
              <th>Host</th>
              <th>Tickets</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${data.popularEvents.map((e, i) => `
              <tr>
                <td><span class="rank-badge ${i < 3 ? 'top' : ''}">${i + 1}</span></td>
                <td style="font-weight:500">${e.eventName}</td>
                <td style="color:var(--muted)">${e.host || '—'}</td>
                <td>${e.ticketCount.toLocaleString()}</td>
                <td>${fmt(e.revenue)}</td>
              </tr>`).join('')}
          </tbody>
        </table>`
    }

    // Capacity usage
    if (!data.capacityUsage.length) {
      $('capacity-list').innerHTML = '<p style="color:var(--muted);text-align:center;padding:1rem">No time slots found.</p>'
    } else {
      $('capacity-list').innerHTML = data.capacityUsage.map(c => {
        const pct   = Math.round(c.usagePercent)
        const cls   = pct >= 90 ? 'high' : pct >= 65 ? 'warn' : ''
        return `
          <div class="capacity-row">
            <div>
              <div class="cap-name">${c.eventName}</div>
              <div class="cap-time">${fmtDate(c.eventTime)} &nbsp;·&nbsp; ${c.seatsUsed}/${c.totalSeats} seats</div>
            </div>
            <div class="cap-bar-wrap">
              <div class="cap-bar ${cls}" style="width:${pct}%"></div>
            </div>
            <div class="cap-pct">${pct}%</div>
          </div>`
      }).join('')
    }

    // Bookings-over-time bar chart
    renderChart(data.bookingsOverTime)
  } catch (err) {
    toast('Failed to load analytics. Is the server running?', 'error')
    $('popular-events-list').innerHTML = '<p style="color:var(--muted)">Error loading data.</p>'
    $('capacity-list').innerHTML       = '<p style="color:var(--muted)">Error loading data.</p>'
    $('chart-container').innerHTML     = '<p style="color:var(--muted)">Error loading data.</p>'
  }
}

function renderChart(data) {
  const container = $('chart-container')
  if (!data.length) {
    container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:1rem">No bookings in the last 30 days.</p>'
    return
  }

  const maxCount = Math.max(...data.map(d => d.count), 1)
  // Show last 14 data points max to avoid crowding
  const slice = data.slice(-14)

  container.innerHTML = `
    <div class="mini-chart">
      ${slice.map(d => {
        const h   = Math.max(4, Math.round((d.count / maxCount) * 72))
        const lbl = d._id.slice(5) // MM-DD
        return `
          <div class="bar-col">
            <div class="bar-col-fill" style="height:${h}px" title="${d._id}: ${d.count} bookings"></div>
            <div class="bar-col-label">${lbl}</div>
          </div>`
      }).join('')}
    </div>
    <div style="font-size:.75rem;color:var(--muted);margin-top:.5rem;text-align:right">
      Peak: ${maxCount} bookings/day
    </div>`
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initBookingTab()
})