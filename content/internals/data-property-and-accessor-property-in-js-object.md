---
title: "重新学习 JS 对象的数据属性和访问器属性"
date: 2019-10-03T00:10:36+08:00
draft: true
keywords: ["JavaScript Object", "data property", "accessor property", "ES6"]
tags: ["JavaScript", "Internals"]
categories: ["技术分享"]
author: "Meowu"
---

在第一次看《JavaScript 高级程序设计》的时候就已经知道了数据属性和访问器属性这两个东西，但是对它们具体有什么区别比较模糊，今天在研究 `TS` 和 `Babel` 编译到 JS 的代码时又遇到它们，就趁这个机会又重新看了一遍。
在 `JS` 中对象(Object) 本质上只是一些属性 (property) 的集合，属性名使用键值来表示，键值必须是一个 `string` （甚至空字符串） 或者 `symbol`  类型，属性的值可以是任意 JS 类型或者用户自定义类型。
## 属性类型
基于属性的特性，我们可以把属性分类两种类型：
### 数据属性（data property）
根据 `ECMA-262` 的定义，语言内部使用以下 `特性` 来描述一个 `数据属性`  ：

1. `[[Value]]` ：读取属性得到的值，或者写入值的地方。
2. `[[Writable]]`：如果为 `false` ，尝试改变属性的值会失败。
3. `[[Enumerable]]`： 如果设为 `true` ，该属性能够被 `for-in`  和 `Object.keys()`  获取到；否则是不可枚举的。
4. `[[Configurable]]`：如果为 `false` ，则不能删除该属性，也不能将其改为一个访问器属性；如果 `writable = true`  就可以改变它的 `[[value]]` ，并且可以重新定义 `{ writable: false}` 。意味着如果一开始 `{configurable: false, writable: false}` 那么这个属性不能做任何更改。

### 访问器属性（accessor property）
语言内部使用以下 `特性` 来描述一个 `访问器属性` ：

1. `[[Get]]`：它必须是一个函数，会以一个空的参数列表来调用函数内部的 `[[Call]]`  方法。每次获取该属性都会调用它。
2. `[[Set]]` ：同样必须是一个函数，会以将要设置的值作为唯一的参数调用函数内部的 `[[Call]]`  方法。写入属性时会调用它。
3. `[[Enumerable]]` ：跟数据属性一样。
4. `[[Configurable]]` ：类似，如果为 `false` ，不能删除，也不能将其改为数据属性，也不能修改它的其它特性。

## 定义属性
我们可以通过 `Object.defineProperty(obj, key, descriptors)` 来定义一个数据属性或者访问器属性：
```js
const obj = {};
Object.defineProperty(obj, 'age', {
    value: 18, writable: true
})
```
对于上面的属性描述符，如果没有显式指定，它们的默认值分别时：
```js
[[Value]] = undefined;
[[Get]] = undefined;
[[Set]] = undefined;
[[Writable]] = false;
[[Enumerable]] = false;
[[Configurable]] = false;
```
可以通过 `Object.getOwnPropertyDescriptor(o,  key)` 来得到属性描述符：
```js
Object.getOwnPropertyDescriptor(obj, 'age')
// {value: 18, writable: true, enumerable: false, configurable: false}
```
如果是通过对象字面量定义的数据属性，则 `writable, configurable, enumerable` 的默认值都是 `true` ：
```js
obj.foo = 'foo'
Object.getOwnPropertyDescriptor(obj, 'foo')
// {value: "foo", writable: true, enumerable: true, configurable: true}
```
## 使用 defineProperty
### Vue
`vue` 在定义响应式属性的时候就是通过 `Object.defineProperty()` 定义访问器属性来实现的，拦截属性的 `get` `set` 进行依赖收集或者触发更新。
```js
function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function, 
  shallow?: boolean
) {
  const dep = new Dep()
  const property = Object.getOwnPropertyDescriptor(obj, key)
  // 是否是不能更改的属性。
  if (property && property.configurable === false) {
    return
  }

  // 用户可能预先定义的 getter setter。
  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()  // 依赖搜集
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      if (newVal === value || (newVal !== newVal && value !== value) /* NaN */) {
        return  // 值不变什么也不做；
      }
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      // 没有定义了 setter 的话，值设置了也不做任何改变；
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal // 更新 val 值；
      }
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}
```
### babel
`babel` 在编译 `ES Class` 的公有类字段时是通过定义`数据属性`实现的，这也是 `TC39` 的 [proposal-class-fields](https://github.com/tc39/proposal-class-fields#public-fields-created-with-objectdefineproperty) 的要求：
```js
"use strict";

function _instanceof(left, right) {
  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;;
  }
}

function _classCallCheck(instance, Constructor) {
  if (!_instanceof(instance, Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var Obj = function Obj() {
  _classCallCheck(this, Obj);
  _defineProperty(this, "name", 'foo');
  console.log('super-constructor');
};
```
## One more thing
除了使用 `Object.defineProperty` ，`ES6` 之后我们还可以使用反射方法 `Reflect.defineProperty`  来定义属性，它接收跟前者同样的参数类型，不同的是如果前者如果定义失败会抛出异常，比如重新定义属性的 `configurable = false` 的 `getter` ，我们需要使用 `try...catch...` 来捕获它，而后者返回的是一个 `Boolean` 表示是否定义成功：
```js
const obj = {};
const success = Reflect.defineProperty(obj, 'name', {value: 'Joi'}); // true
if (success) {
  console.log(obj.name) // 'Joi'
} else {
  ...
}
```
