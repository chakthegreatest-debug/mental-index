/* Multi-select demographic slices in the combined tables. */
(() => {
  const root = document.getElementById('screen-analytics');
  if (!root) return;
  const chips = root.querySelector('.slice-chips');
  const buttons = [...chips.querySelectorAll('[data-slice]')];
  const choices = buttons.filter(b => b.dataset.slice !== 'all');
  const selected = new Set();
  let allSelected = true;
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  const keys = new Map(choices.map(b => [normalize(b.textContent), b.dataset.slice]));
  const combined = root.querySelector('#slice-all');
  const collapsed = new WeakMap();
  combined.querySelectorAll('tbody').forEach(body => {
    let key = '';
    [...body.rows].forEach(row => {
      const heading = row.querySelector('.analytics-subhead');
      if (heading) key = keys.get(normalize(heading.textContent)) || '';
      if (key) row.dataset.sliceGroup = key;
    });
  });
  combined.querySelectorAll('.analytics-subhead').forEach(heading => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slice-group-toggle';
    button.textContent = heading.textContent;
    heading.replaceChildren(button);
    button.addEventListener('click', () => {
      const body = heading.closest('tbody');
      const groups = collapsed.get(body) || new Set();
      const key = heading.parentElement.dataset.sliceGroup;
      if (groups.has(key)) groups.delete(key); else groups.add(key);
      collapsed.set(body, groups);
      render();
    });
  });
  const columnObserver = new ResizeObserver(entries => {
    entries.forEach(({ target }) => {
      const width = target.getBoundingClientRect().width;
      if (width) target.closest('table').style.setProperty('--group-column-width', `${width}px`);
    });
  });
  combined.querySelectorAll('table thead th:first-child[colspan="2"]').forEach(header => columnObserver.observe(header));
  const status = document.createElement('p');
  status.className = 'slice-selection-status';
  status.setAttribute('role', 'status');
  chips.after(status);
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', 'Выберите срезы для сравнения');
  function render() {
    buttons.forEach(button => {
      const on = button.dataset.slice === 'all'
        ? allSelected
        : !allSelected && selected.has(button.dataset.slice);
      button.classList.toggle('active-slice', on);
      button.classList.toggle('active', on);
      button.setAttribute('aria-pressed', String(on));
      button.style.removeProperty('background');
      button.style.removeProperty('color');
    });
    root.querySelectorAll('.slice-panel').forEach(panel => {
      panel.style.display = panel === combined && (allSelected || selected.size) ? 'block' : 'none';
    });
    combined.querySelectorAll('[data-slice-group]').forEach(row => {
      const closed = collapsed.get(row.closest('tbody'))?.has(row.dataset.sliceGroup);
      const toggle = row.querySelector('.slice-group-toggle');
      if (toggle) {
        toggle.disabled = false;
        toggle.setAttribute('aria-expanded', String(!closed));
      }
      row.hidden = !(allSelected || selected.has(row.dataset.sliceGroup)) || Boolean(closed && !toggle);
    });
    const comparison = 'Выберите один или несколько параметров, например возраст и характер занятости. Чтобы увидеть все группы, нажмите «Выбрать все».';
    status.textContent = !allSelected && selected.size
      ? `Выбрано срезов: ${selected.size} из ${choices.length}. Выберите ещё один или несколько параметров, например возраст и характер занятости. Чтобы увидеть все группы, нажмите «Выбрать все».`
      : comparison;
    root.dispatchEvent(new Event('slice-selection-change'));
  }
  chips.addEventListener('click', event => {
    const button = event.target.closest('[data-slice]');
    if (!button) return;
    const key = button.dataset.slice;
    if (key === 'all') {
      allSelected = !allSelected;
      selected.clear();
    } else {
      if (allSelected) { allSelected = false; selected.clear(); }
      if (selected.has(key)) selected.delete(key);
      else selected.add(key);
      if (selected.size === choices.length) { allSelected = true; selected.clear(); }
    }
    render();
  });
  window.updateSliceSelection = render;
  render();
})();

/* Keep both chart representations visible in each view selector. */
(() => {
  document.querySelectorAll('.chart-toggle[aria-controls]:not([data-expand])').forEach(controller => {
    const alternate = document.getElementById(controller.getAttribute('aria-controls'));
    const chart = alternate && alternate.closest('.chart-switch');
    if (!chart) return;
    if (chart.querySelector('.index-scale-chart')) {
      const bar = controller.closest('.chart-bar');
      if (bar) bar.remove(); else controller.remove();
      return;
    }
    const group = document.createElement('div');
    group.className = 'chart-view-switch';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Представление данных');
    const options = ['График', 'Таблица'].map((label, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chart-view-option';
      button.textContent = label;
      button.setAttribute('aria-controls', alternate.id);
      button.addEventListener('click', () => {
        if (chart.classList.contains('is-alt') !== Boolean(index)) controller.click();
        sync();
      });
      group.append(button);
      return button;
    });
    function sync() {
      options.forEach((button, index) => button.setAttribute('aria-pressed', String(chart.classList.contains('is-alt') === Boolean(index))));
    }
    controller.before(group);
    controller.classList.add('chart-toggle-controller');
    controller.tabIndex = -1;
    controller.setAttribute('aria-hidden', 'true');
    sync();
  });
})();

