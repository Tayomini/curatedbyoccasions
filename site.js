(function () {
  'use strict';

  // Scroll-triggered fade-in for service cards.
  // Cards start hidden in CSS, so every path below must end with them visible.
  var cards = document.querySelectorAll('.service-card');

  function showAll() {
    Array.prototype.forEach.call(cards, function (c) { c.classList.add('visible'); });
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduceMotion) {
    showAll();
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    Array.prototype.forEach.call(cards, function (c) { observer.observe(c); });
  }

  // "Scroll down" buttons (replaces inline onclick handlers)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-scroll]') : null;
    if (!btn) { return; }
    var target = document.getElementById(btn.getAttribute('data-scroll'));
    if (target) { target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }
  });
})();
