
---
title: "ECMAScript 中的等值比较"
date: 2019-02-05T01:29:47+08:00
weight: 70
keywords: ["ECMAScript 262", "Specification", "HTML Standard", "Equality Comparison", "internals"]
tags: ["ECMAScript 262", "Specification", "HTML Standard", "Equality Comparison", "internals"]
author: "Meowu"
# CJKLanguage: Chinese, Japanese, Korean 这样中文摘要才会生效
isCJKLanguage: true
---

> Algorithms within this specification manipulate values each of which has an associated type. 
>
> —— ECMA262

众所周知 JS 是**动态弱类型**的，当使用不严格的 `==` 时会存在隐式的类型转换。在比较两个值时必然会先确定值的类型，在 `ecma262` 中经常会出现的 `Type(x)` 是 "the _type_ of _x_ " 的缩写  ，其中 `type` 通常指的是 `ECMAScript language type` 也就是我们直接使用的语言类型，主要有以下几种：

1. undefined
2. null
3. boolean
4. string
5. number
6. symbol
7. object

## 类型及算法过程

在 [ECMA262 的 Test and Comparison Operations](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-testing-and-comparison-operations) 这节里介绍了以下几种等值比较操作：

- Strict Equality Comparison
- SameValueNonNumber(x, y)
- SameValue(x, y)
- SameValueZero(x, y)

那么每种有什么区别，具体是怎么执行的呢。

#### Strict Equality Comparison

这个就是严格相等，`x === y` , 它的执行过程是这样的：

1. 如果 x 和 y 的类型不一样，则返回 `false` 。

2. 如果类型相同，当类型是 `number` 时：

   1. 如果 x 或者 y 是 `NaN` (它的类型是 number) 则返回 `false` 。注意，只要 x、y 有一个为 `NaN`  都会返回 `false` 。所以在严格相等中 `NaN === NaN` 返回 `false` 。
   2. 如果 `x` 和 `y` 是同样的数值，则返回 `true` 。
   3. `x` 是 `+0`，`y` 是 `-0` 或者 `x` 是 `-0` ， `y` 是 `+0` 都会返回 `true` 。
   4. 否则返回 `false` 。

   > 这里算法步骤首先排除 NaN 这种特殊情况，因为它不等于自身，然后比较两个值是否相同，是的话就返回 true，接着因为 +0（也就是0） 和 -0 是两个不同的值，但是它们是相等的，所以这种情况下也返回 true 。其余剩下的就是不同的值，返回 false 了。

3. 如果值类型相同但是非数值类型的话则执行 `SameValueNonNumber(x, y)` 。

#### SameValueNonNumber(x, y)

当 x、y 的类型相同但是都不为 `number` 类型时执行该算法。

1. 如果 `x, y` 都是 `undefined` 或者 `null` 类型的话返回`true` ，即 `undefined === undefined  null === null` 。

2. 如果 `x, y` 都是 `string` ，当它们长度相等且每个索引的（ `chatAt(index)` ）的字符相同时返回 `true` 否则返回 `false`。

3. 如果 `x, y` 都是 `boolean` ，当它们都是 `true` 或者都会 `false` 时返回 `true` 否则返回 `false` 。

4. 如果 `x, y` 是 `Symbol` 类型，只有当它们都指向同一个 `Symbol` 对象时才会回 `true` 否则返回 `false` 。因为 Symbol 是全局唯一的。

   ```js
   Symbol(1) === Symbol(1)  // false
   const a = b = Symbol(1)
   a === b // true
   ```

5. 如果 `x, y` 指向同样的 `Object` 值，返回 true ，否则返回 `false` 。

#### SameValue(x, y)

上面介绍了严格相等 `===` 所用到的两种算法，在 `ES6` 中新增了一种比较方法 `Object.is(x, y)` ，它使用的就是内部的 `SameValue` 算法：

1. 如果 `x, y` 的类型不同，返回 `false` 。
2. 如果 `x, y` 都是 `number` 类型：
   1. 如果 x 是 `NaN` 并且 y 是 `NaN` ，返回 `true` 。
   2. 如果 x 是 `+0` ，y 是 `-0` 或者 x 是 `-0` ，y 是 `+0` ，都返回 `false` 。
   3. 如果 `x, y` 为同样的数值，返回 `true` 。
   4. 不然返回 `false` 。
3. 如果类型相同但是不为 `number` 类型，执行 `SameValueNonNumber(x, y)` 操作。

总的来说就是，`Object.is(x, y)` 采用的是 `SameValue` 算法，而 `===` 采用的是 `Strict Equality Comparison` ，它们之间的区别是对待 `NaN` 和 `+0 -0` 不同。

```javascript
Object.is(NaN, NaN)  // true
Object.is(+0, -0) // false

NaN === NaN // false
+0 === -0 // true
```

#### SameValueZero(x, y)

除了上面的三种，还有一种叫 `SameValueZero(x, y)` 。顾名思义，它跟 `SameValue` 一样，除了 `0` 之外。在该算法中，`+0 === -0` 。简单来说就是，在比较数值的时候，只要它们是相同的数值那就相等，只要是 0 不管是 `+0` 还是 `-0` 也都相等，`NaN === NaN` 。

那么这种算法有什么意义呢？我全局搜索 `SameValue` 发现以下几个地方需要用到它。

1. **Array.prototype.includes(searchElement, [, fromIndex])** 

   该方法在数组中查找指定的元素，如果找到则返回 `true` ，否则返回 `true` 。跟 `indexOf` 使用了 `Strict Equality Comparison` 不一样，它使用的是 `SameValueZero` 算法， 还有一个不同点就是它不会跳过数组的空值，而是把它们当作 `undefined` ：

   ```js
   const arr = [1, -0, NaN, 4]
   arr.includes(0)  //true
   arr.includes(+0)  //true
   arr.includes(NaN) //true
   
   // indexOf 使用的是 === 。
   arr.indexOf(+0) // 1, +0 === -0
   arr.indexOf(NaN) // -1, NaN !== NaN
   
   // arr.length = 5; ==> [1, -0, NaN, 4, empty]
   arr.includes(undefined)  // true
   arr.indexOf(undefined)  // -1
   
   ```

2. **Map Objects** 

   `ES6` 新增的 `Map` 对象也是使用该算法来识别不同的 `key` 。

   ```js
   const map = new Map()
   undefined
   map.set(+0, 'same')  // Map(1) {0 => "same"}
   map.get(-0)  // "same"
   map.set(NaN, 'NaN')  // Map(2) {0 => "same", NaN => "NaN"}
   map.get(NaN)  // "NaN"
   map.delete(-0) // true
   console.log(map) // Map(1) {NaN => "NaN"}
   ```

3. **Set**

   因为 `Set` 中的值总是唯一的，所以需要判断两个值是否相等。在 `ES6` 规范中，不同值就是使用 `SameValueZero` 算法来区分的。

   ```js
   const set = new Set()
   console.log(set)  // Set(0) {}
   set.has(-0) // false
   set.add(+0) // Set(1) {0}
   set.has(-0) // true
   set.add(NaN) // Set(2) {0, NaN}
   set.has(NaN) // true
   ```

## 总结

在 `JavaScript` 进行比较时，尽量使用严格的操作，避免不必要的类型转换。严格比较主要有 `===` `Object.is()` 两种，它们的不同之处是对待 `NaN` 和 `-0` `+0` 的区别。还有一种语言内部使用的 `SameValueZero`  算法，`NaN === NaN, +0 === -0` 它主要用于确定值的唯一性。
