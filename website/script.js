// ==========================================
// CUSTOMER FEEDBACK RATING PREDICTOR - DEMO
// ==========================================

// DOM Elements
const feedbackInput = document.getElementById('feedbackInput');
const predictBtn = document.getElementById('predictBtn');
const charCount = document.getElementById('charCount');
const resultModal = document.getElementById('resultModal');
const closeModal = document.getElementById('closeModal');
const starsContainer = document.getElementById('starsContainer');
const ratingValue = document.getElementById('ratingValue');
const confidenceFill = document.getElementById('confidenceFill');
const confidenceValue = document.getElementById('confidenceValue');
const sentimentBadge = document.getElementById('sentimentBadge');
const sentimentText = document.getElementById('sentimentText');
const errorToast = document.getElementById('errorToast');
const toastMessage = document.getElementById('toastMessage');

// ==========================================
// CHARACTER COUNTER
// ==========================================

feedbackInput.addEventListener('input', () => {
    const length = feedbackInput.value.length;
    charCount.textContent = length;
    
    // Color change based on length
    if (length > 500) {
        charCount.style.color = '#4CC9F0';
    } else if (length > 200) {
        charCount.style.color = '#7209B7';
    } else {
        charCount.style.color = '#8484a0';
    }
});

// ==========================================
// PREDICT BUTTON CLICK
// ==========================================

predictBtn.addEventListener('click', async () => {
    const feedback = feedbackInput.value.trim();

    // Validation
    if (!feedback) {
        showToast('Please enter some feedback text!');
        return;
    }

    if (feedback.length < 10) {
        showToast('Feedback is too short. Please enter at least 10 characters.');
        return;
    }

    // Add loading animation to button
    predictBtn.innerHTML = `
        <span class="btn-content">
            <i class="fas fa-spinner fa-spin"></i>
            Analyzing...
        </span>
        <div class="btn-glow"></div>
    `;
    predictBtn.disabled = true;

    // Call backend prediction API
    try {
        // Use relative URL - works for both local and production
        const resp = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: feedback })
        });

        if (!resp.ok) throw new Error('Prediction API error');

        const data = await resp.json();

        // Expecting: { rating: number, confidence: number, sentiment: string }
        const result = {
            rating: Number(data.rating) || 3,
            confidence: Number(data.confidence) || 75,
            sentiment: data.sentiment || 'Neutral'
        };

        displayResult(result);
    } catch (err) {
        console.error('Prediction failed:', err);
        // Fallback to demo generator if backend is unavailable
        const fallback = generatePrediction(feedback);
        showToast('Backend unavailable — showing demo result.');
        displayResult(fallback);
    } finally {
        // Reset button
        predictBtn.innerHTML = `
            <span class="btn-content">
                <i class="fas fa-wand-magic-sparkles"></i>
                Predict Rating
            </span>
            <div class="btn-glow"></div>
        `;
        predictBtn.disabled = false;
    }
});

// ==========================================
// GENERATE PREDICTION (DEMO LOGIC)
// ==========================================

function generatePrediction(feedback) {
    // Simple keyword-based sentiment analysis for demo
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'wonderful', 'fantastic', 'perfect', 'awesome', 'good', 'happy', 'satisfied', 'recommend'];
    const negativeWords = ['bad', 'terrible', 'worst', 'hate', 'awful', 'poor', 'disappointing', 'horrible', 'useless', 'waste', 'never', 'refund'];
    
    const feedbackLower = feedback.toLowerCase();
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
        if (feedbackLower.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
        if (feedbackLower.includes(word)) negativeScore++;
    });
    
    // Calculate rating based on sentiment
    let rating;
    let sentiment;
    let confidence;
    
    if (positiveScore > negativeScore * 2) {
        rating = 5;
        sentiment = 'Highly Positive';
        confidence = 85 + Math.random() * 15;
    } else if (positiveScore > negativeScore) {
        rating = 4;
        sentiment = 'Positive';
        confidence = 75 + Math.random() * 15;
    } else if (positiveScore === negativeScore) {
        rating = 3;
        sentiment = 'Neutral';
        confidence = 65 + Math.random() * 15;
    } else if (negativeScore > positiveScore) {
        rating = 2;
        sentiment = 'Negative';
        confidence = 70 + Math.random() * 15;
    } else {
        rating = 1;
        sentiment = 'Highly Negative';
        confidence = 80 + Math.random() * 15;
    }
    
    // Add some randomness for demo
    const randomFactor = Math.random();
    if (randomFactor < 0.1 && rating < 5) {
        rating++;
    } else if (randomFactor > 0.9 && rating > 1) {
        rating--;
    }
    
    return {
        rating: rating,
        confidence: Math.round(confidence),
        sentiment: sentiment
    };
}

