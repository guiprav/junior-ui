exports.arrayShuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let x = a[i];
    a[i] = a[j];
    a[j] = x;
  }

  return a;
};

let escapeRe = /([.*+?^=!:${}()|\[\]\/\\])/g;

exports.escapeRegExp =
  str => str.replace(escapeRe, '\\$1');

exports.elAttrsToString = el => {
  let tagName = el.tagName.toLowerCase();
  let attrs = [];

  for (let i = 0; i < el.attributes.length; ++i) {
    let attr = el.attributes[i];
    attrs.push(`${attr.name}="${attr.value}"`);
  }

  return `<${tagName} ${attrs.join(' ')}>`;
};
