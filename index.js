let MutationSummary = require('mutation-summary');

window.jr = {};

jr.index = new Map();

jr.init = () => {
  jr.index = new Map();

  $('*').each((i, el) => jr.initEl(el));

  jr.observer = new MutationSummary({
    queries: [{ all: true }],

    callback: summaries => {
      let summary = summaries[0];

      for (let el of summary.added) {
        if (el.nodeName === '#text') {
          continue;
        }

        jr.initEl(el);
      }

      for (let el of summary.removed) {
        jr.index.delete(el);
      }

      let dirtyEls = new Set();

      for (let [attrName, els] of Object.entries(
        summary.attributeChanged,
      )) {
        for (let el of els) {
          if (
            !attrName.startsWith('jr-')
            || summary.added.includes(el)
            || summary.removed.includes(el)
          ) {
            continue;
          }

          let indexEntry = jr.index.get(el);
          let attrVal = el.getAttribute(attrName);

          if (indexEntry.attrs[attrName].value === attrVal) {
            continue;
          }

          dirtyEls.add(el);
        }
      }

      for (let el of dirtyEls) {
        jr.updateEl(el);
      }
    },
  });
};

jr.initEl = el => {
  let indexEntry;

  for (let i = 0; i < el.attributes.length; ++i) {
    let attr = el.attributes.item(i);

    if (!attr.name.startsWith('jr-')) {
      continue;
    }

    indexEntry = indexEntry || {
      el, attrs: {},
    };

    indexEntry.attrs[attr.name] = {
      name: attr.name,
      value: attr.value,
    };
  }

  if (!indexEntry) {
    return;
  }

  jr.index.set(el, indexEntry);
  jr.updateEl(el);

  el.addEventListener('keydown', jr.onChange);
  el.addEventListener('keyup', jr.onChange);
  el.addEventListener('change', jr.onChange);
};

jr.findStateEl = el => {
  let stateEl = el;

  while (stateEl && !stateEl.jrState) {
    stateEl = stateEl.parentElement;
  }

  return stateEl;
};

jr.onChange = ev => {
  let el = ev.target;
  let indexEntry = jr.index.get(el);

  if (!indexEntry) {
    return;
  }

  let attr = indexEntry.attrs['jr-value.bind'];
  let stateEl = jr.findStateEl(el);

  if (!stateEl) {
    return;
  }

  stateEl.jrState[attr.value] = el.value;
  jr.update();
};

jr.updateEl = el => {
  let stateEl = jr.findStateEl(el);
  let state = stateEl ? stateEl.jrState : {};

  let indexEntry = jr.index.get(el);

  for (let attr of Object.values(indexEntry.attrs)) {
    let computed = attr.value = el.getAttribute(attr.name);

    for (let [k, v] of Object.entries(state)) {
      computed = computed.replace(`\${${k}}`, v);
    }

    if (attr.name.endsWith('.bind')) {
      computed = state[computed];
    }

    if (computed === attr.computed) {
      continue;
    }

    attr.computed = computed;

    let targetName = attr.name.slice('jr-'.length).replace(/\.bind$/, '');

    if (targetName === 'textcontent') {
      el.textContent = computed;
    }
    else {
      let propTargets = ['value'];

      if (!propTargets.includes(targetName)) {
        el.setAttribute(targetName, computed);
      }
      else {
        el[targetName] = computed;
      }
    }
  }
};

jr.update = () => {
  for (let el of jr.index.keys()) {
    jr.updateEl(el);
  }
};
