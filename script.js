const API = 'https://api.jikan.moe/v4';

let genre = 0;

const $ = (s) => document.querySelector(s);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAnime(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('API error: ' + response.status);
  }

  const json = await response.json();
  return json.data || [];
}

function createCard(anime) {
  const image =
    anime.images?.jpg?.large_image_url ||
    anime.images?.jpg?.image_url ||
    '';

  const title = anime.title || 'Unknown Anime';
  const year =
    anime.year ||
    anime.aired?.prop?.from?.slice(0, 4) ||
    '—';

  return `
    <article class="card" data-id="${anime.mal_id}">
      <img src="${image}" alt="${title}" loading="lazy">
      <div>
        <h3>${title}</h3>
        <p>⭐ ${anime.score ?? 'N/A'} • ${year}</p>
      </div>
    </article>
  `;
}

function render(selector, animeList) {
  const element = $(selector);

  if (!element) return;

  element.innerHTML = animeList.map(createCard).join('');

  element.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      openAnime(card.dataset.id);
    });
  });
}

async function loadSections() {

  // TRENDING
  try {
    const trending = await getAnime(
      API + '/top/anime?filter=airing&limit=10'
    );

    render('#trend', trending);
  } catch (error) {
    console.log('Trending error:', error);
  }

  // Wait before next API request
  await sleep(2000);

  // TOP RATED
  try {
    const topRated = await getAnime(
      API + '/top/anime?limit=10'
    );

    render('#rated', topRated);
  } catch (error) {
    console.log('Top Rated error:', error);

    if ($('#rated')) {
      $('#rated').innerHTML =
        '<p>Top Rated is temporarily unavailable. Refresh the page.</p>';
    }
  }

  // Wait again
  await sleep(2000);

  // UPCOMING
  try {
    const upcoming = await getAnime(
      API + '/top/anime?filter=upcoming&limit=10'
    );

    render('#new', upcoming);
  } catch (error) {
    console.log('Upcoming error:', error);

    if ($('#new')) {
      $('#new').innerHTML =
        '<p>Upcoming anime is temporarily unavailable. Refresh the page.</p>';
    }
  }
}


// SEARCH
async function searchAnime() {

  const input = $('#search');

  if (!input) return;

  const query = input.value.trim();

  if (!query) {
    if ($('#results')) $('#results').hidden = true;
    return;
  }

  if ($('#results')) $('#results').hidden = false;

  try {

    let url =
      API +
      '/anime?q=' +
      encodeURIComponent(query) +
      '&limit=12';

    if (genre) {
      url += '&genres=' + genre;
    }

    const results = await getAnime(url);

    render('#searchgrid', results);

  } catch (error) {

    console.log('Search error:', error);

    if ($('#searchgrid')) {
      $('#searchgrid').innerHTML =
        '<p>Search is temporarily unavailable. Please try again.</p>';
    }
  }
}


// SEARCH DELAY
let searchTimer;

if ($('#search')) {

  $('#search').addEventListener('input', () => {

    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      searchAnime();
    }, 700);

  });

}


// GENRES
document.querySelectorAll('#genres button').forEach(button => {

  button.addEventListener('click', () => {

    document
      .querySelectorAll('#genres button')
      .forEach(btn => btn.classList.remove('active'));

    button.classList.add('active');

    genre = Number(button.dataset.g);

    searchAnime();

  });

});


// ANIME DETAILS
async function openAnime(id) {

  try {

    const response =
      await fetch(API + '/anime/' + id + '/full');

    if (!response.ok) return;

    const json = await response.json();

    const anime = json.data;

    if (!anime) return;

    if ($('#mi')) {
      $('#mi').src =
        anime.images?.jpg?.large_image_url || '';
    }

    if ($('#mt')) {
      $('#mt').textContent =
        anime.title || 'Anime';
    }

    if ($('#mm')) {
      $('#mm').textContent =
        `⭐ ${anime.score ?? 'N/A'} • ${anime.year ?? '—'} • ${anime.episodes ?? '?'} episodes`;
    }

    if ($('#ms')) {
      $('#ms').textContent =
        anime.synopsis || 'No synopsis available.';
    }

    if ($('#mal')) {
      $('#mal').href =
        anime.url || '#';
    }

    if ($('#modal')) {
      $('#modal').hidden = false;
    }

  } catch (error) {

    console.log('Details error:', error);

  }

}


// CLOSE MODAL
if ($('#close')) {

  $('#close').addEventListener('click', () => {
    $('#modal').hidden = true;
  });

}

if ($('#modal')) {

  $('#modal').addEventListener('click', (event) => {

    if (event.target.id === 'modal') {
      $('#modal').hidden = true;
    }

  });

}


// DARK / LIGHT MODE
if ($('#theme')) {

  $('#theme').addEventListener('click', () => {

    document.body.classList.toggle('light');

    $('#theme').textContent =
      document.body.classList.contains('light')
        ? '☀️'
        : '🌙';

  });

}


// START WEBSITE
loadSections();