(() => {
  const section = document.querySelector('section[aria-labelledby="section-skills-title"]');
  if (!section) return;
  const legend = section.querySelector('.chart-tools .legend');
  const chart = section.querySelector('.chart-switch[data-switch="skills"]');
  if (legend && chart) {
    legend.classList.add('skills-color-legend');
    chart.after(legend);
    const syncLegend = () => { legend.hidden = chart.classList.contains('is-alt'); };
    new MutationObserver(syncLegend).observe(chart, { attributes: true, attributeFilter: ['class'] });
    syncLegend();
  }
})();

/* Place explanations next to the data they describe. */
(() => {
  const analytics = document.getElementById('screen-analytics');
  const source = document.getElementById('slices-legend');
  const colorKey = source && source.querySelector('.analytics-legend');
  analytics.querySelectorAll('.analytics-card').forEach(card => {
    const tables = [...card.querySelectorAll('table')];
    const scale = card.querySelector('.analytics-scale');
    tables.forEach((table, index) => {
      const wrapper = table.parentElement;
      const footer = document.createElement('div');
      footer.className = 'analytics-table-footer';
      if (index === 0 && scale) footer.append(scale);
      if ((index === 1 || index === 2) && colorKey) {
        const key = document.createElement('div');
        key.className = 'legend';
        [...colorKey.querySelectorAll('.legend-item:not(.legend-note)')].forEach(item => key.append(item.cloneNode(true)));
        footer.append(key);
      }
      const note = document.createElement('p');
      note.className = 'analytics-table-note';
      const common = 'Все результаты взвешены. Для групп меньше 10 человек значения ориентировочные; для групп меньше 5 человек значения не показаны.';
      const explanations = [
        'Срез — результаты части опрошенных, например одного пола или возраста. Цвет ячейки соответствует значению Индекса по шкале выше. ',
        'Цвет ячейки — по сравнению с другими группами в том же столбце. Для «Справляются и остаются» благоприятнее большее значение, для остальных секторов — меньшее. ',
        'Цвет ячейки — по сравнению с другими группами в том же столбце. Для «К психологу» и «Работодатель: достаточно» благоприятнее большее значение, для остальных показателей — меньшее. ',
        'Показана доля группы с низким уровнем навыка. '
      ];
      note.textContent = (explanations[index] || '') + common;
      footer.append(note);
      wrapper.after(footer);
      let above = wrapper.previousElementSibling;
      if (above && above.matches('.analytics-table-note')) {
        above.textContent = above.textContent.replace('шкала справа от заголовка', 'шкала под таблицей');
      }
      table.querySelectorAll('tbody td:first-child').forEach(cell => {
        if (cell.textContent.trim() === '·') cell.textContent = '';
      });
    });
  });
  analytics.querySelector('.analytics-head')?.remove();
  document.querySelectorAll('.chart-toggle-controller').forEach(controller => {
    const alternate = document.getElementById(controller.getAttribute('aria-controls'));
    const chart = alternate?.closest('.chart-switch');
    if (!chart || chart.dataset.switch === 'skills') return;
    const block = controller.closest('.metric-block');
    const legend = controller.parentElement.querySelector('.legend') || block?.querySelector('.legend');
    if (!legend || chart.contains(legend)) return;
    legend.classList.add('chart-bottom-legend');
    chart.after(legend);
    const sync = () => { legend.hidden = chart.classList.contains('is-alt'); };
    new MutationObserver(sync).observe(chart, { attributes: true, attributeFilter: ['class'] });
    sync();
  });
})();

(() => {
  document.querySelectorAll('.likert > .legend').forEach(legend => {
    const chart = legend.closest('.chart-switch');
    if (!chart) return;
    legend.classList.remove('likert__legend');
    legend.classList.add('chart-bottom-legend');
    chart.after(legend);
    const sync = () => { legend.hidden = chart.classList.contains('is-alt'); };
    new MutationObserver(sync).observe(chart, { attributes: true, attributeFilter: ['class'] });
    sync();
  });
  document.querySelectorAll('.analytics-table-note').forEach(note => {
    note.textContent = note.textContent.replace(/шкала\s+справа\s+от\s+заголовка/g, 'шкала под таблицей');
  });
})();

(() => {
  document.querySelectorAll('.slice-skills-table').forEach(table => {
    const wrapper = table.parentElement;
    const above = wrapper.previousElementSibling;
    if (above?.matches('.analytics-table-note')) {
      above.textContent = 'Доля группы с низким уровнем навыка (оценка 0–4), %.';
    }
    const footer = wrapper.nextElementSibling;
    if (footer?.matches('.analytics-table-footer')) {
      const legend = document.createElement('div');
      legend.className = 'legend skills-threshold-legend';
      [['#BACFA2', 'меньше 10%'], ['#FFF4D4', 'от 10% до 20%'], ['#F7A6A2', '20% и выше']].forEach(([color, text]) => {
        const item = document.createElement('span');
        item.className = 'legend-item';
        const dot = document.createElement('span');
        dot.className = 'legend-dot';
        dot.style.background = color;
        item.append(dot, document.createTextNode(text));
        legend.append(item);
      });
      footer.prepend(legend);
    }
  });
  document.querySelectorAll('.analytics-card tbody tr').forEach(row => {
    const first = row.cells[0];
    if (first && !first.textContent.trim() && row.cells.length > 1) {
      const next = row.cells[1];
      first.classList.add('analytics-spacer-cell');
      next.style.paddingLeft = '10px';
    }
  });
  document.querySelectorAll('.db.db--zones').forEach(graph => {
    const chart = graph.closest('.chart-switch');
    const note = graph.querySelector('.db__note');
    const legend = chart?.nextElementSibling;
    if (!chart || !note || !legend?.matches('.chart-bottom-legend')) return;
    const items = [...note.querySelectorAll('.legend-item')];
    const merged = document.createElement('div');
    merged.className = 'legend compact-index-legend';
    ['Низкое ≤19', 'Среднее 20–45', 'Высокое >45'].forEach((label, index) => {
      const item = document.createElement('span');
      item.className = 'legend-item';
      const dot = document.createElement('span');
      dot.className = 'legend-dot';
      dot.style.background = ['var(--red)', 'var(--yel)', 'var(--grn)'][index];
      item.append(dot, document.createTextNode(label));
      merged.append(item);
    });
    const caveat = note.querySelector('.db__note-text');
    legend.replaceChildren(merged);
    if (caveat) {
      const text = document.createElement('p');
      text.className = 'compact-index-caveat';
      text.textContent = caveat.textContent;
      legend.append(text);
    }
    note.remove();
  });
})();

