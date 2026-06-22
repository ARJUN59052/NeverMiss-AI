function toggleFaq(btn) { 
  btn.parentElement.classList.toggle('open'); 
}

document.addEventListener('DOMContentLoaded', () => {
  // ── FULL LEAD CAPTURE FORM HANDLER ──
  let selectedPlan = '';
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
            'Selected Plan': selectedPlan ? (selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)) : 'None Selected',
            _subject: `⚡ New Demo Lead [Plan: ${selectedPlan ? selectedPlan.toUpperCase() : 'NONE'}]: ${name} (${industry})`,
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
  const videoPlayer = document.getElementById('video-lightbox-player');
  
  const defaultVideoUrl = 'voice_ai_video.mp4';

  if (playVideoTrigger && videoLightbox && videoPlayer) {
    playVideoTrigger.addEventListener('click', () => {
      if (!videoPlayer.src || videoPlayer.src === '' || videoPlayer.src.endsWith('/undefined')) {
        videoPlayer.src = defaultVideoUrl;
      }
      videoLightbox.classList.add('active');
      videoPlayer.play().catch(err => console.log('Auto-play blocked or failed:', err));
      document.body.style.overflow = 'hidden'; // Stop page scroll
    });
  }

  const closeLightbox = () => {
    if (videoLightbox && videoPlayer) {
      videoLightbox.classList.remove('active');
      videoPlayer.pause();
      videoPlayer.currentTime = 0; // Reset video to start
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

  // ── INTEGRATIONS HOVER HIGHLIGHTS ──
  const appNodes = document.querySelectorAll('.app-node');
  appNodes.forEach(node => {
    const nodeClass = Array.from(node.classList).find(c => c.startsWith('node-'));
    if (nodeClass) {
      const key = nodeClass.replace('node-', '');
      const matchingLine = document.querySelector(`.line-${key}`);
      if (matchingLine) {
        node.addEventListener('mouseenter', () => {
          matchingLine.classList.add('highlight');
        });
        node.addEventListener('mouseleave', () => {
          matchingLine.classList.remove('highlight');
        });
      }
    }
  });

  // ── PRICING PLAN QUERY PARAMETER HANDLER ──
  function getHashParams() {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return {};
    const search = hash.substring(qIndex + 1);
    const params = {};
    search.split('&').forEach(pair => {
      const [key, val] = pair.split('=');
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });
    return params;
  }

  function handleHashPlan() {
    const params = getHashParams();
    const plan = (params.plan || '').toLowerCase();
    if (plan && ['launchpad', 'ascend', 'enterprise'].includes(plan)) {
      selectedPlan = plan;
      
      const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);
      let badge = document.getElementById('selected-plan-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'selected-plan-badge';
        badge.className = 'selected-plan-badge';
        const form = document.getElementById('demo-request-form');
        if (form) {
          form.parentNode.insertBefore(badge, form);
        }
      }
      
      badge.innerHTML = `You have selected the <strong>${planDisplay}</strong> plan. Fill in your details below to get started.`;
      badge.style.display = 'block';
      
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  window.addEventListener('hashchange', handleHashPlan);
  handleHashPlan();
});

