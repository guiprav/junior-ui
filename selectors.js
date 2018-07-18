function elArrayFind(selector) {
  let matches = new Set();

  for (let thisEl of this) {
    for (let thatEl of exports.find(selector, thisEl)) {
      matches.add(thatEl);
    }
  }

  return Array.from(matches);
}

function elArrayFindFirst(selector) {
  for (let thisEl of this) {
    let thatEl = exports.findFirst(selector, thisEl);

    if (thatEl) {
      return thatEl;
    }
  }

  return null;
}

function elFind(selector) {
  return exports.find(selector, this);
}

function elFindFirst(selector) {
  return exports.findFirst(selector, this);
}

exports.find = (selector, el) => {
  let ret = Array.from(
    (el || document).querySelectorAll(selector),
  );

  ret.find = elArrayFind;
  ret.findFirst = elArrayFindFirst;

  return ret;
};

exports.findFirst = (selector, el) => {
  let foundEl = (el || document).querySelector(selector);

  return foundEl && new Proxy(foundEl, {
    get: (target, prop) => {
      switch (prop) {
        case 'find': return elFind;
        case 'findFirst': return elFindFirst;
        default: return target[prop];
      }
    },
  });
};
