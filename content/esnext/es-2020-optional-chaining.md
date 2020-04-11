---
title: "可选链（optional chaining）的使用"
date: 2020-04-11T14:09:31+08:00
keywords: ["es2020", "可选链 optional chaining", "javascript", "optional-chaining", "nullish-coalescing", "ES Next", "TypeScript 3.7"]
tags: ["JavaScript"]
categories: ["技术分享"]
author: "Meowu"
---


对一个空值进行属性读取会让程序抛异常，在多级嵌套的对象中连续读取属性值的时候尤其容易出现这个问题。为了保证程序的健壮性，我们需要先确保当前值不为空，然后再读取下一级的值；又或者是查找 DOM 的时候，当找不到当时候它当值会是 `null` ，我们需要先确定查找到的值不为空然后再调用对应的元素方法，如此就免不了要做一连串的条件判断：

```JavaScript
const isAdult = person && person.age && person.age >= 18;

const canvas = document.querySelector('canvas');
if (canvas) {
  const ctx = canvas.getContext('2d')
}
```

上面的 `&&` 是判断值非空时常用的写法，只有当 `&&` 左边的值为真时，它右边的语句才会执行，这也正是它的问题所在，因为在 `JavaScript` 中，空字符串 ` '' ` 被视为假值，当它跟 `&&` 一起使用的时候，就会得到意想不到的结果：

```javascript
const text = '';
const textLength = text && text.length; // ''
```

类似上面的代码，当我们想要获取一个文本长度的时候，空字符串得到的值应该是 0，但是 `''` 被视为假值直接返回了，从而得到的是 `''` 自身。这并不是我们想要的结果。

## 可选链 Optional Chaining

从  _ES2020 起（TypeScript3.7 开始）_，我们可以使用新的 **可选链（Optional Chaining）** 语法来获得更好的体验。它主要有以下几种形式：

```bash
obj?.prop  // 静态属性
obj?.[expr]  // 动态属性
arr?.[index]  // 数组
func?.(args) // 函数调用
``` 

它的意义是：当 `?.` 左边的值不为 `undefined` 或者 `null` 时，才执行右边的语句，否则返回 `undefined` ：

```JavaScript
let name = User?.name;

// 相当于

let name = (User === null || User === undefined) ? undefined : User.name;
```

文章开头的两个例子可以改成以下的形式：

```JavaScript
const isAdult = person?.age >= 18;

const canvas = document.querySelector('canvas');
const ctx = canvas?.getContext('2d');
```

### 动态属性

```javascript
const propName = 'key_' + 'a';
const valueA = obj?.[propName];
```

### 函数调用

除属性非空校验外，我们也可以对方法进行校验，当对象存在该方法时才会执行，当然如果函数存在同名的属性而不是一个可执行的方法时，对它进行调用还是免不了抛异常的。

```JavaScript
const canvas = document.querySelector('canvas');
const ctx = canvas?.getContext.?('2d');

const obj = { a: 2, b: () => {} };
obj?.b(); // ok
obj?.a(); // TypeError;
```

### 数组索引

```JavaScript
const firstData = dataList?.[0];
```

### 短路运算

```JavaScript
let index = 0;
let nextItem = dataList?.[++index];
```

在可选链执行时，遵循短路运算的逻辑，当 `?.` 左边的为 	`null` 或者 `undefined` 时，右边的并不会被计算，也就是 `index` 不会加 1 。

跟空值合运算符结合起来用可以让我们很方便地指定一个默认值：

```javascript
const userName = User?.name ?? 'Unknown';
```

## 目前不支持的一些用法

```JavaScript
new a?.();
new a?.`string`
a?.b = c; // 可选的属性赋值；
super?.();
new?.target
```