(() => {
  document.querySelectorAll('.analytics-card table').forEach(table => {
    const wrapper = table.parentElement;
    const note = wrapper.previousElementSibling;
    const footer = wrapper.nextElementSibling;
    if (note?.matches('.analytics-table-note') && footer?.matches('.analytics-table-footer')) {
      const explanation = footer.querySelector('.analytics-table-note');
      if (explanation) explanation.textContent = note.textContent.trim() + ' ' + explanation.textContent;
      else footer.append(note.cloneNode(true));
      note.remove();
    }
    const total = table.tBodies[0]?.rows[0];
    if (total) total.classList.add('analytics-total-row');
    const indexHeader = [...(table.tHead?.rows[0]?.cells || [])].find(th => th.textContent.replace(/\s+/g, ' ').trim().toLowerCase() === 'индекс');
    indexHeader?.querySelector('.th-sort')?.click();
  });
})();

(() => {
  document.querySelectorAll('.chart-switch').forEach(chart => {
    const graph = chart.querySelector('.db, .likert, .sk');
    const table = chart.querySelector('.chart-table');
    if (!graph || !table) return;
    const labels = [...graph.querySelectorAll('.db__label, .likert__label, .sk__label')];
    [...table.tBodies[0].rows].forEach((row, index) => {
      const label = row.querySelector('th');
      if (!label) return;
      if (labels[index]) label.textContent = labels[index].textContent;
      label.removeAttribute('data-tip');
      label.removeAttribute('title');
    });
  });
  document.querySelectorAll('.db').forEach(graph => {
    graph.classList.add('index-band-chart');
    graph.querySelectorAll('.db__hint').forEach(hint => hint.remove());
  });
})();

/* Sector subgroups use the same card hierarchy as the overview. */
(() => {
  function subgroupCard(source, level) {
    const card = document.createElement('article');
    card.className = 'risk-intent-card sector-subgroup-card';
    const head = document.createElement('div');
    head.className = 'risk-intent-head';
    const copy = document.createElement('div');
    copy.className = 'risk-intent-heading';
    const name = document.createElement('h4');
    name.className = 'risk-intent-name';
    name.textContent = source.querySelector('.seg-name').textContent;
    const count = document.createElement('div');
    count.className = 'risk-intent-count';
    count.textContent = source.querySelector('.seg-n').textContent;
    copy.append(name, count);
    const stat = document.createElement('div');
    stat.className = 'risk-intent-stat';
    const percent = document.createElement('div');
    percent.className = 'risk-intent-percent';
    const ring = source.querySelector('.seg-donut').cloneNode(true);
    ring.classList.add('sector-subgroup-donut');
    ring.style.setProperty('--c', source.classList.contains('seg-green') ? 'var(--grn)' : source.classList.contains('seg-red') ? 'var(--red)' : source.classList.contains('seg-yellow') ? 'var(--yel)' : '#98A0AE');
    percent.append(ring, document.createTextNode(source.querySelector('.seg-pct').textContent));
    stat.append(percent);
    head.append(copy, stat);
    card.append(head);
    if (level) {
      const value = document.createElement('p');
      value.className = 'risk-intent-level';
      value.textContent = level;
      card.append(value);
    }
    const description = document.createElement('p');
    description.className = 'risk-intent-description';
    description.textContent = source.querySelector('.seg-desc').textContent;
    card.append(description);
    return card;
  }
  document.querySelectorAll('.risk-axis-grid--static').forEach(matrix => {
    const labels = [...matrix.querySelectorAll('.risk-axis-column-label')].map(e => e.textContent);
    const cards = [...matrix.querySelectorAll('.seg-card')];
    const layout = document.createElement('div');
    layout.className = 'sector-subgroups';
    labels.forEach((label, column) => {
      const group = document.createElement('section');
      group.className = 'risk-intent-group';
      const title = document.createElement('h3');
      title.className = 'risk-intent-title';
      title.textContent = label;
      const grid = document.createElement('div');
      grid.className = 'risk-intent-cards';
      cards.forEach((card, index) => {
        if (index % labels.length === column) grid.append(subgroupCard(card, index < labels.length ? 'В ресурсе' : 'В хрупком равновесии'));
      });
      group.append(title, grid);
      layout.append(group);
    });
    const intro = matrix.previousElementSibling;
    if (intro?.matches('.section-intro')) {
      intro.querySelector('.section-eyebrow').textContent = 'Группы сектора';
      intro.querySelector('.subsection-title').textContent = 'Индекс ментального благополучия и удовлетворённость работой';
    }
    matrix.replaceWith(layout);
  });
  document.querySelectorAll('.sd-wrap .seg-card--static').forEach(source => {
    const parent = source.parentElement;
    parent.classList.add('sector-subgroup-grid');
    parent.removeAttribute('style');
    source.replaceWith(subgroupCard(source, source.dataset.subgroupLabel));
  });
})();

