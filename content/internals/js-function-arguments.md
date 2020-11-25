---
title: "JavaScript 中 arguments 对象的特性解析"
date: 2020-11-25T19:54:16+08:00
keywords: ["ECMAScript 262", "HTML Standard Specification", "JS 的 arguments 对象", "JavaScript arguments", "internals"]
tags: ["ECMAScript 262", "Specification", "HTML Standard", "JavaScript", "internals"]
categories: ["技术分享"]
draft: true
---

在 `JavaScript` 中，我们可以通过 `Function.length` 来得到函数签名中参数的个数，如果要知道实际参数的个数，在**非箭头函数**中，我们可以从函数内部的局部变量 `arguments` 对象得知。它包含了传递给函数的全部参数，是一个类数组对象，我们可以通过下标（例如 `arguments[0]`）来取得其中参数，`arguments.length` 得到传递的参数个数。

## arguments 的类型

使用常规的类型判断方法，我们可以知道 `arguments` 的具体类型是什么：

```js
function h() {
    console.log('typeof: ', typeof arguments);
    console.log('toString: ', Object.prototype.toString.call(arguments));
}
// h()
// typeof:  object
// toString:  [object Arguments]
```

## arguments 转换为数组

`arguments`  是一个类数组对象，它没有诸如 `forEach`  `map` 等方法，我们可以使用 `Array.from`、 `Array.prototype.slice` 、扩展运算符等方法将其转换为一个数组来使用：

```javascript
function h() {
    const args1 = Array.from(arguments);
    const args2 = Array.prototype.slice.call(arguments);
    const args3 = [...arguments];
    console.log(args1);
    console.log(args2);
    console.log(args3);
}
```

## arguments 与剩余参数、默认参数、解构赋值

既然 `arguments` 可以通过下标来读取，那么能否通过下标去改变它的值呢？

JS 中的参数是按值传递的，如果我们改变了参数列表中某个参数的值，`arguments` 中对应的值会不会跟着改变？

以上的疑问总结下来就是： _`arguments` 是不是跟传递给函数的参数动态链接的？_

根据 [ECMA-262](https://www.ecma-international.org/ecma-262/6.0/#sec-arguments-exotic-objects) 的描述，经过测试后，它们之间的具体关系是这样的：

1. 在非严格模式下，`arguments` 中的值，跟传给函数的参数在顺序上是一一对应的，也就是 arguments[0] 对应传给函数的第一个参数，但是如果把 `arguments` 中的某个位置值删除然后重新定义或者将其定义为访问器 (accessor) 的话，就会破坏这种关系，但是这种破坏仅限于改变的那个值。


```javascript	
function test(a, b, c) {
    console.log('init arguments', [...arguments]);
    a = 3;
    arguments[0] = 1;
    console.log('changed a: ', a); // a 被改为了 1
    console.log('after property changed: ', [...arguments]);
    arguments[1] = 3; // b 被改为了 3
    console.log('after arguments changed', [...arguments]);
}
test(0, 2, 3);
// init arguments [ 0, 2, 3 ]
// changed a:  1
// after property changed:  [ 1, 2, 3 ]
// after arguments changed [ 1, 3, 3 ]

// 删除了 arguments 第一个值后，a 改变不会引起 arguments 的改变
function test(a, b, c) {
    console.log('init arguments', [...arguments]);
    // delete a;
    delete arguments[0]; // 关系破坏了
    arguments[0] = 1; // 重新定义为 1
    console.log('changed a: ', a); // a 依然为 0
    a = 3; // 不会再改变 arguments[0] 的值
    console.log('after property changed: ', [...arguments]);
    arguments[1] = 3;
    console.log('after arguments changed', [...arguments]);
}
test(0, 2, 3);
// init arguments [ 0, 2, 3 ]
// changed a:  0
// after property changed:  [ 1, 2, 3 ]
// after arguments changed [ 1, 3, 3 ]
```

2. 规则 1 的前提是参数中没有包含默认参数、剩余参数或者解构赋值。如果参数中包含上面三种形式，则 `arguments` 不会跟踪参数的值，反之亦然。


```javascript
function test1(a = 50) {
    a = 20;
    // 存在默认值，a 不会改变 arguments 的值。
    console.log(arguments[0]); 
}
test1(10); // 10

function test2(a, ...rest) {
    arguments[0] = 20;
    console.log('a', a); // a = 10, 不会更新 a 的值
    console.log([...arguments]);
}
test2(10) // [20]

function test3(a, { b }) {
    console.log('a', a);
    a = 20; // 不会改变 arguments
    console.log([...arguments]);
}
test3(10, {}); // [ 10, {} ]

```

3. 严格模式下 `arguments` 的值只是对传递给函数的参数的拷贝，不管是否包含剩余参数、默认参数或者解构赋值，它们之间都不会有动态链接的关系：


```js
function test(a, b, c) {
    'use strict'
    console.log('init arguments', [...arguments]);
    arguments[0] = 1; // 重新定义为 1
    console.log('remained a: ', a); // a 不变
    b = 3; // 不会再改变 arguments[1] 的值
    console.log('after property changed: ', [...arguments]);
    console.log('after arguments changed', [...arguments]);
}
test(0, 2, 3);
// init arguments [ 0, 2, 3 ]
// remained a:  0
// after property changed:  [ 1, 2, 3 ]
// after arguments changed [ 1, 2, 3 ]
```

4.  严格模式下访问 `arguments.callee` 会抛异常。



## 总结

1. 箭头函数没有 arguments ；
2. arguments 是一个类数组对象，可以通过下标访问，也有多种简单的方法将其转换为一个数组；
3. 非严格模式下，`arguments` 会跟踪传递给函数的参数，如果参数中包含默认值、解构赋值、剩余参数的话，则不会跟踪；
4. 严格模式下，`arguments` 只是对传递给函数参数的拷贝，参数变量和 `arguments` 的改变不会相互影响。