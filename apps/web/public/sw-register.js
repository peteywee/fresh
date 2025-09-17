if ('serviceWorker' in navigator && 'production' === process.env.NODE_ENV) {
  window.addEventListener('load', () =>
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.log('SW registration failed:', err))
  );
}