/* Index bands have one presentation; retain only their zero reference. */
(() => {
  document.querySelectorAll('.index-band-chart').forEach(graph => {
    const chart = graph.closest('.chart-switch');
    chart.classList.remove('is-alt');
    const table = chart.querySelector('[id^="chart-alt-"]');
    if (table?.id) {
      document.querySelectorAll('[aria-controls="' + table.id + '"]').forEach(control => {
        const group = control.closest('.chart-view-switch');
        const host = (group || control).parentElement;
        (group || control).remove();
        if (host?.matches('.chart-tools, .chart-bar') && !host.children.length) host.remove();
      });
    }
    graph.querySelectorAll('.db__track').forEach(track => {
      const zero = document.createElement('span');
      zero.className = 'index-band-zero';
      zero.textContent = '0';
      zero.setAttribute('aria-hidden', 'true');
      track.append(zero);
    });
  });
})();

/* Component notation and independent recommendations. */
(() => {
  document.querySelectorAll('.structure-component-card .sc-val, .structure-component-card .sc-sub-row > :last-child').forEach(value => {
    const text = value.textContent.trim();
    if (/^\d+[,.]\d+$/.test(text)) value.textContent = '+' + text;
  });
  const targets = document.querySelectorAll('.sc-label, .db__label, .metric-block__title, .chart-table tbody th, .analytics-card thead th');
  targets.forEach(target => {
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const match = node.textContent.match(/^\s*([АБВABV](?:[1-3])?)\s*(?:·\s*|(?=$))/);
      if (!match) continue;
      const code = document.createElement(match[1].length > 1 ? 'strong' : 'span');
      code.className = match[1].length > 1 ? 'subindex-code' : 'component-code';
      code.textContent = match[1];
      node.replaceWith(code, document.createTextNode(' ' + node.textContent.slice(match[0].length)));
      break;
    }
  });
  document.querySelectorAll('.structure-component-card .sc-sub-row > span:first-child').forEach(label => {
    const match = label.textContent.trim().match(/^([АБВABV][1-3])\s*·?\s*(.*)$/);
    if (!match) return;
    const code = document.createElement('strong');
    code.className = 'subindex-code';
    code.textContent = match[1];
    const name = document.createElement('span');
    name.className = 'subindex-label';
    name.textContent = match[2];
    label.replaceChildren(code, name);
  });
  document.querySelectorAll('.subpage .dashboard-section > .insight-card, .sd-wrap .dashboard-section > .insight-card').forEach(insight => {
    const section = insight.parentElement;
    const standalone = document.createElement('section');
    standalone.className = 'dashboard-section standalone-insight';
    standalone.append(...insight.childNodes);
    section.after(standalone);
    insight.remove();
  });
})();

