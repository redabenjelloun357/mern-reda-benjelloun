const API_URL = '/api/items';
const priceFormatter = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
});
const thumbThemes = [
    ['#7465df', '#f0efff'],
    ['#40a58b', '#e9f8f3'],
    ['#d09538', '#fff5e5'],
    ['#d46e84', '#fff0f3'],
    ['#4b8ebd', '#edf6fc'],
];

const elements = {
    list: document.querySelector('#items-list'),
    totalItems: document.querySelector('#total-items'),
    totalValue: document.querySelector('#total-value'),
    averagePrice: document.querySelector('#average-price'),
    navCount: document.querySelector('#nav-count'),
    visibleCount: document.querySelector('#visible-count'),
    resultsLabel: document.querySelector('#results-label'),
    search: document.querySelector('#search'),
    today: document.querySelector('#today'),
    dialog: document.querySelector('#item-dialog'),
    form: document.querySelector('#item-form'),
    name: document.querySelector('#item-name'),
    price: document.querySelector('#item-price'),
    formError: document.querySelector('#form-error'),
    submit: document.querySelector('#submit-form'),
    refresh: document.querySelector('#refresh'),
    toast: document.querySelector('#toast'),
};

let items = [];
let toastTimeout;

elements.today.textContent = dateFormatter.format(new Date());

function formatPrice(price) {
    return priceFormatter.format(price);
}

function showToast(message, isError = false) {
    window.clearTimeout(toastTimeout);
    elements.toast.textContent = message;
    elements.toast.classList.toggle('error', isError);
    elements.toast.classList.add('visible');
    toastTimeout = window.setTimeout(() => {
        elements.toast.classList.remove('visible');
    }, 3500);
}

function showEmptyState(title, description, actionLabel) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    const state = document.createElement('div');
    const heading = document.createElement('strong');
    const message = document.createElement('span');

    cell.colSpan = 3;
    cell.className = 'empty-cell';
    state.className = 'empty-state';
    heading.textContent = title;
    message.textContent = description;
    state.append(heading, message);

    if (actionLabel) {
        const action = document.createElement('button');
        action.type = 'button';
        action.textContent = actionLabel;
        action.addEventListener('click', openDialog);
        state.append(action);
    }

    cell.append(state);
    row.append(cell);
    elements.list.replaceChildren(row);
}

function renderItems() {
    const query = elements.search.value.trim().toLocaleLowerCase('fr');
    const visibleItems = items.filter((item) => item.name.toLocaleLowerCase('fr').includes(query));

    elements.visibleCount.textContent = String(visibleItems.length);
    elements.resultsLabel.textContent = `${visibleItems.length} article${visibleItems.length === 1 ? '' : 's'} affiché${visibleItems.length === 1 ? '' : 's'}`;

    if (visibleItems.length === 0) {
        if (items.length === 0) {
            showEmptyState('Votre catalogue est encore vide', 'Ajoutez votre premier article pour commencer.', 'Ajouter un article');
        } else {
            showEmptyState('Aucun résultat', 'Essayez avec un autre nom d’article.');
        }
        return;
    }

    const rows = visibleItems.map((item, index) => {
        const row = document.createElement('tr');
        const articleCell = document.createElement('td');
        const article = document.createElement('div');
        const thumb = document.createElement('span');
        const nameGroup = document.createElement('span');
        const name = document.createElement('span');
        const subtitle = document.createElement('span');
        const priceCell = document.createElement('td');
        const actionCell = document.createElement('td');
        const action = document.createElement('button');
        const theme = thumbThemes[index % thumbThemes.length];

        article.className = 'item-cell';
        thumb.className = 'item-thumb';
        thumb.style.setProperty('--thumb-color', theme[0]);
        thumb.style.setProperty('--thumb-bg', theme[1]);
        thumb.textContent = item.name.trim().charAt(0).toLocaleUpperCase('fr');

        nameGroup.className = 'item-name';
        name.textContent = item.name;
        subtitle.className = 'item-subtitle';
        subtitle.textContent = 'Article du catalogue';
        nameGroup.append(name, subtitle);
        article.append(thumb, nameGroup);
        articleCell.append(article);

        priceCell.textContent = formatPrice(item.price);
        action.className = 'row-action';
        action.type = 'button';
        action.setAttribute('aria-label', `Détails de ${item.name}`);
        action.title = `Article ${item.name}`;
        action.textContent = '···';
        action.addEventListener('click', () => showToast(`${item.name} · ${formatPrice(item.price)}`));
        actionCell.append(action);

        row.append(articleCell, priceCell, actionCell);
        return row;
    });

    elements.list.replaceChildren(...rows);
}

