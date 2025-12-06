const statsKeys = ['playedGames', 'wonGames'/*, 'fastestGame'*/];
const prefixed = key => `freecell:${key}`;

const loadStats = () => {
  // Load any saved data
  statsKeys.forEach(key => {
    const val = localStorage.getItem(prefixed(key)) || 0;

    // write stats to page
    document.querySelector(`#${key}`).textContent = val;
  });
};

const resetStats = e => {
  e.preventDefault();

  dialog.show('Reset statistics?', () => {
    statsKeys.forEach(key => {
      localStorage.setItem(prefixed(key), 0);
    });

    loadStats();
  })
};

const showAboutScreen = e => {
  e.preventDefault();

  loadStats();
  document.querySelector('#about').showModal();
};

const hideAboutScreen = e => {
  e.preventDefault();

  document.querySelector('#about').close();
};

document.querySelector('#reset').addEventListener('mouseup', resetStats);
document.querySelector('#return').addEventListener('mouseup', hideAboutScreen);

document.querySelector('#reset').addEventListener('touchend', resetStats);
document.querySelector('#return').addEventListener('touchend', hideAboutScreen);
