function toggleFaq(btn) { btn.parentElement.classList.toggle('open'); }

async function getMailBody(emailValue, relativePath) {
  const defaultBody = `A visitor requested a demo of NeverMiss for the email: ${emailValue}`;
  try {
    const response = await fetch(relativePath);
    if (!response.ok) return defaultBody;
    let template = await response.text();
    const currentDate = new Date().toLocaleString();
    template = template.replace(/{email}/g, emailValue);
    template = template.replace(/{date}/g, currentDate);
    return template;
  } catch (e) {
    console.warn("Could not load custom email template, using default.", e);
    return defaultBody;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.querySelector('.cta-in');
  const submitBtn = document.querySelector('.cta-sub');
  const ctaRow = document.querySelector('.cta-row');
  
  if (emailInput && submitBtn) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const emailValue = emailInput.value.trim();
      
      if (!emailValue || !emailValue.includes('@')) {
        alert('Please enter a valid email address.');
        return;
      }
      
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending...';
      
      try {
        const messageBody = await getMailBody(emailValue, './mail_body.txt');
        const response = await fetch('https://formsubmit.co/ajax/m19968194@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email: emailValue,
            _subject: 'New Demo Request from NeverMiss Landing Page',
            _message: messageBody
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Log email submission to Supabase tracking database
          if (typeof window.logEmailToSupabase === 'function') {
            window.logEmailToSupabase(emailValue).catch(err => {
              console.warn('Visitor database email log failed:', err);
            });
          }

          ctaRow.style.display = 'block';
          ctaRow.innerHTML = `<div style="background: rgba(14, 168, 85, 0.15); border: 1px solid rgba(14, 168, 85, 0.3); padding: 1rem 1.5rem; border-radius: var(--radius); color: #4ade80; font-weight: 600; font-size: 1.05rem; display: inline-flex; align-items: center; gap: 8px; animation: fadeUp 0.5s ease both;">
            <span>✓</span> Demo request sent! We will contact you at ${emailValue} shortly.
          </div>`;
        } else {
          throw new Error('Submission failed');
        }
      } catch (err) {
        console.error(err);
        alert('Oops! Something went wrong. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
});
