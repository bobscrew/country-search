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
retryBtn.textContent = 'Retry';
retryBtn.style.display = 'none';
const list = document.createElement('div');
list.id = 'list';
const detailView = document.createElement('div');
detailView.style.display = 'none';
app.append(input, status, retryBtn, list, detailView);
const render = (countries) => {
    list.innerHTML = '';
    countries.forEach((c) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';
        const img = document.createElement('img');
        img.src = c.flag;
        img.alt = c.name;
        img.width = 50;
        const title = document.createElement('h3');
        title.textContent = c.name;
        const capital = document.createElement('p');
        capital.textContent = `Capital: ${c.capital}`;
        card.append(img, title, capital);
        card.addEventListener('click', () => {
            detailView.innerHTML = `
        <h2>${c.name}</h2>
        <p>Region: ${c.region}</p>
        <p>Population: ${c.population}</p>
        <p>Area: ${c.area || 'N/A'} km²</p>
        <p>Borders: ${c.borders?.join(', ') || 'None'}</p>
        <p>Languages: ${c.languages.join(', ')}</p>
        <p>Currency: ${c.currency || 'N/A'}</p>
      `;
            detailView.style.display = 'block';
            list.style.display = 'none';
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
    try {
        const timeoutSignal = AbortSignal.timeout(5000);
        const combinedSignal = AbortSignal.any([controller.signal, timeoutSignal]);
        const raw = await searchCountries(query, combinedSignal);
        const mapped = raw.map(mapCountryResponse);
        render(mapped);
        status.textContent = mapped.length === 0 ? 'No results' : '';
    }
    catch (error) {
        const type = handleFetchError(error);
        if (type === 'cancelled')
            return;
        if (type === 'timeout') {
            status.textContent = 'Timeout error. Please try again.';
        }
        else {
            status.textContent = 'Error occurred. Please try again.';
        }
        retryBtn.style.display = 'block';
        retryBtn.onclick = () => doSearch(lastQuery);
    }
};
const debouncedSearch = debounce((query) => {
    const q = query;
    if (!q.trim()) {
        list.innerHTML = '';
        status.textContent = '';
        if (controller)
            controller.abort();
        return;
    }
    doSearch(q);
}, 300);
input.addEventListener('input', (e) => {
    const target = e.target;
    debouncedSearch(target.value);
});
