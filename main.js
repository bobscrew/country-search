import { debounce, searchCountries, mapCountryResponse, handleFetchError } from './core.js';
const app = document.getElementById('app');
if (!app)
    throw new Error('App container not found');
let controller = null;
let lastQuery = '';
const input = document.createElement('input');
input.type = 'text';
input.placeholder = 'Search country...';
const status = document.createElement('div');
status.id = 'status';
const retryBtn = document.createElement('button');
retryBtn.id = 'retry-btn';
retryBtn.textContent = 'Retry';
const list = document.createElement('div');
list.id = 'list';
const detailView = document.createElement('div');
detailView.id = 'detail-view';
app.append(input, status, retryBtn, list, detailView);
const updateLayout = (hasResults) => {
    if (hasResults) {
        document.body.classList.remove('empty');
        document.body.classList.add('results');
    }
    else {
        document.body.classList.remove('results');
        document.body.classList.add('empty');
    }
};
const render = (countries) => {
    list.innerHTML = '';
    if (countries.length === 0) {
        updateLayout(false);
        return;
    }
    updateLayout(true);
    countries.forEach((c) => {
        const card = document.createElement('div');
        card.className = 'card';
        const img = document.createElement('img');
        img.src = c.flag;
        img.alt = c.name;
        const title = document.createElement('h3');
        title.textContent = c.name;
        const capital = document.createElement('p');
        capital.textContent = `Capital: ${c.capital}`;
        card.append(img, title, capital);
        card.addEventListener('click', () => {
            list.style.display = 'none';
            detailView.style.display = 'block';
            detailView.innerHTML = `
        <h2>${c.name}</h2>
        <p><strong>Region:</strong> ${c.region}</p>
        <p><strong>Population:</strong> ${c.population.toLocaleString()}</p>
        <p><strong>Area:</strong> ${c.area || 'N/A'} km²</p>
        <p><strong>Borders:</strong> ${c.borders?.join(', ') || 'None'}</p>
        <p><strong>Languages:</strong> ${c.languages.join(', ')}</p>
        <p><strong>Currency:</strong> ${c.currency || 'N/A'}</p>
        <button id="back-btn" style="margin-top:20px; padding:10px 20px; background:#8ab4f8; border:none; border-radius:4px; cursor:pointer;">Back to results</button>
      `;
            document.getElementById('back-btn')?.addEventListener('click', () => {
                detailView.style.display = 'none';
                list.style.display = 'grid';
            });
        });
        list.append(card);
    });
};
const doSearch = async (query) => {
    if (controller)
        controller.abort();
    controller = new AbortController();
    lastQuery = query;
    status.textContent = 'Loading...';
    retryBtn.style.display = 'none';
    detailView.style.display = 'none';
    list.style.display = 'grid';
    updateLayout(false);
    try {
        const timeoutSignal = AbortSignal.timeout(5000);
        const combinedSignal = AbortSignal.any([controller.signal, timeoutSignal]);
        const raw = await searchCountries(query, combinedSignal);
        const mapped = raw.map(mapCountryResponse);
        render(mapped);
        status.textContent = mapped.length === 0 ? 'No results found.' : '';
    }
    catch (error) {
        const type = handleFetchError(error);
        if (type === 'cancelled')
            return;
        status.textContent = type === 'timeout'
            ? 'Timeout error. Please try again.'
            : 'Error occurred. Please try again.';
        retryBtn.style.display = 'block';
        retryBtn.onclick = () => doSearch(lastQuery);
        updateLayout(false);
    }
};
const debouncedSearch = debounce((query) => {
    const q = query;
    if (!q.trim()) {
        list.innerHTML = '';
        status.textContent = '';
        detailView.style.display = 'none';
        if (controller)
            controller.abort();
        updateLayout(false);
        return;
    }
    doSearch(q);
}, 300);
input.addEventListener('input', (e) => {
    const target = e.target;
    debouncedSearch(target.value);
});
updateLayout(false);