/* Editorial and navigation refinement across V3. */
(() => {
  document.querySelectorAll('.scale-zone, .compact-index-legend .legend-item').forEach(label => {
    const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      node.textContent = node.textContent.replace(/Низкое/g, 'Низкий').replace(/Среднее/g, 'Средний').replace(/Высокое/g, 'Высокий');
    }
  });
  document.querySelectorAll('.structure-component-description').forEach(e => e.textContent = e.textContent.trim().replace(/\.$/, ''));
  document.querySelectorAll('.metric-block__title .subindex-code').forEach(e => { e.classList.remove('subindex-code'); e.classList.add('component-code'); });
  document.querySelectorAll('table .component-code, table .subindex-code').forEach(e => e.replaceWith(document.createTextNode(e.textContent)));
  document.querySelectorAll('.index-band-chart .db__track').forEach(track => {
    ['−100', '+100'].forEach((text, index) => {
      const edge = document.createElement('span');
      edge.className = 'index-band-zero index-band-edge ' + (index ? 'index-band-edge--end' : 'index-band-edge--start');
      edge.textContent = text;
      edge.setAttribute('aria-hidden', 'true');
      track.append(edge);
    });
    const number = Number(track.querySelector('.db__val').textContent.replace('−', '-').replace(',', '.'));
    const tip = (number <= 19 ? 'Низкий' : number <= 45 ? 'Средний' : 'Высокий') + ' индекс';
    track.querySelectorAll('[data-tip]').forEach(e => e.dataset.tip = tip);
  });
  document.querySelectorAll('.metric-note').forEach(note => {
    if (note.closest('#screen-subA, #screen-subB, #screen-subV')) return;
    const first = note.textContent.split('. ')[0];
    note.textContent = first + '. Позитивный ответ говорит о благополучии, негативный — о трудностях.';
  });
  document.querySelectorAll('.sector-subgroups').forEach(group => {
    if (group.previousElementSibling?.matches('.section-intro')) group.previousElementSibling.remove();
  });
  document.querySelectorAll('.sd-wrap .chart-caveat').forEach(e => e.remove());
  document.querySelectorAll('.standalone-insight .ins-list > li').forEach(li => {
    const first = li.firstElementChild;
    if (first?.matches('strong, b')) first.classList.add('recommendation-title');
    else if (first?.matches('p') && first.firstElementChild?.matches('strong, b')) first.firstElementChild.classList.add('recommendation-title');
  });
  const footers = [
    'Индекс показывает ментальное благополучие группы в целом. Показатели А, Б и В помогают увидеть, какие стороны состояния и жизни оцениваются выше или ниже. Цвет ячейки соответствует значению Индекса. Все результаты взвешены. Для групп меньше 10 человек значения ориентировочные; для групп меньше 5 человек значения не показаны. Сортировка доступна только по столбцу «Индекс».',
    'Какая доля группы попала в каждый сектор карты, %. Цвет ячейки — по сравнению с другими группами в том же столбце. Для «Справляются и остаются» благоприятнее большее значение, для остальных секторов — меньшее. Все результаты взвешены. Для групп меньше 10 человек значения ориентировочные; для групп меньше 5 человек значения не показаны.',
    'Доли группы, %: за последние 12 месяцев обращались к психологу, принимали успокоительные; считают усилия работодателя достаточными или недостаточными. Цвет ячейки — по сравнению с другими группами в том же столбце. Для «Психолог» и «Работодатель: достаточно» благоприятнее большее значение, для остальных показателей — меньшее. Все результаты взвешены. Для групп меньше 10 человек значения ориентировочные; для групп меньше 5 человек значения не показаны.',
    'Таблица показывает долю участников каждой группы, оценивших навык на 0–4 балла. Чем выше процент, тем чаще навык получал низкую оценку. Все результаты взвешены. Для групп меньше 10 человек значения ориентировочные; для групп меньше 5 человек значения не показаны.'
  ];
  document.querySelectorAll('.slice-panel').forEach(panel => {
    panel.querySelectorAll('.analytics-table-footer .analytics-table-note').forEach((note,index) => { if (footers[index]) note.textContent = footers[index]; });
    panel.querySelectorAll('.analytics-table-title, .analytics-table-divider').forEach((title,index) => {
      let head = title.matches('.analytics-table-divider') ? title : title.parentElement;
      if (head === title) head.classList.add('analytics-table-head');
      if (!head.matches('.analytics-table-head')) {
        head = document.createElement('div');
        head.className = 'analytics-table-head';
        title.before(head);
        head.append(title);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'section-detail-link';
      button.textContent = 'Подробнее о разделе →';
      button.addEventListener('click', () => {
        go('home');
        requestAnimationFrame(() => {
          const sections = document.querySelectorAll('#screen-home .home > .dashboard-section');
          sections[[1,2,3,4][index]]?.scrollIntoView({behavior:'instant', block:'start'});
        });
      });
      head.append(button);
    });
  });
  document.querySelectorAll('.analytics-card thead .th-sort').forEach(e => {
    if (e.textContent.replace(/\s+/g, ' ').trim().toLowerCase() === 'к психологу') e.textContent = 'Психолог';
  });
})();

/* Keep fixed index bands in the same red–yellow–green gamut as the risk map. */
(() => {
  const bands = ['#F7A6A2', '#F9B6AC', '#FAC5B6', '#FDDEBF', '#FFF4D4', '#BACFA2'];
  document.querySelectorAll('#screen-analytics .analytics-card').forEach(card => {
    const table = card.querySelector('table');
    if (!table) return;
    const firstValue = table.tHead.rows[0].cells[0].colSpan || 1;
    [...table.tBodies[0].rows].slice(1).forEach(row => {
      if (row.querySelector('.analytics-subhead')) return;
      [...row.cells].slice(firstValue).forEach(cell => {
        const value = parseFloat(cell.textContent.trim().replace('−', '-').replace(',', '.'));
        if (!Number.isFinite(value)) return;
        const band = value < 0 ? 0 : value < 10 ? 1 : value < 20 ? 2 : value < 33 ? 3 : value <= 45 ? 4 : 5;
        cell.style.background = bands[band];
      });
    });
    card.querySelectorAll('.analytics-scale .legend-dot').forEach((dot, index) => {
      if (bands[index]) dot.style.background = bands[index];
    });
  });
})();

