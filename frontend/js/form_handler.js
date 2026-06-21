function toggleFaq(btn) { 
  btn.parentElement.classList.toggle('open'); 
}

document.addEventListener('DOMContentLoaded', () => {
  // ── FULL LEAD CAPTURE FORM HANDLER ──
  const demoForm    = document.getElementById('demo-request-form');
  const submitBtn   = document.getElementById('demo-submit-btn');
  const statusMsg   = document.getElementById('cta-status-msg');

  if (demoForm && submitBtn) {
    demoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Collect field values
      const name     = (document.getElementById('inp-name')?.value     || '').trim();
      const email    = (document.getElementById('inp-email')?.value    || '').trim();
      const phone    = (document.getElementById('inp-phone')?.value    || '').trim();
      const company  = (document.getElementById('inp-company')?.value  || '').trim();
      const industry = (document.getElementById('inp-industry')?.value || '').trim();

      // Validate required fields
      if (!name) { showError('Please enter your full name.'); return; }
      if (!email || !email.includes('@')) { showError('Please enter a valid email address.'); return; }
      if (!phone) { showError('Please enter your phone number.'); return; }
      if (!industry) { showError('Please select your industry.'); return; }

      // UI: loading state
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending...';
      if (statusMsg) statusMsg.textContent = '';

      try {
        // 1. Send email notification via FormSubmit
        const emailRes = await fetch('https://formsubmit.co/ajax/5583de775a645c0081ded98851ed668c', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            'Name': name,
            'Email': email,
            'Phone': phone,
            'Company': company || 'N/A',
            'Industry': industry,
            _subject: `⚡ New Demo Lead: ${name} (${industry})`,
            _template: 'box'
          })
        });

        const emailData = await emailRes.json();
        const emailOk = emailRes.ok && emailData.success;

        // 2. Write lead to Supabase (non-blocking)
        if (typeof window.logLeadToSupabase === 'function') {
          window.logLeadToSupabase({ name, email, phone, company, industry }).catch(err => {
            console.warn('Supabase lead log failed:', err);
          });
        }

        if (emailOk) {
          // Show success state
          demoForm.innerHTML = `
            <div style="
              background: rgba(0, 82, 255, 0.1);
              border: 1px solid rgba(0, 82, 255, 0.25);
              border-radius: 16px;
              padding: 2.5rem 2rem;
              text-align: center;
              animation: fadeUp 0.5s ease both;
            ">
              <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">✓</div>
              <div style="color: #60A5FA; font-weight: 700; font-size: 1.15rem; margin-bottom: 0.5rem;">
                Request sent, ${name.split(' ')[0]}!
              </div>
              <div style="color: rgba(255,255,255,0.6); font-size: 0.95rem;">
                We'll reach out to <strong style="color:#fff">${email}</strong> within 24 hours with a live demo for <em>${industry}</em>.
              </div>
            </div>`;
        } else {
          throw new Error('Email submission failed');
        }

      } catch (err) {
        console.error('Form submission error:', err);
        showError('Something went wrong. Please try again or email us directly.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  function showError(msg) {
    if (statusMsg) {
      statusMsg.style.color = '#f87171';
      statusMsg.textContent = msg;
    } else {
      alert(msg);
    }
  }

  // ── VIDEO LIGHTBOX MODAL HANDLER ──
  const playVideoTrigger = document.getElementById('play-video-trigger');
  const closeVideoTrigger = document.getElementById('close-video-trigger');
  const videoLightbox = document.getElementById('video-lightbox-modal');
  const videoIframe = document.getElementById('video-lightbox-iframe');
  
  const defaultVideoEmbedUrl = 'https://www.youtube.com/embed/0LT64_mgkro?si=qxBR1n7Q6JRIYzvG&autoplay=1&rel=0&modestbranding=1';

  if (playVideoTrigger && videoLightbox && videoIframe) {
    playVideoTrigger.addEventListener('click', () => {
      videoIframe.src = defaultVideoEmbedUrl;
      videoLightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; // Stop page scroll
    });
  }

  const closeLightbox = () => {
    if (videoLightbox && videoIframe) {
      videoLightbox.classList.remove('active');
      videoIframe.src = ''; // Stop video
      document.body.style.overflow = ''; // Re-enable scroll
    }
  };

  if (closeVideoTrigger) {
    closeVideoTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      closeLightbox();
    });
  }

  if (videoLightbox) {
    videoLightbox.addEventListener('click', (e) => {
      if (e.target === videoLightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoLightbox && videoLightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // ── INTERACTIVE COMPARISON DRAG SLIDER ──
  const widget = document.getElementById('comparison-slider-widget');
  const divider = document.getElementById('slider-divider-line');
  const rightPanel = document.getElementById('slider-right-panel');

  if (widget && divider && rightPanel) {
    let isDragging = false;

    const updateSlider = (clientX) => {
      const rect = widget.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      let percentage = (relativeX / rect.width) * 100;
      
      // Clamp between 0% and 100%
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;
      
      // Set right panel width & divider position
      rightPanel.style.width = percentage + '%';
      divider.style.left = percentage + '%';
    };

    // Desktop Mouse Drag Events
    divider.addEventListener('mousedown', (e) => {
      isDragging = true;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch Screen Swipe Events
    divider.addEventListener('touchstart', (e) => {
      isDragging = true;
      // Prevent screen bounce on swipe drag
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      if (e.touches && e.touches[0]) {
        updateSlider(e.touches[0].clientX);
        // Explicitly prevent page scrolling/panning during drag
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Also support clicking anywhere on the widget to transition the slider position
    widget.addEventListener('click', (e) => {
      // Ignore click actions originating directly from drag handle
      if (e.target.closest('.slider-handle')) return;
      updateSlider(e.clientX);
    });
  }

  // ── LIVE CALL TIMER (counts up to simulate active voice call) ──
  const callTimerEl = document.getElementById('call-timer');
  if (callTimerEl) {
    let seconds = 42; // start mid-call for realism
    setInterval(() => {
      seconds++;
      const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      callTimerEl.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  // ── ROTATING CALL TRANSCRIPT ──
  const transcriptEl = document.getElementById('transcript-text');
  if (transcriptEl) {
    const lines = [
      'Booking your appointment for Thursday at 10 AM...',
      'Let me check the available slots for tomorrow...',
      'Great! I\'ve confirmed Friday at 2 PM. You\'ll receive a text shortly.',
      'You\'re all set — confirmation sent to your number.',
      'Transferring your call to the service team now...',
      'I\'ve noted your request. A technician will follow up today.',
    ];
    let lineIdx = 0;
    setInterval(() => {
      lineIdx = (lineIdx + 1) % lines.length;
      transcriptEl.style.opacity = '0';
      setTimeout(() => {
        transcriptEl.textContent = lines[lineIdx];
        transcriptEl.style.opacity = '1';
        transcriptEl.style.transition = 'opacity 0.5s ease';
      }, 300);
    }, 8000);
  }
});