function renderSummary() {
    const total = items.reduce((sum, item) => sum + item.price, 0);
    const average = items.length ? total / items.length : 0;

    elements.totalItems.textContent = String(items.length);
    elements.navCount.textContent = String(items.length);
    elements.totalValue.textContent = formatPrice(total);
    elements.averagePrice.textContent = formatPrice(average);
    renderItems();
}

async function loadItems() {
    elements.refresh.disabled = true;
    try {
        const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
        if (!response.ok) {
            throw new Error(`Le serveur a répondu avec le statut ${response.status}.`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.some((item) =>
            typeof item.name !== 'string' || typeof item.price !== 'number' || !Number.isFinite(item.price)
        )) {
            throw new Error('La réponse du serveur ne contient pas une liste d’articles valide.');
        }

        items = data;
        renderSummary();
    } catch (error) {
        elements.totalItems.textContent = '—';
        elements.navCount.textContent = '—';
        elements.totalValue.textContent = '—';
        elements.averagePrice.textContent = '—';
        elements.visibleCount.textContent = '0';
        elements.resultsLabel.textContent = 'Impossible de charger les articles';
        showEmptyState('Connexion au serveur impossible', 'Vérifiez que le serveur API est démarré, puis actualisez.');
        showToast(error instanceof Error ? error.message : 'Une erreur inattendue est survenue.', true);
    } finally {
        elements.refresh.disabled = false;
    }
}

function openDialog() {
    elements.form.reset();
    elements.formError.hidden = true;
    elements.formError.textContent = '';
    elements.submit.disabled = false;
    elements.submit.textContent = 'Ajouter l’article';
    elements.dialog.showModal();
    elements.name.focus();
}

function closeDialog() {
    elements.dialog.close();
}

async function addItem(event) {
    event.preventDefault();
    elements.formError.hidden = true;

    const name = elements.name.value.trim();
    const price = Number(elements.price.value);
    if (!name || elements.price.value === '' || !Number.isFinite(price) || price < 0) {
        elements.formError.textContent = 'Saisissez un nom et un prix valide (supérieur ou égal à 0).';
        elements.formError.hidden = false;
        return;
    }

    elements.submit.disabled = true;
    elements.submit.textContent = 'Ajout en cours…';
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ name, price }),
        });
        if (!response.ok) {
            const responseBody = await response.json().catch(() => null);
            throw new Error(responseBody?.error || `Impossible d’ajouter l’article (statut ${response.status}).`);
        }

        closeDialog();
        await loadItems();
        showToast('Article ajouté au catalogue.');
    } catch (error) {
        elements.formError.textContent = error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
        elements.formError.hidden = false;
    } finally {
        elements.submit.disabled = false;
        elements.submit.textContent = 'Ajouter l’article';
    }
}

document.querySelector('#open-form').addEventListener('click', openDialog);
document.querySelector('#close-form').addEventListener('click', closeDialog);
document.querySelector('#cancel-form').addEventListener('click', closeDialog);
elements.form.addEventListener('submit', addItem);
elements.search.addEventListener('input', renderItems);
elements.refresh.addEventListener('click', loadItems);
elements.dialog.addEventListener('click', (event) => {
    if (event.target === elements.dialog) closeDialog();
});
document.addEventListener('keydown', (event) => {
    if (event.key === '/' && document.activeElement !== elements.search && !elements.dialog.open) {
        event.preventDefault();
        elements.search.focus();
    }
});

loadItems();