/* Complete chart motion without changing values or geometry. */
(() => {
  document.querySelectorAll('.sd-wrap .section-eyebrow').forEach(e => {
    if (e.textContent.trim() === 'Подгруппы сектора') e.remove();
  });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const easing = 'cubic-bezier(.2,.7,.3,1)';
  const svgNS = 'http://www.w3.org/2000/svg';
  document.querySelectorAll('.seg-donut, .risk-status-donut').forEach(ring => {
    const percent = Math.max(0, Math.min(100, parseFloat(ring.style.getPropertyValue('--p') || getComputedStyle(ring).getPropertyValue('--p')) || 0));
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    ['#DCE3F1', 'var(--c, #98A0AE)'].forEach((color, index) => {
      const circle = document.createElementNS(svgNS, 'circle');
      for (const [key, value] of Object.entries({cx:12, cy:12, r:10, fill:'none', stroke:color, 'stroke-width':3.5, pathLength:100})) circle.setAttribute(key, value);
      if (index) {
        circle.classList.add('v3-ring-fill');
        circle.setAttribute('stroke-dasharray', '100 100');
        circle.setAttribute('stroke-dashoffset', 100 - percent);
        circle.setAttribute('transform', 'rotate(-90 12 12)');
      }
      svg.append(circle);
    });
    ring.classList.add('v3-ring');
    ring.replaceChildren(svg);
  });
  const targets = document.querySelectorAll('.v3-ring, .waffle, .index-scale-chart, .index-band-chart, .stack');
  function play(target) {
    if (reduce.matches) return;
    target.dataset.motionPlayed = 'true';
    const timing = {duration:1000, easing, fill:'both'};
    if (target.matches('.v3-ring')) {
      const fill = target.querySelector('.v3-ring-fill');
      const animation = fill.animate([{strokeDashoffset:'100'}, {strokeDashoffset:fill.getAttribute('stroke-dashoffset')}], timing);
      target.classList.remove('motion-pending');
      animation.onfinish = () => animation.cancel();
    } else if (target.matches('.waffle')) {
      target.querySelectorAll('i.on').forEach((dot, i) => { const animation = dot.animate([{opacity:.12, transform:'scale(.65)'},{opacity:1, transform:'scale(1)'}], {duration:450,delay:i * 18,easing,fill:'both'}); animation.onfinish = () => animation.cancel(); });
      target.classList.remove('motion-pending');
    } else if (target.matches('.index-band-chart')) {
      target.classList.add('v3-motion-playing');
      target.querySelectorAll('.db__dot, .db__val').forEach(e => e.animate([{opacity:0},{opacity:1}], timing));
    } else if (target.matches('.index-scale-chart')) {
      target.querySelectorAll('.scale-bar, .scale-marker, .scale-value-label').forEach(e => e.animate([{opacity:.15},{opacity:1}], timing));
    } else if (target.matches('.stack')) {
      target.classList.add('is-drawn');
    }
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    play(entry.target);
    observer.unobserve(entry.target);
  }), {threshold:0, rootMargin:'0px 0px -10% 0px'}) : null;
  targets.forEach(e => {
    if (!reduce.matches && observer && e.matches('.v3-ring, .waffle')) e.classList.add('motion-pending');
    if (observer) observer.observe(e); else play(e);
  });
  reduce.addEventListener('change', () => {
    if (reduce.matches) targets.forEach(e => {
      e.getAnimations({subtree:true}).forEach(a => a.finish());
      e.classList.remove('motion-pending', 'v3-motion-playing');
      if (e.matches('.stack')) e.classList.add('is-drawn');
    });
  });
})();

/* Mobile answer charts fill the available width as a single 100% band. */
(() => {
  document.querySelectorAll('.likert__track').forEach(track => {
    const segments = [...track.querySelectorAll('.likert__seg')];
    const widths = segments.map(e => parseFloat(e.style.width) || 0);
    const total = widths.reduce((a,b) => a+b, 0);
    let start = 0;
    segments.forEach((segment,index) => {
      const width = total ? widths[index] / total * 100 : 0;
      segment.style.setProperty('--mobile-left', start + '%');
      segment.style.setProperty('--mobile-width', width + '%');
      segment.classList.toggle('mobile-small-segment', width < 8);
      start += width;
    });
  });
  document.querySelectorAll('.chart-table').forEach(table => {
    const labels = [...table.querySelectorAll('thead th')].map(e => e.textContent.trim());
    table.querySelectorAll('tbody tr').forEach(row => {
      [...row.cells].forEach((cell,index) => {
        if (cell.tagName === 'TD') cell.dataset.mobileLabel = labels[index] || '';
      });
    });
  });
})();

/* V6: table-specific source conclusions; absent evidence is never inferred.
 * Source: slice_insights.json, supplied for this revision.
 * Men/sedatives: use the previously approved table value 17%, not source 18%.
 * DFO-specific comparison is intentionally excluded.
 */
