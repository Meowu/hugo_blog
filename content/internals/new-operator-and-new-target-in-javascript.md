---
title: "new 操作符和 new.target 元属性"
date: 2024-03-08T12:28:03+08:00
keywords:
  ["ECMAScript 262", "new operator", "new.target meta property", "internals"]
tags:
  [
    "ECMAScript 262",
    "Specification",
    "HTML Standard",
    "JavaScript",
    "internals",
  ]
draft: true
---

`new` 操作符允许开发者实例化自定义对象类型或者*具有构造函数*的内置对象类型。

## new 的实现

对于一个函数来讲，是否使用 `new` 来调用，其内部的 `this` 指向是不一样的。

根据[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new#description)的介绍，当一个函数被 `new` 调用时，它会被当成一个构造函数，在这个过程中主要做了以下事情：

1. 创建一个空的对象 `newInstance` 。
2. 把该对象的原型指向构造函数的原型 (prototype) 。
3. 用给出的参数执行该构造函数，并把其 `this` 指向 `newInstance` 。
4. 如果函数执行的结果返回 **非原始值** ，直接作为 `new` 操作的结果返回，否则返回 `newInstance` 。

基于这个过程，我们可以模拟实现一个 `new` 的实例化过程：

```javascript
function newish(ctor, ...args) {
  const newInstance = Object.create(ctor.prototype);
  const result = ctor.apply(newInstance, args);
  if (typeof result === "object" && result !== null) return result;
  return newInstance;
}
```

在以上实现中，我们用 `Object.create(ctor.prototype)` 完成了 1 和 2 两步操作，使用 `Object.create` 比使用废弃的 `__proto__` 属性和 `Object.setPrototypeOf` 去设置对象的原型性能更好。然后使用 `apply` 方法执行构造函数并把 `this` 指向正确的对象。最后判断构造函数的返回值。

回顾这个过程，改变 `this` 的指向是很重要的一步，再联想到箭头函数是没有自己的 `this` 值的，所以箭头函数是不能使用 `new` 来调用的，因为它也没有自己的构造函数。

除此之外，从 `ES6` 起语言规范更加严格地区分了构造函数和函数，像 `Symbol` 和 `BigInt` 不能使用 `new` 来调用，而 `Proxy` 和 `Map` 等必须使用 `new` 来调用，否则会抛 `TypeError` 错误。

## new.target 元属性

因为 `new` 是一个保留字，`new.target` 是一个特殊的表达式语法，它不是 `new` 的属性，只是由 `new.` 和`target` 组成。

`new.target` 元属性可以让我们用来检测一个函数或者构造函数是否通过 `new` 来调用的。如果是，它返回可以被 `new` 调用的函数，否则返回 `undefined` 。

```javascript
function Foo() {
  console.log(new.target);
}

new Foo(); // prints Foo
Foo(); // prints undefined
```

箭头函数中的 `new.target` 继承自它的外围作用域。

```javascript
function baz() {
  const boo = () => {
    console.log(new.target === baz);
  };
  boo();
}

new baz(); // true
```

构造方法中的 `new.target` 指向的是直接被 `new` 调用的类，即便是在子类中通过 `super` 执行的父类的构造方法。

```javascript
class Foo {
  contructor() {
    console.log(new.target?.name);
  }
}

class Bar extends Foo {
  constructor() {
    super();
  }
}

new Foo(); // "Foo"
new Bar(); // "Bar"
```

## 总结

本文主要介绍了是否使用 `new` 来调用函数的区别， `new` 关键字的发生过程及其模拟实现；对于一些内置类型来说，如`Symbol` `BigInt` 不能使用 `new` 来实例化，而 `Proxy` `Map` 则必须使用 `new` 。

同时介绍了 `new.target` 这一元属性。当函数被 `new` 调用时，在函数内部 `new.target` 指向该函数本身，否则返回 `undefined` 。
