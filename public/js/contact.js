document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;

    try {
        const response = await fetch('/api/enquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, subject, message })
        });

        if (response.ok) {
            alert('Enquiry submitted successfully!');
            document.getElementById('contactForm').reset();
        } else {
            alert('Failed to submit enquiry. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please check your connection.');
    }
});