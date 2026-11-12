export const triggerConfetti = () => {
  const colors = ['#22c55e', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.zIndex = '9999';
    el.style.width = Math.random() * 8 + 6 + 'px';
    el.style.height = Math.random() * 8 + 6 + 'px';
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '-20px';
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.9';
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    document.body.appendChild(el);
    
    const animationDuration = Math.random() * 2000 + 1500;
    const horizontalSway = (Math.random() - 0.5) * 200;
    
    const animation = el.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${horizontalSway}px, 105vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], {
      duration: animationDuration,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    });
    
    animation.onfinish = () => el.remove();
  }
};
