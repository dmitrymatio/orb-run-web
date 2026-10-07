const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('The #app element is required.');
}

app.textContent = 'Orb Run is loading…';
