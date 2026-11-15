import { createSearchController } from './searchController.js';
import type { SearchState } from './searchController.js';
import type { Country } from './types.js';

/* ----- каркас страницы ----- */
const main = document.createElement('main');

const title = document.createElement('h1');
title.textContent = 'Country Search';

/* карточка "Поиск" */
const searchSection = document.createElement('section');

const searchTitle = document.createElement('h2');
searchTitle.textContent = 'Поиск';

const input = document.createElement('input');
input.placeholder = 'Название страны, например spain';
input.setAttribute('aria-label', 'Название страны');

searchSection.append(searchTitle, input);

/* карточка "Детали" (скрыта, пока не кликнули по стране) */
const detailsSection = document.createElement('section');
detailsSection.hidden = true;

/* карточка "Результаты" */
const resultsSection = document.createElement('section');
const resultsTitle = document.createElement('h2');
const resultsBody = document.createElement('div');
resultsSection.append(resultsTitle, resultsBody);

main.append(title, searchSection, detailsSection, resultsSection);
document.body.append(main);

/* ----- вспомогательная функция ----- */
function createText(text: string, className: string) {
  const paragraph = document.createElement('p');
  paragraph.className = className;
  paragraph.textContent = text;
  return paragraph;
}

/* ----- строка страны в списке ----- */
function createCountryItem(country: Country) {
  const item = document.createElement('li');
  item.className = 'country';
  item.tabIndex = 0;

  // flag - это либо URL картинки, либо эмодзи
  if (country.flag.startsWith('http')) {
    const flagImage = document.createElement('img');
    flagImage.src = country.flag;
    flagImage.alt = `Флаг: ${country.name}`;
    item.append(flagImage);
  } else if (country.flag !== '') {
    const flagEmoji = document.createElement('span');
    flagEmoji.className = 'flag-emoji';
    flagEmoji.textContent = country.flag;
    item.append(flagEmoji);
  }

  const name = document.createElement('h3');
  name.textContent = country.name;

  const info = document.createElement('p');
  info.textContent =
    `Столица: ${country.capital}, регион: ${country.region}, ` +
    `население: ${country.population.toLocaleString('ru-RU')}`;

  const text = document.createElement('div');
  text.append(name, info);
  item.append(text);

  item.addEventListener('click', () => showDetails(country));
  item.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      showDetails(country);
    }
  });

  return item;
}

/* ----- карточка с деталями ----- */
function showDetails(country: Country) {
  const detailsTitle = document.createElement('h2');
  detailsTitle.textContent = country.name;

  const description = createText(country.description, 'description');

  const list = document.createElement('ul');
  list.className = 'details-list';
  const rows = [
    `Площадь: ${country.area.toLocaleString('ru-RU')} км²`,
    `Границы (коды стран): ${country.borders.join(', ') || 'нет'}`,
    `Языки: ${country.languages.join(', ') || '-'}`,
    `Валюта: ${country.currencies.join(', ') || '-'}`,
  ];
  for (const row of rows) {
    const item = document.createElement('li');
    item.textContent = row;
    list.append(item);
  }

  const closeButton = document.createElement('button');
  closeButton.className = 'wide';
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', hideDetails);

  detailsSection.replaceChildren(detailsTitle, description, list, closeButton);
  detailsSection.hidden = false;
  detailsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideDetails() {
  detailsSection.hidden = true;
  detailsSection.replaceChildren();
}

/* ----- отрисовка состояний ----- */
function render(state: SearchState) {
  // при любом новом состоянии закрываем старые детали
  hideDetails();
  resultsTitle.textContent = 'Результаты';

  if (state.status === 'idle') {
    resultsBody.replaceChildren(
      createText('Введите название страны, чтобы начать поиск.', 'hint'),
    );
  } else if (state.status === 'loading') {
    resultsBody.replaceChildren(createText('Загрузка...', 'loader'));
  } else if (state.status === 'empty') {
    resultsBody.replaceChildren(
      createText('Ничего не найдено. Попробуйте другой запрос.', 'empty'),
    );
  } else if (state.status === 'error') {
    const retryButton = document.createElement('button');
    retryButton.className = 'wide';
    retryButton.textContent = 'Повторить';
    retryButton.addEventListener('click', () => controller.retry());

    resultsBody.replaceChildren(
      createText(state.message, 'error'),
      retryButton,
    );
  } else {
    resultsTitle.textContent = `Результаты (${state.countries.length})`;

    const list = document.createElement('ul');
    list.className = 'countries';
    for (const country of state.countries) {
      list.append(createCountryItem(country));
    }
    resultsBody.replaceChildren(list);
  }
}

/* ----- запуск ----- */
const controller = createSearchController(render);

input.addEventListener('input', () => controller.onInput(input.value));

/* первая отрисовка */
render({ status: 'idle' });
