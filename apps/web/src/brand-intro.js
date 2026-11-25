window.brandIntroFinished = new Promise(resolve => {
  const intro = document.querySelector('#brand-intro');
  const controller = new AbortController();
  let seen = false;
  try { seen = sessionStorage.getItem('pink-delight.intro-seen') === '1'; } catch {}
  if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    intro.remove();
    resolve();
    return;
  }
  let leaving = false;
  async function finish() {
    if (leaving) return;
    leaving = true;
    clearTimeout(timeout);
    controller.abort();
    try { sessionStorage.setItem('pink-delight.intro-seen', '1'); } catch {}
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && intro.animate) {
      await intro.animate([{opacity: 1}, {opacity: 0}], {duration: 220, easing: 'ease-out', fill: 'forwards'}).finished.catch(() => {});
    }
    intro.close();
    intro.remove();
    resolve();
  }
  const timeout = setTimeout(finish, 15000);
  intro.querySelector('button').onclick = finish;
  intro.oncancel = event => { event.preventDefault(); finish(); };
  intro.showModal();
  import('./brand-animation.js').then(({animateLogo}) => {
    if (!leaving) animateLogo(intro.querySelector('canvas'), finish, controller.signal);
  }).catch(finish);
});
