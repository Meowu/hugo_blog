---
title: "JS 新特性：空值合并运算符的使用"
date: 2020-01-31T21:36:36+08:00
draft: true
keywords: ["nullish-coalescing", "es2020", "空值合并运算符", "javascript", "optional-chaining"]
tags: ["JavaScript"]
categories: ["技术分享"]
author: "Meowu"
---

JavaScript 即将新增一项备受期待的特性：[空值合并运算符(Nullish Coalescing)](https://github.com/tc39/proposal-nullish-coalescing)，目前已经处于 **Stage 4**，将在 `ECMAScript 2020` 中发布，[TypeScript 3.7](https://devblogs.microsoft.com/typescript/announcing-typescript-3-7/#nullish-coalescing) 也已经支持该特性。

## 假值与空值

除了我们现在讨论的空值运算符，之前我们已知的逻辑运算符有：_逻辑与`&&`_ 以及 _逻辑或`||`_，它们主要用来处理**真假值**的。`a && b` 的意思是，如果 `a` 的值**不为假**，那么得到 `b`，否则得到 `a`；`a || b` 正好反过来，如果 `a` 的值为真，那么将得到 `a`，反之得到 `b` 。

在过去，我们可能的做法是，暴露一个可选的参数，如果不传该参数，我们就给它一个默认值。

考虑一个场景，假设我们有一个树组件，用户可以配置树节点是否可被选中☑️，`checkable` 的值为 `true` 时启用该功能，为 `false` 则禁用这个功能， 如果不传则默认为 `true`：

```javascript
const treeNode = (props) => {
    const checkable = props.checkable || true;
}
```

实际使用的时候就会发现这段代码有问题，当如果传进来的是 `true` 或者不传它的值都将是 `true` ，但是当我们想要关闭可选中的功能设置 `props.checkable = false` ，此时 `checkable` 的值依然是 `true` ，因为 `false` 是一个假值，此时它得到的是 `||` 右边值 `true` ，这样的话我们无法禁用选中功能，要解决这个问题，我们可以修改一下代码：

```javascript
const treeNode = (props) => {
    const checkable = props.checkable !== false;
}
```

这样子看上去解决了一开始的问题，但是又引发了新的问题。我们都知道在 JavaScript 中的假值除了 `false` 还有 `''` `0` `null` `undefined` `NaN` ，它们都可以被 JS 强制转换为 `false` 值。我们想让树组件更加健壮，更加友好，假设用户传了 `0` `''` `NaN` 这些值，那么依然禁用选中功能，当用户传进来的是空值 `null` 或者不传时，就默认为 `true` 开启选中功能。这就是我们为什么要使用 `空值运算符(nullish coalescing)` 。


