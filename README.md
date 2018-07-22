# Junior

**Disclaimer:** This software is pre-alpha. It was implemented in a rush over weekends and necessary enhancements abound, but it works and is not as full of bullshit as Angular, React, Vue, etc.

Junior is like someone with a weird "dom" fetish, [Mithril](https://mithril.js.org), and [jQuery](https://jquery.org) had a very ugly threesome-born baby.

Demo / test page is at [n2liquid.github.io/junior-ui/test.html](https://n2liquid.github.io/junior-ui/test.html).

Good ole to-do list demo app is at [n2liquid.github.io/junior-ui/todoDemo.html](https://n2liquid.github.io/junior-ui/todoDemo.html).

## Installation

Use `npm i -s junior-ui`, then `require('junior-ui/browserGlobal');`

Or copy `bundle.js` from this repo to `vendor/junior-ui.js` under your project's public / statically-served directory, then add `<script src="vendor/junior-ui.js"></script>` to your HTML.

## Basic usage

Set scopes directly to DOM nodes and use them with straightforward attribute expressions:

```html
<ul class="fruitList" jr-list="for fruit of fruits">
  <li>
    The
    <a jr-href="${wikipediaPrefix}/${fruit.name}"></a>
    is
    <a jr-href="${wikipediaPrefix}/${fruit.color}"></a>.
  </li>
</div>

<script>
  jr.findFirst('body').jr.setScope({
    wikipediaPrefix: 'https://www.wikipedia.org/wiki',
  });

  jr.findFirst('.fruitList').jr.setScope({
    fruits: [
      { name: 'Apple', color: 'Red' },
      { name: 'Grape', color: 'Purple' },
      { name: 'Lemon', color: 'Green' },
    ],
  });

  jr.init();
</script>
```

Result:

* The [Apple](https://www.wikipedia.org/wiki/Apple) is [Red](https://www.wikipedia.org/wiki/Red).
* The [Grape](https://www.wikipedia.org/wiki/Grape) is [Purple](https://www.wikipedia.org/wiki/Purple).
* The [Lemon](https://www.wikipedia.org/wiki/Lemon) is [Green](https://www.wikipedia.org/wiki/Green).

DOM changes to Junior attributes are detected using mutation observers and are immediately reevaluated and updated, meaning they can even be changed straight from a browser inspector and they'll still be automatically reevaluated and updated.

Scope changes are not automatically observed and require `jr.update()` to be called so Junior attributes are reevaluated and updated.

`jr.update()` is automatically called whenever:

* `keydown` and `keyup` events are fired on Junior input elements.
* `click` and `change` events are fired anywhere in the DOM.

## License

![](https://www.gnu.org/graphics/agplv3-155x51.png)

Junior is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Exclusion of warranty

Junior is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

A copy of AGPLv3 can be found in [COPYING.](COPYING)
