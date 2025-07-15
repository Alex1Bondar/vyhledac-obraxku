
const form = document.getElementById('search-form');
const queryInput = document.getElementById('query');
const gallery = document.getElementById('gallery');

const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalInfo = document.getElementById('modal-info');
const closeModalBtn = document.getElementById('close');

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');
const pagination = document.getElementById('pagination');

const onlyFavoritesCheckbox = document.getElementById('only-favorites');

const API_KEY = '51327739-228a92da020e2149905f23a18';
const BASE_URL = 'https://pixabay.com/api/';

let currentPage = 1;
let totalPages = 1;
let currentQuery = '';
let favorites = loadFavorites();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = queryInput.value.trim();
  if (query === '') return;

  currentQuery = query;
  currentPage = 1;
  await fetchImages();
});

async function fetchImages() {
  const onlyFav = onlyFavoritesCheckbox.checked;

  if (!currentQuery && !onlyFav) {
    gallery.innerHTML = '<p>Zadejte hledaný výraz.</p>';
    return;
  }

  const url = `${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(currentQuery)}&image_type=photo&per_page=20&page=${currentPage}`;

  gallery.innerHTML = '<p>Načítání...</p>';
  pagination.classList.add('hidden');

  try {
    const response = await fetch(url);
    const data = await response.json();

    let images = data.hits;

    if (onlyFav) {
      images = images.filter(img => favorites.includes(img.id));
      totalPages = 1;
      currentPage = 1;
    } else {
      totalPages = Math.ceil(data.totalHits / 20);
    }

    showImages(images);
    updatePagination();
  } catch (error) {
    gallery.innerHTML = `<p>Chyba při načítání dat.</p>`;
    console.error(error);
  }
}

function showImages(images) {
  if (images.length === 0) {
    gallery.innerHTML = '<p>Žádné výsledky.</p>';
    return;
  }

  const onlyFav = onlyFavoritesCheckbox.checked;

  gallery.innerHTML = images.map(img => {
    const isFav = favorites.includes(img.id);
    return `
      <div class="image-card" data-image='${JSON.stringify(img)}'>
        <button class="favorite-btn" data-id="${img.id}">
          ${isFav ? '⭐' : '☆'}
        </button>
        <img src="${img.webformatURL}" alt="${img.tags}" />
        <p>Autor: ${img.user}</p>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.image-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('favorite-btn')) return;
      const imgData = JSON.parse(card.dataset.image);
      openModal(imgData);
    });
  });

  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      toggleFavorite(id);
      fetchImages();
    });
  });
}

function openModal(img) {
  modalImage.src = img.largeImageURL;
  modalImage.alt = img.tags;
  modalInfo.innerHTML = `
    <strong>Autor:</strong> ${img.user}<br/>
    <strong>Tagy:</strong> ${img.tags}<br/>
    <strong>Stažení:</strong> ${img.downloads}<br/>
    <strong>Lajků:</strong> ${img.likes}
  `;
  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
}

closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function updatePagination() {
  const onlyFav = onlyFavoritesCheckbox.checked;

  if (onlyFav || totalPages <= 1) {
    pagination.classList.add('hidden');
    return;
  }

  pagination.classList.remove('hidden');
  pageInfo.textContent = `Stránka ${currentPage} z ${totalPages}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

prevBtn.addEventListener('click', async () => {
  if (currentPage > 1) {
    currentPage--;
    await fetchImages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

nextBtn.addEventListener('click', async () => {
  if (currentPage < totalPages) {
    currentPage++;
    await fetchImages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

onlyFavoritesCheckbox.addEventListener('change', () => {
  fetchImages();
});

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  saveFavorites();
}

function loadFavorites() {
  return JSON.parse(localStorage.getItem('favorites')) || [];
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}