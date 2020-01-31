---
title: "JS 新特性：空值合并运算符的使用"
date: 2020-01-31T21:36:36+08:00
draft: true
keywords: ["nullish-coalescing", "es2020", "空值合并运算符", "javascript", "optional-chaining"]
tags: ["JavaScript"]
categories: ["技术分享"]
author: "Meowu"
---

JavaScript 即将新增一项备受期待的特性：[空值合并运算符(Nullish Coalescing)](https://github.com/tc39/proposal-nullish-coalescing)，目前(_2020-01-31_)已经处于 **Stage 4**，将在 `ECMAScript 2020` 中发布，[TypeScript 3.7](https://devblogs.microsoft.com/typescript/announcing-typescript-3-7/#nullish-coalescing) 已经支持该特性，[babel](https://babeljs.io/docs/en/babel-plugin-proposal-nullish-coalescing-operator) 也提供了一个插件让我们提前使用该特性。

## 假值与空值

除了我们现在讨论的空值运算符，我们已知的逻辑运算符有：_逻辑与`&&`_ 以及 _逻辑或`||`_，它们主要用来处理**真假值**的。`a && b` 的意思是，如果 `a` 的值**不为假**，那么得到 `b`，否则得到 `a`；`a || b` 正好反过来，如果 `a` 的值为真，那么将得到 `a`，反之得到 `b` 。

有时候，我们可能的做法是，暴露一个可选的参数，如果不传该参数，就给它一个默认值。

考虑一个场景，假设我们有一个树组件，用户可以配置树节点是否可被选中☑️，`checkable` 的值为 `true` 时启用该功能，为 `false` 则禁用这个功能， 如果不传则默认为 `true`：

```javascript
const treeNode = (props) => {
    const checkable = props.checkable || true;
}
```

实际使用的时候就会发现这段代码有问题，当如果传进来的是 `true` 或者不传它的值都将是 `true` ，但是当我们想要关闭可选中的功能设置 `props.checkable = false` ，此时 `checkable` 的值依然是 `true` ，因为 `false` 是一个假值，此时它得到的是 `||` 的右边值 `true` ，这样的话我们无法禁用选中功能，要解决这个问题，我们可以修改一下代码：

```javascript
const treeNode = (props) => {
    const checkable = props.checkable !== false;
}
```

这样子看上去解决了一开始的问题，但是又引发了新的问题。我们都知道在 JavaScript 中的假值除了 `false` 还有 `''` `0` `null` `undefined` `NaN` ，它们都可以被 JS 强制转换为 `false` 值。我们想让树组件更加健壮，更加友好，假设用户传了 `0` `''` `NaN` 这些值，那么依然禁用选中功能，当用户传进来的是空值 `null` 或者不传时，就默认为 `true` 开启选中功能，修改之后的代码依然无法做到。

还有一些场景，我们接收的参数是数字类型，假如不传就设置一个默认值，如果使用逻辑或 `||` 的话，当参数值为 0 时就会被忽略掉：

```javascript
  class Audio {
      constructor(args) {
          this.volume = args.volume || 5; // args.volume = 0 时，this.volume = 5;
      }
  }
```

这就是我们为什么要使用 `空值运算符(nullish coalescing)` 。

它的语法表示是：

```javascript
leftExpr ?? rightExpr
```

意思是当左边为**空值**时，就取右边的值，否则取左边的值。这里的**空值指的是 `null` 和 `undefined`** ，这是它跟假值不同的地方，也是使用空值运算符和逻辑或运算符的区别之处。

上面的代码可以修改成下面这样，看上去非常干净：

```javascript
const treeNode = (props) => {
    const checkable = props.checkable ?? true;
}

class Audio {
    constructor(args) {
        this.volume = args.volume ?? 5; 
    }
}

let bar
let count
let foo
count = 0;
foo = '';
bar = foo || 'b'; // => 'b'
bar = foo ?? 'b'; // 等于 ''

bar = count || 2; // => 2
bar = count ?? 2; // => 0

foo = null;
bar = foo ?? 'b'; // => 'b'
```

## 解构时声明默认值

上面的代码还有一个解决办法就是使用对象解构，同时指定默认值。

```javascript
const treeNode = (props) => {
    const { checkable: canCheck = true } = props;
}
```

首先使用解构时被解构的必须是一个对象，并且只有当提取的对象属性**严格等于 undefined** 时才会使用默认值，它不能处理属性值为 `null` 的情况。然而，我们并不总是操作对象，而是变量本身就是一个空值，这个时候就无法使用解构赋值。

```javascript
class Renderer {
    constructor(selector) {
        // 使用空值合并运算符
        this.container = document.querySelect(selector) ?? document.createElement('canvas');
    }
}
```

如果我们使用解构赋值的话，就要写出类似下面这样的模板代码：

```javascript
class Renderer {
    constructor(selector) {
        // 使用空值合并运算符
        const { 
            container = document.createElement('canvas') 
        } = {
            container: document.querySelect(selector) || undefined 
        }
        this.container = container;
    }
}
```

## 运算符优先级

在已有的运算符中，`&&` 的优先级高于 `||` ，当我们混合使用它们的时候，会有一些规则。假设我们有一个表达式 `aa && bb || cc`，它实际上会被解析成 `(aa && bb) || cc`，而 `aa || bb && cc` 则会被解析成 `aa || (bb && cc)`。

需要注意的是我们不能直接把 `??` 和 (`&&` 或者 `||`)混用，必须使用 `()` 把一对运算符包括起来，不然会报错：
```javascript
(aa ?? bb) || cc;
(aa && bb) ?? cc;
(aa || bb) ?? cc;
(aa ?? bb) && cc;
aa ?? (bb || cc);
aa ?? (bb && cc);
```