(() => {
  const root = document.getElementById('screen-analytics');
  const combined = root?.querySelector('#slice-all');
  if (!combined) return;
  const facts = {
  "gender": [
    "Близкий общий индекс скрывает различие в состоянии: у женщин индекс 32,1 против 34,9 у мужчин, а компонент «Состояние» — 31,5 против 39,9. При обсуждении нагрузки полезно смотреть на компоненты, а не только на итоговый индекс.",
    "В секторе «Тяжело, но остаются» — 25% женщин и 19% мужчин. В секторе «Справляются, но могут уйти» — 4% и 11%. Удержание и поддержка состояния требуют разных вопросов: намерение остаться не означает отсутствия трудностей.",
    "К психологу обращались 13% женщин и 6% мужчин; успокоительные принимали 27% и 17%. Различия в обращении за помощью сами по себе не показывают потребность: стоит отдельно проверять доступность поддержки.",
    "Низкие оценки критического мышления встречаются у 20% женщин и 10% мужчин, управления эмоциями — у 14% и 8%. Это самооценки навыков, а не оценка способностей сотрудников; они помогают выбрать темы добровольных программ развития."
  ],
  "age": [
    "Индекс у участников 18–35 лет — 28,7, у участников старше 50 лет — 36,1. Особенно различается компонент «Состояние»: 21,2 против 45,0. Молодым участникам стоит адресовать вопросы о нагрузке и восстановлении, не объясняя различия одним возрастом.",
    "В секторе «Тяжело, могут уйти» — 14% участников 18–35 лет и 5% старше 50 лет; «Справляются и остаются» — 56% и 66%. Это повод совместно изучать трудности и планы сотрудников, а не считать возраст прогнозом увольнения.",
    "К психологу обращались 17% участников 18–35 лет и 3% старше 50 лет; успокоительные принимали 32% и 12%. Более редкое обращение у старших не доказывает меньшую потребность в поддержке.",
    "Заботу о теле низко оценили 27% участников 18–35 лет и 19% старше 50 лет. Для критического мышления соотношение обратное: 11% и 18%. Единой возрастной группы с трудностями по всем навыкам нет; темы развития стоит выбирать отдельно."
  ],
  "employment": [
    "У совмещающих учёбу и работу индекс — 28,2 против 33,3 у работающих; компонент «Состояние» — 13,5 против 35,7. Стоит изучить сочетание учебной и рабочей нагрузки. В первой группе 48 человек, поэтому вывод требует осторожности.",
    "В секторе «Тяжело, могут уйти» — 15% совмещающих учёбу и работу против 8% работающих и 8% работающих пенсионеров. Это сигнал для уточняющих вопросов о нагрузке, не доказательство повышенного риска для каждого сотрудника; совмещающих учёбу и работу всего 48.",
    "К психологу обращались 29% совмещающих учёбу и работу, 9% работающих и 2% работающих пенсионеров. Разные уровни обращений не объясняют, какие барьеры есть у групп; это нужно проверять отдельно. В первой группе 48 участников.",
    "У работающих чаще всего низко оценена забота о теле — 25%. У работающих пенсионеров на первом месте забота о теле и вера в себя — по 21%; у совмещающих учёбу и работу — адаптивность и вера в себя, по 18%. Это разные темы для добровольного развития, а не единый профиль занятости; в последней группе 48 человек."
  ],
  "education": [
    "Индекс у участников с высшим образованием — 28,6, со средним специальным — 37,1. Различаются и состояние — 27,3 против 42,0, и внутренние ресурсы — 37,5 против 46,3. Уровень образования сам по себе не заменяет оценку условий работы; остальные, малые образовательные группы здесь не интерпретируем.",
    "В секторе «Тяжело, но остаются» — 28% участников с высшим образованием и 17% со средним специальным; «Справляются и остаются» — 57% и 68%. Намерение остаться не исключает потребности в поддержке. Малые образовательные группы здесь не интерпретируем.",
    "К психологу обращались 13% участников с высшим образованием и 8% со средним специальным. Усилия работодателя считают недостаточными 46% и 47%. Различие в обращениях не означает, что одна группа довольна поддержкой больше другой; малые группы не интерпретируем.",
    "Критическое мышление низко оценили 11% участников с высшим образованием и 19% со средним специальным; управление эмоциями — 13% и 7%. Профили различаются по навыкам, поэтому общего рейтинга групп здесь нет. Малые образовательные группы не интерпретируем."
  ],
  "locality": [
    "Индекс у сельских жителей — 40,2, у городских — 32,0; компонент «Состояние» — 47,5 и 33,0. Условия жизни стоит учитывать в обсуждении благополучия, но эти данные не доказывают, что место проживания вызывает различия.",
    "В секторе «Справляются и остаются» — 68% сельских жителей и 61% городских; «Тяжело, но остаются» — 20% и 23%. Трудности есть в обеих группах: более благополучная общая картина не отменяет поддержки.",
    "К психологу обращались 10% городских жителей и 6% сельских. Достаточными усилия работодателя считают 51% и 58%. Эти показатели отвечают на разные вопросы: по ним нельзя судить, насколько доступна профессиональная помощь.",
    "Забота о теле — самый часто низко оцениваемый навык в обеих группах: 23% у городских жителей и 24% у сельских. Общая тема поддержки здесь заметнее, чем различие между типами населённых пунктов."
  ],
  "marital": [
    "Индекс у состоящих в браке — 35,5, у не состоящих — 30,7; компонент «Состояние» — 39,3 и 30,4. Это описание групп, не доказательство пользы брака: поддержку стоит строить вокруг потребностей человека, а не семейного статуса.",
    "В секторе «Тяжело, могут уйти» — 12% не состоящих в браке и 6% состоящих. В секторе «Тяжело, но остаются» — по 22%. Нужна поддержка и тех, кто допускает уход, и тех, кто остаётся; семейный статус не определяет индивидуальный риск.",
    "Успокоительные принимали 27% не состоящих в браке и 20% состоящих; недостаточными усилия работодателя считают 50% и 43%. Полезно уточнять, какой поддержки не хватает, не делая выводов о личных причинах по семейному статусу.",
    "Веру в себя низко оценили 21% не состоящих в браке и 12% состоящих; взаимоотношения с другими — 9% и 4%. Это самооценки, а не характеристика семейного статуса; темы поддержки лучше предлагать по запросу."
  ],
  "children": [
    "Общий индекс близок: 34,1 у участников с детьми и 33,0 без детей. В исходных выводах устойчивых различий по компонентам не отмечено. Наличие детей само по себе не даёт основания выделять группу с худшим благополучием.",
    "В секторе «Тяжело, но остаются» — 21% участников с детьми и 23% без детей; «Тяжело, могут уйти» — 8% и 9%. Исходные выводы не отмечают устойчивых различий по рискам: поддержка нужна обеим группам.",
    "Недостаточными усилия работодателя считают 49% участников с детьми и 44% без детей; к психологу обращались 11% и 9%. Эти описательные различия не доказывают особых потребностей родителей: конкретные запросы стоит выяснять напрямую.",
    "Забота о теле — самый часто низко оцениваемый навык и у участников с детьми (25%), и без детей (23%). В исходных выводах устойчивых различий по навыкам не отмечено; это общая тема для добровольных программ, а не основание разделять сотрудников."
  ],
  "subs": [
    "У сотрудников с подчинёнными индекс выше: 37,1 против 31,9. Самое заметное различие среди трёх компонентов — во внутренних ресурсах: 49,0 против 38,8. При этом показатели состояния близки: 36,5 и 35,2; руководящая роль не означает отсутствия трудностей.",
    "Сотрудники с подчинёнными чаще попадают в сектор «Справляются и остаются»: 67% против 60%. В секторе «Тяжело, но остаются» их меньше: 17% против 24%. Это различие описывает группы, но не доказывает влияние руководящей роли.",
    "Обращение к психологу встречается примерно одинаково часто: 10% сотрудников с подчинёнными и 9% без подчинённых. Успокоительные принимали 20% и 24%; недостаточными усилия работодателя считают по 46%. Руководители также нуждаются в доступе к поддержке.",
    "У сотрудников с подчинёнными реже встречаются низкие оценки веры в себя — 11% против 18%, адаптивности — 7% против 13% и критического мышления — 12% против 17%. Это самооценки, а не критерий профессиональной пригодности; темы развития стоит выбирать добровольно."
  ],
  "tenure": [
    "Индекс у сотрудников со стажем на текущем месте менее года — 30,5, более 10 лет — 37,2; компонент «Состояние» — 26,5 и 44,3. Адаптация заслуживает внимания, но различия могут быть связаны с возрастом и составом групп; данные не доказывают влияние стажа.",
    "В секторе «Справляются, но могут уйти» — 14% сотрудников со стажем менее года и 6% со стажем более 10 лет; «Тяжело, могут уйти» — 11% и 4%. В адаптации важно обсуждать и условия работы, и состояние, не сводя возможный уход к одной причине.",
    "К психологу обращались 17% сотрудников со стажем менее года и 5% со стажем более 10 лет; успокоительные принимали 34% и 20%. Доступ к поддержке стоит объяснять уже при адаптации; данные не показывают причин различий.",
    "Веру в себя низко оценили 24% сотрудников со стажем менее года и 13% со стажем более 10 лет; критическое мышление — 19% и 9%. Это темы для поддержки при адаптации, а не доказательство того, что стаж развивает навыки."
  ],
  "okrug": [
    "Без малых групп индекс варьируется от 30,6 в Сибирском округе до 36,7 в Южном. По исходным выводам различия находятся в пределах погрешности. Региональный рейтинг благополучия на этой основе строить не стоит.",
    "В секторе «Справляются и остаются» — 56% участников Приволжского округа и 67% Южного; «Тяжело, но остаются» — 28% и 19%. Это описательное сравнение, а не доказательство регионального эффекта; малые группы не интерпретируем.",
    "Успокоительные принимали 34% участников Сибирского округа и 16% Приволжского; к психологу обращались 10% и 11%. Обращения и приём препаратов не взаимозаменяемы: для планирования поддержки нужно отдельно выяснять доступность помощи. Значимость различий не установлена.",
    "В Северо-Западном округе наиболее часто низко оценена забота о теле — 35%; в Приволжском — вера в себя, 26%. Это возможные темы для уточнения местных запросов, не рейтинг регионов; значимость различий не установлена, малые группы не интерпретируем."
  ]
};
  const titles = ['Индекс и компоненты', 'Карта состояния и рисков', 'Поддержка', 'Навыки устойчивости'];
  const panels = [...combined.querySelectorAll('.analytics-table-footer')].map((footer, index) => {
    const panel = document.createElement('section');
    panel.className = 'insight-card slice-insights';
    panel.setAttribute('aria-label', `Выводы: ${titles[index]}`);
    panel.hidden = true;
    footer.after(panel);
    return panel;
  });
  function renderInsights() {
    const all = root.querySelector('[data-slice="all"]').getAttribute('aria-pressed') === 'true';
    const selected = [...root.querySelectorAll('.slice-chips [data-slice]:not([data-slice="all"])')]
      .filter(button => button.getAttribute('aria-pressed') === 'true');
    panels.forEach((panel, index) => {
      panel.replaceChildren();
      panel.hidden = all || !selected.length;
      if (panel.hidden) return;
      const title = document.createElement('h3');
      title.textContent = 'Выводы';
      const list = document.createElement('ol');
      list.className = 'ins-list';
      selected.forEach(button => {
        const fact = facts[button.dataset.slice]?.[index];
        if (!fact) return;
        const item = document.createElement('li');
        const label = document.createElement('strong');
        label.textContent = button.textContent.trim() + '. ';
        item.append(label, document.createTextNode(fact));
        list.append(item);
      });
      if (!list.children.length) { panel.hidden = true; return; }
      const caveat = document.createElement('p');
      caveat.className = 'analytics-table-note';
      caveat.textContent = 'Сравнения описательные: не все различия статистически подтверждены. Они не доказывают причин и не определяют состояние отдельного сотрудника.';
      panel.append(title, list, caveat);
    });
  }
  root.addEventListener('slice-selection-change', renderInsights);
  renderInsights();
})();
