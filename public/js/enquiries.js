document.addEventListener('DOMContentLoaded', loadAllQueries);

async function loadAllQueries() {
    const area = document.getElementById('adminQueriesArea');
    
    try {
        const response = await fetch('/api/enquiries');
        const queries = await response.json();

        if (queries.length === 0) {
            area.innerHTML = '<p style="text-align: center; color: var(--light-text);">No current enquiries in the system.</p>';
            return;
        }

        const esc = str => String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

        area.innerHTML = queries.map(q => {
            const dateSubmitted = new Date(q.createdAt).toLocaleDateString('en-ZA', { 
                day: 'numeric', month: 'short', year: 'numeric' 
            });

            return `
            <div class="query-card">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <h3>${esc(q.subject)}</h3>
                    <span style="font-size: 0.85rem; color: var(--light-text); font-weight: 600;">${esc(dateSubmitted)}</span>
                </div>
                <p><strong>From:</strong> ${esc(q.email)}</p>
                <p><strong>Message:</strong> ${esc(q.message)}</p>
                <p><strong>Current Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: var(--accent-color);">${esc(q.status)}</span></p>
                
                <div class="admin-update-section">
                    <div class="form-group">
                        <label>Update Status</label>
                        <select id="status-${esc(q._id)}">
                            <option value="open" ${q.status === 'open' ? 'selected' : ''}>Open</option>
                            <option value="in-progress" ${q.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="resolved" ${q.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Admin Response</label>
                        <textarea id="response-${esc(q._id)}" rows="2" placeholder="Type your response to the user here...">${esc(q.response)}</textarea>
                    </div>

                    <button class="btn-submit" onclick="updateQuery('${esc(q._id)}')" style="width: 200px; padding: 0.75rem;">Save Changes</button>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error:', error);
        area.innerHTML = '<p style="text-align: center; color: red;">Error connecting to the database.</p>';
    }
}

async function updateQuery(id) {
    const status = document.getElementById(`status-${id}`).value;
    const responseText = document.getElementById(`response-${id}`).value;

    try {
        const res = await fetch(`/api/enquiries/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status, response: responseText })
        });

        if (res.ok) {
            alert('Enquiry updated successfully!');
            loadAllQueries();
        } else {
            alert('Failed to update enquiry.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}