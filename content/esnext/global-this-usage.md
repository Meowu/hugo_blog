---
title: "globalThis 的使用"
date: 2022-02-28T21:36:22+08:00
keywords: ["globalThis", "esnext", "ESNext Stage4", "window global self"]
tags: ["JavaScript"]
categories: ["技术分享"]
author: "Meowu"
---


## 全局对象

 **JavaScript** 能够运行在不同的环境中，比较常见的有浏览器环境和 **nodejs** 环境，这些环境都有自己的全局对象。当我们想要获取全局对象时，可以在 web 浏览器中通过 `window`, `frames`, `self` 等变量得到，在 **web worker** 环境中只能使用 `self` ，某些情况下 `this` 也指向全局对象，但是在严格模式下和 JS 模块中 `this` 指向 `undefined` 。如果是在 **nodejs** 环境中只能通过 `global` 来得到全局变量，它的 `this` 指向的是所在模块，等同于 `module.exports` 。

还有一种比较可靠的方法就是使用 `Function('return this')()` 来获取全局对象，然而因为内容安全策略（CSP） 的限制，在如 Chrome Apps 这样的环境中禁用了 `eval` ，无法使用 `Function` 。

 **es6-shim** 是这样来获取跨环境的全局对象的：

```javascript
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
};
```


## 统一的全局对象

新的 `globalThis` 变量可以让我们以一种标准的方式来获取全局的对象，而无需关心当前的运行环境。不同于 `window`, `self` 等变量，任何情况下，我们只要把 `globalThis` 看做是全局的 `this` 即可。

它的属性特性是：

| 特性           | 值      |
| --------      | ------  |
| writable      | true    |
| configurale   | true    |
| enumarable    | false   |

现在有了 `globalThis` 之后，我们可以直接这样使用：

```javascript

var a = 1;
var b = 2;
var c = 3;
let d = 4;
const total = globalThis.a + globalThis.b + globalThis.c;
console.log('total:', total); // total: 6

```

需要注意的是通过 `let` 和 `const` 声明的全局变量不属于 `globalThis` 。
