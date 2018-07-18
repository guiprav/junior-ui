let MutationSummary = require('mutation-summary');

window.jr = {};

Object.assign(jr, require('./helpers'));
Object.assign(jr, require('./selectors'));

jr.index = new Map();

jr.init = () => {
  jr.index = new Map();

  for (let el of jr.find('*')) {
    if (!document.contains(el)) {
      continue;
    }

    jr.initEl(el);
  }

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
  if (jr.index.has(el)) {
    console.warn(`[jr]`, el, `is already initialized.`);
    return;
  }

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

  if (el.tagName === 'INPUT') {
    el.addEventListener('keydown', jr.onChange);
    el.addEventListener('keyup', jr.onChange);
  }

  el.addEventListener('change', jr.onChange);
};

jr.getState = el => {
  let state = { refs: {} };

  {
    let cursorEl = el;

    while (cursorEl) {
      if (cursorEl.jrListItem) {
        let { jrListItem } = cursorEl;

        state.refs[jrListItem.iteratorName] = {
          type: 'iterator',
          key: jrListItem.iteratorName,
          value: jrListItem.value,
        };
      }

      if (cursorEl.jrState) {
        break;
      }

      cursorEl = cursorEl.parentElement;
    }

    state.closest = cursorEl ? cursorEl.jrState : {};

    for (let [k, v] of Object.entries(state.closest)) {
      if (state.refs[k]) {
        continue;
      }

      state.refs[k] = {
        type: 'state',
        obj: cursorEl.jrState,
        key: k,
        value: v,
      };
    }
  }

  state.get = k => {
    let ref = state.refs[k];
    return ref && ref.value;
  };

  state.eval = expr => {
    let keys = expr.split('.');
    let rootKey = keys.shift();

    return keys.reduce(
      (obj, key) => obj && obj[key],
      state.get(rootKey),
    );
  };

  state.set = (k, v) => state.closest[k] = v;

  return state;
};

jr.onChange = ev => {
  let el = ev.target;
  let indexEntry = jr.index.get(el);

  if (!indexEntry) {
    return;
  }

  let attr = indexEntry.attrs['jr-value.bind'];
  let state = jr.getState(el);

  state.set(attr.value, el.value);
  jr.update();
};

jr.updateListEl = el => {
  let state = jr.getState(el);

  let indexEntry = jr.index.get(el);
  let listAttr = indexEntry.attrs['jr-list'];

  let listExpr =
    listAttr.value = el.getAttribute('jr-list');

  let parsedListExpr =
    /^for ([^ ]+) of (.+)$/.exec(listExpr);

  if (!parsedListExpr) {
    console.error(`[jr] Invalid jr-list expression in`, el);
    return;
  }

  let iteratorName = parsedListExpr[1];
  let iterableKey = parsedListExpr[2];

  let oldList = listAttr.computed;

  let list = listAttr.computed =
    Array.from(state.get(iterableKey));

  if (!oldList) {
    jr.initListEl({ el, listAttr, list, iteratorName });
    return;
  }

  let noDiff = true;

  if (list.length === oldList.length) {
    for (let [i, v] of list.entries()) {
      if (oldList[i] === v) {
        continue;
      }

      noDiff = false;
      break;
    }
  }

  if (noDiff) {
    return;
  }

  let diff = jr.diffLists(oldList, list);

  let oldLis = Array.from(el.children);
  el.innerHTML = '';

  for (let x of diff) {
    switch (x.type) {
      case 'existing':
        el.appendChild(oldLis[x.from]);
        break;

      case 'new': {
        let newLi = el.jrRefListItem.cloneNode(true);

        newLi.jrListItem = {
          iteratorName,
          value: x.value,
        };

        el.appendChild(newLi);

        break;
      }

      default:
        throw new Error('???');
        break;
    }
  }
};

// TODO: Review computational complexity if too slow
// on realistic benchmarks.
jr.diffLists = (a, b) => {
  let diffs = {
    moved: [],
    added: [],
  };

  for (let [i, x] of a.entries()) {
    if (b[i] === x) {
      continue;
    }

    let newIndex = b.findIndex((y, j) => {
      if (y !== x) {
        return false;
      }

      return !diffs.moved.some(
        z => z.value === y && z.to !== j,
      );
    });

    if (newIndex === -1) {
      continue;
    }

    diffs.moved.push({
      value: x,
      from: i,
      to: newIndex,
    });
  }

  for (let [i, x] of b.entries()) {
    if (a[i] === x) {
      continue;
    }

    if (diffs.moved.some(y => y.value == x && y.to === i)) {
      continue;
    }

    diffs.added.push({
      value: x,
      to: i,
    });
  }

  return b.map((x, i) => {
    if (a[i] === x) {
      return { type: 'existing', from: i };
    }

    let moved = diffs.moved.find(y => y.to === i);

    return moved
      ? { type: 'existing', from: moved.from }
      : { type: 'new', value: x };
  });
};

jr.initListEl = ({ el, listAttr, list, iteratorName }) => {
  let refLi = el.jrRefListItem = el.firstElementChild;
  el.innerHTML = '';

  for (let x of list) {
    let li = refLi.cloneNode(true);

    li.jrListItem = {
      iteratorName,
      value: x,
    };

    el.appendChild(li);

    for (let el of [li, ...jr.find('*', li)]) {
      if (!document.contains(el)) {
        continue;
      }

      jr.initEl(el);
    }
  }
};

jr.updateEl = el => {
  let state = jr.getState(el);
  let indexEntry = jr.index.get(el);

  for (let attr of Object.values(indexEntry.attrs)) {
    if (attr.name === 'jr-list') {
      jr.updateListEl(el);
      continue;
    }

    let computed = attr.value = el.getAttribute(attr.name);

    let interpRe = /\${([^}]+)}/g;
    let interpList = [];

    while (true) {
      let reRes = interpRe.exec(computed);

      if (!reRes) {
        break;
      }

      interpList.push(reRes[1]);
    }

    for (let expr of interpList) {
      let value = state.eval(expr);

      computed = computed.replace(
        new RegExp(jr.escapeRegExp(`\${${expr}}`), 'g'),
        value,
      );
    }

    if (attr.name.endsWith('.bind')) {
      computed = state.eval(computed);
    }

    if (computed === attr.computed) {
      continue;
    }

    attr.computed = computed;

    let targetName = attr.name
      .slice('jr-'.length)
      .replace(/\.bind$/, '');

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
