const numbers = document.querySelectorAll('.number');
    
const observerOptions = {
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const number = entry.target;
      animateNumber(number);
      observer.unobserve(number);
    }
  });
}, observerOptions);

numbers.forEach(number => {
  observer.observe(number);
});

function animateNumber(element) {
  const target = parseInt(element.getAttribute('data-target'));
  const duration = 2000; // 2 seconds
  const steps = 60;
  const stepValue = target / steps;
  let current = 0;
  
  const timer = setInterval(() => {
    current += stepValue;
    if (current >= target) {
      element.textContent = target + '+';
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, duration / steps);
}