// ==========================================
// DISPLAY RESULT IN MODAL
// ==========================================

function displayResult(result) {
    // Animate stars
    const stars = starsContainer.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.classList.remove('filled');
        if (index < result.rating) {
            setTimeout(() => {
                star.classList.add('filled');
            }, index * 150);
        }
    });
    
    // Animate rating value
    setTimeout(() => {
        animateValue(ratingValue, 0, result.rating, 1000);
    }, result.rating * 150);
    
    // Animate confidence bar
    setTimeout(() => {
        confidenceFill.style.width = result.confidence + '%';
        animateValue(confidenceValue, 0, result.confidence, 1000, '%');
    }, 500);
    
    // Update sentiment badge
    sentimentText.textContent = result.sentiment;
    
    // Update badge color and icon based on sentiment
    if (result.rating >= 4) {
        sentimentBadge.style.background = 'rgba(34, 197, 94, 0.2)';
        sentimentBadge.style.borderColor = '#22c55e';
        sentimentBadge.querySelector('i').className = 'fas fa-smile';
    } else if (result.rating === 3) {
        sentimentBadge.style.background = 'rgba(251, 191, 36, 0.2)';
        sentimentBadge.style.borderColor = '#fbbf24';
        sentimentBadge.querySelector('i').className = 'fas fa-meh';
    } else {
        sentimentBadge.style.background = 'rgba(239, 68, 68, 0.2)';
        sentimentBadge.style.borderColor = '#ef4444';
        sentimentBadge.querySelector('i').className = 'fas fa-frown';
    }
    
    // Show modal
    resultModal.classList.add('active');
}

// ==========================================
// ANIMATE NUMBER VALUES
// ==========================================

function animateValue(element, start, end, duration, suffix = '') {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current) + suffix;
    }, 16);
}

// ==========================================
// CLOSE MODAL
// ==========================================

closeModal.addEventListener('click', () => {
    resultModal.classList.remove('active');
});

// Close modal when clicking outside
resultModal.addEventListener('click', (e) => {
    if (e.target === resultModal) {
        resultModal.classList.remove('active');
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resultModal.classList.contains('active')) {
        resultModal.classList.remove('active');
    }
});

// ==========================================
// TOAST NOTIFICATION
// ==========================================

function showToast(message) {
    toastMessage.textContent = message;
    errorToast.classList.add('show');
    
    setTimeout(() => {
        errorToast.classList.remove('show');
    }, 3000);
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

feedbackInput.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to predict
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        predictBtn.click();
    }
});

// ==========================================
// SMOOTH SCROLL ANIMATIONS
// ==========================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('.input-section, .features-section, .footer').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'all 0.8s ease';
    observer.observe(section);
});

// ==========================================
// INTERACTIVE CURSOR EFFECT (OPTIONAL)
// ==========================================

document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.glass-card, .feature-card');
    
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        } else {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        }
    });
});

// ==========================================
// INITIALIZE
// ==========================================

console.log('%c🤖 AI Rating Predictor Loaded', 'color: #4CC9F0; font-size: 16px; font-weight: bold;');
console.log('%cPress Ctrl+Enter in the textarea to predict!', 'color: #7209B7; font-size: 12px;');
