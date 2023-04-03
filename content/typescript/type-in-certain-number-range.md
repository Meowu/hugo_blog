---
title: "使用 TypeScript 类型限定数字的范围"
date: 2023-03-31T23:19:37+08:00
keywords: ["typescript", "basic types", "typescript for beginners", "learn typescript", "static type check", "dive into typescript", "custom type", "Type in RangeNumber"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---

在 TypeScript 中对于一些数字类型，有时候使用 `number` 的话过于宽泛，我们需要把类型限制在具体的数字范围内。

### 联合类型

如果是比较小的范围如 `1~10`，可以简单地使用联合类型全部枚举出来：

``` typescript
`type IntRange = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 `
```
但是这样不大优雅，也不够通用，比如 RGB 的范围在 1-255 我们是没法全部列举出来的，理想的方法是设计一个泛型函数，接收最大值最小值作为参数，然后得到包含了范围内所有数字的类型。

### 递归的条件类型

[TypeScript 4.1](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#recursive-conditional-types) 起支持了递归的条件类型，可以利用这个特性来递归地计算出所有的数字。

我们知道取一个对象的值可以直接通过 key 去取，数组可以看成 key 都是数字的特殊对象，所以可以通过 `[][number]` 这样的方法来获取数组中每一项，而 `[]['length']` 则返回当前数组的长度。

所以实现思路就是如果数组的长度等于传入的数字，则返回 `[][number] `，否则从 0 开始（数组的初始值为 0）把每一项加到数组中。

``` typescript
type Enumerate<T extends number, R extends number[] = []> = R['length'] extends T ? R[number] : Enumerate<T, [R['length'], ...R]>

type R100 = Enumerate<100>
const r1: R100 = 10 // ok
const r2: R100 = 101 // Type '101' is not assignable to type 0...99
type R100I = Enumerate<100> | 100

type R1000 = Enumerate<1000> // Type instantiation is excessively deep and possibly infinite.
```

返回的结果里是不包含上限的，像 `R100I` 那样使用联合类型把它加进去就可以了。

### 条件类型的尾递归消除

在旧的 TS 版本里，执行 `Enumerate<50>` 是会报错的，因为它超出了 TS 的类型实例化的深度限制 (the type instantiation depth limit) 。但从 [TypeScript 4.5](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#tail-recursion-elimination-on-conditional-types) 起，TS 支持了条件类型的尾递归消除，允许这个最大限制达到 1000 ，具体可以看下这个 [PR](https://github.com/microsoft/TypeScript/pull/45711) 。

顺便了解一下*尾调用*的概念，以下摘自维基百科：

> 在[计算机科学](https://zh.wikipedia.org/wiki/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%A7%91%E5%AD%A6)里，**尾调用**是指一个函数里的最后一个动作是一个[函数](https://zh.wikipedia.org/wiki/%E5%AD%90%E7%A8%8B%E5%BA%8F)调用的情形：即这个调用的返回值直接被当前函数返回的情形。这种情形下称该调用位置为**尾位置**。若这个函数在尾位置调用本身（或是一个尾调用本身的其他函数等等），则称这种情况为**尾递归**，是[递归](https://zh.wikipedia.org/wiki/%E9%80%92%E5%BD%92)的一种特殊情形。尾调用不一定是递归调用，但是尾递归特别有用，也比较容易实现。

函数执行的时候有个入栈出栈的过程，如果递归调用过深，会引起栈溢出。而尾递归优化可以很好地解决这个问题，它比原来的函数多一个变量，每执行一次调用的都会搜集当前的结果，并累积传给下一次调用，不会保存对当前上下文的引用，使得原来的栈空间从 O(n) 降到 O(1) 。

以下是一个 JS 版本的简单的递归调用以及递归优化对比：

``` javascript
const recsum = x => x === 1 ? x : x + recsum(x - 1)

const tailrecsum = (x, acc = 0) => x === 0 ? acc : tailrecsum(x - 1, x + acc)
```

上述的 `Enumerate` 实现其实已经是一个尾递归优化版本的类型方法了，我们每次都会把当前的值添加到累积数组里传给下一次递归调用，而 TS 允许递归次数上限到 1000 ，已经极大地满足了我们的需求，现在我们可以很方便对颜色值进行限制：

``` typescript
type RGBColor = Enumerate<255> | 255

const r1: RGBColor = 1 // ok
const r2: RGBColor = 256 // error
```

### 指定数值区间

上述方法实现了从 0 到指定数值的枚举，有时候我们不想从零开始，而是希望限定在某个区间，借助 `Exclude` 可以很简单就能实现：

``` typescript
type RangeNumber<Min, Max> = Exclude<Enumerate<Max>, Enumerate<Min>>
type r3 = RangeNumber<2, 5> // 2 | 3 | 4

// Max exclude
type RangeMaxInclude<Min, Max> = Exclude<Enumerate<Max> | Max, Enumerate<Min>>
type r4 = RangeMaxInclude<2, 5> // 2 | 3 | 4 | 5
// Min exclude
type RangeMinExclude<Min extends number, Max extends number> = Exclude<Enumerate<Max>, Enumerate<Min> | Min>
type r5 = RangeMinExclude<2, 5> // 3 | 4
```

### 限定小数范围

前面处理的都是整数，利用 TS 的模板字符串类型，可以实现小数点的枚举，这样我们就能限定颜色的透明通道，以下我们限定透明通道在 0-1 之间，最多保留 3 位小数。

``` typescript
// 0.1 | 0.2 ... 0.999 | 1.0
type AlphaChannel = `0.${Enumerate<999>}` | '0.999' | '1.0'
type AlphaValue<T extends number> = `${T}` extends AlphaChannel ? T :never
```

综合以上的方法，我们就可以很容易地定义出 RGBA 色值的范围。