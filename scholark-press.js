(() => {
  const grid = document.querySelector('.sk-press-grid');
  const carousel = document.querySelector('.sk-press-carousel');
  if (!grid || !carousel) return;

  // Dedicated article pages from the supplied media coverage list.
  const articles = [
    ['The Times of India', 'https://timesofindia.indiatimes.com/world/us/meet-shriyan-avadhanula-the-16-year-old-virginia-student-who-built-a-free-college-prep-platform-after-getting-frustrated-by-paid-resources-scholark-has-crossed-10000-users/articleshow/134412382.cms', 'times-of-india-provided.jpg'],
    ['Government Technology', 'https://www.govtech.com/education/higher-ed/high-schooler-builds-the-college-prep-platform-he-wanted', 'govtech-provided.jpg'],
    ['Times Now World', 'https://www.timesnowworld.com/us-news/virginia-student-shriyan-avadhanula-launches-free-college-prep-platform-scholark-article-156205410', 'times-now-world-provided.jpg'],
    ['Clarín', 'https://www.clarin.com/estados-unidos/estudiante-virginia-16-anos-diseno-plataforma-gratuita-facilitar-proceso-inscripcion-universidad-crear-herramienta-puedan-usar_0_LnwZIgkjFr.html', 'clarin-provided.jpg'],
    ['Eenadu', 'https://www.eenadu.net/telugu-news/nri/16-years-old-shriyan-avadhanula-built-a-free-college-prep-platform/1101/126171553', 'eenadu-provided.jpg'],
    ['OneIndia Kannada', 'https://kannada.oneindia.com/news/international/scholark-16-year-old-shriyan-avadhanula-builds-free-college-prep-platform-after-upset-with-paid-reso-468865.html', 'oneindia-kannada-provided.jpg'],
    ['Pehuenia Online', 'https://pehueniaonline.com.ar/adios-al-laberinto-universitario-un-joven-de-16-anos-crea-la-plataforma-gratuita-que-simplifica-el-acceso-para-miles/', 'pehuenia-online-provided.jpg'],
    ['FM 101.5 Sol del Norte', 'https://www.fmsoldelnorte.com.ar/articulo/un-estudiante-de-virginia-de-16-anos-diseno-una-plataforma-gratuita-para-facilitar-el-proceso-de-inscripcion-a-la-universidad-por-que-no-crear-una-herramienta-que-todos-puedan-usar.php', 'fm-sol-del-norte-provided.jpg'],
    ['The Politician', 'https://thepolitician.in/meet-shriyan-avadhanula-16-whose-free-college-prep-platform-crossed-10000-users', 'the-politician-provided.jpg'],
    ['The Local Report', 'https://articles.thelocalreport.in/meet-shriyan-avadhanula-the-16-year-old-virginia-student-who-built-a-free-college-prep-platform-after-getting-frustrated-by-paid-resources-scholark-has-crossed-10000-users/', 'the-local-report-provided.jpg'],
    ['Inkl', 'https://www.inkl.com/glance/news/meet-shriyan-avadhanula-virginia-student-who-built-a-free-college-prep-platform-after-getting-frustrated-by-paid-resources?section=personalized', 'inkl-provided.jpg'],
    ['Livdose', 'https://livdose.com/meet-shriyan-avadhanula-the-16-year-old-virginia-student-who-built-a-free-college-prep-platform-after-getting-frustrated-by-paid-resources-scholark-has-crossed-10000-users/', 'livdose-provided.jpg'],
    ['The Nabadiganta', 'https://english.nabadiganta.in/2026/09/22/meet-shriyan-avadhanula-the-16-year-old-virginia-student-who-built-a-free-college-prep-platform-after-getting-frustrated-by-paid-resources-scholark-has-crossed-10000-users/', 'the-nabadiganta-provided.jpg'],
    ['NewsHeadlineToday', 'https://newsheadlinetoday.com/meet-shriyan-avadhanula-the-16-year-old-virginia-student-who-built-a-free-college-prep-platform-after-getting-frustrated-by-paid-resources-scholark-has-crossed-10000-users/', 'news-headline-today-provided.jpg'],
    ['Sovereign News Station', 'https://snslive.uk/article/2668500', 'sns-provided.jpg'],
    ['Indmedia', 'https://indmedia.in/meet-shriyan-avadhanula-the-16-year-old-virginia-student-who-built-a-free-college-prep-platform-after-getting-frustrated-by-paid-resources-scholark-has-crossed-10000-users/', 'indmedia-provided.jpg'],
    ['Wisevoter', 'https://wisevoter.com/world/us/va/2026/09/22/virginia-student-built-free-college-prep-platform', 'wisevoter-provided.jpg'],
    ['Headlinne', 'https://www.headlinne.com/articles/meet-shriyan-avadhanula-16-whose-free-college-prep-platform-crossed-10-000-users-times-of-india', 'headlinne-provided.jpg'],
  ];
  const fragment = document.createDocumentFragment();
  for (const [name, url, logo] of articles) {
    const card = document.createElement('a');
    card.className = 'sk-press-card';
    card.href = url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', `Read Scholark coverage from ${name}`);
    const image = document.createElement('img');
    image.src = `assets/press/${logo}`;
    image.alt = name;
    image.loading = 'lazy';
    image.decoding = 'async';
    const logoBox = document.createElement('span');
    logoBox.className = 'sk-press-logo';
    logoBox.append(image);
    const nameBox = document.createElement('strong');
    nameBox.textContent = name;
    const cta = document.createElement('span');
    cta.innerHTML = 'Read the article <b aria-hidden="true">↗</b>';
    const meta = document.createElement('span');
    meta.className = 'sk-press-meta';
    meta.append(nameBox, cta);
    card.append(logoBox, meta);
    fragment.append(card);
  }
  grid.prepend(fragment);

  // This PDF entry is a coverage search page, so label it as a mention.
  const ein = document.createElement('a');
  ein.className = 'sk-press-card';
  ein.href = 'https://software.einnews.com/search/Shriyan/?search%5B%5D=news&search%5B%5D=press&order=relevance&age=90';
  ein.target = '_blank';
  ein.rel = 'noopener noreferrer';
  ein.setAttribute('aria-label', 'View Software Industry Today coverage mentions');
  ein.innerHTML = '<span class="sk-press-logo"><img src="assets/press/ein-news-provided.jpg" alt="EIN News" loading="lazy" decoding="async"></span><span class="sk-press-meta"><strong>Software Industry Today / EIN News</strong><span>View mentions <b aria-hidden="true">↗</b></span></span>';
  grid.append(ein);

  const counselor = document.createElement('a');
  counselor.className = 'sk-press-card';
  counselor.href = 'https://www.hscounselorweek.com/';
  counselor.target = '_blank';
  counselor.rel = 'noopener noreferrer';
  counselor.setAttribute('aria-label', 'View the High School Counselor Week roundup mentioning Scholark');
  counselor.innerHTML = '<span class="sk-press-logo"><img src="assets/press/high-school-counselor-week.jpg" alt="High School Counselor Week" loading="lazy" decoding="async"></span><span class="sk-press-meta"><strong>High School Counselor Week</strong><span>View roundup <b aria-hidden="true">↗</b></span></span>';
  grid.append(counselor);

  const cards = [...grid.querySelectorAll('.sk-press-card')];
  const prev = carousel.querySelector('.sk-press-prev');
  const next = carousel.querySelector('.sk-press-next');
  const toggle = document.querySelector('.sk-press-toggle');
  const position = document.querySelector('.sk-press-position');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const copies = document.createDocumentFragment();
  for (const card of cards) {
    const copy = card.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.tabIndex = -1;
    copies.append(copy);
  }
  grid.append(copies);
  const firstCopy = grid.children[cards.length];
  let manuallyPaused = reduceMotion;
  let pointerDown = false;
  let interactionUntil = 0;
  let visible = true;
  let shownIndex = -1;

  function step() { return cards[1].offsetLeft - cards[0].offsetLeft; }
  function loopWidth() { return firstCopy.offsetLeft - cards[0].offsetLeft; }
  function normalize() {
    const width = loopWidth();
    if (grid.scrollLeft >= width) grid.scrollLeft -= width;
  }
  function showPosition() {
    const index = Math.floor((grid.scrollLeft + 1) / step()) % cards.length;
    if (index !== shownIndex) {
      shownIndex = index;
      position.textContent = `${index + 1} of ${cards.length}`;
    }
  }
  function move(direction) {
    interactionUntil = performance.now() + 1600;
    if (direction < 0 && grid.scrollLeft < step()) grid.scrollLeft += loopWidth();
    grid.scrollBy({ left: direction * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function setPaused(value) {
    manuallyPaused = value;
    carousel.classList.toggle('is-paused', value);
    toggle.setAttribute('aria-pressed', String(value));
    toggle.setAttribute('aria-label', value ? 'Resume carousel' : 'Pause carousel');
    toggle.textContent = value ? 'Resume rotation' : 'Pause rotation';
  }
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  toggle.addEventListener('click', () => setPaused(!manuallyPaused));
  grid.addEventListener('pointerdown', () => { pointerDown = true; });
  window.addEventListener('pointerup', () => { pointerDown = false; interactionUntil = performance.now() + 1200; });
  window.addEventListener('pointercancel', () => { pointerDown = false; });
  window.addEventListener('blur', () => { pointerDown = false; });
  grid.addEventListener('wheel', () => { interactionUntil = performance.now() + 1600; }, { passive: true });
  grid.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  grid.addEventListener('scroll', () => { normalize(); showPosition(); }, { passive: true });
  window.addEventListener('resize', () => { normalize(); showPosition(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.1 }).observe(carousel);
  }
  showPosition();
  if (!reduceMotion) {
    let lastTime = 0;
    function flow(time) {
      const elapsed = Math.min(48, time - (lastTime || time));
      lastTime = time;
      if (!manuallyPaused && !pointerDown && visible && !document.hidden && time >= interactionUntil) {
        grid.scrollLeft += elapsed * 0.073;
        normalize();
        showPosition();
      }
      requestAnimationFrame(flow);
    }
    requestAnimationFrame(flow);
  } else {
    setPaused(true);
  }
})();
