---
title: "[Typescript] 使用 unknown 类型代替 any 类型"
date: 2020-05-20T23:56:15+08:00
keywords: ["typescript", "unknown type","unknown type replace any type", "any type", "basic type", "TypeScript top type", "typescript for beginners", "learn typescript", "static type check js", "dive into typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---

## 普通类型定义
通常情况下，我们可以像下面这样进行类型定义，我们明确传进来的是什么，以及输出的是什么。

```typescript
const sum = (a: number, b: number): number => a + b;
const upperCase = (a: string) => a.toUpperCase();
const toString = (a: number | string): string => '' + a;
```

但是也会有些情况，我们事先并不知道可能传进来的是什么类型，又或者说我们允许用户传进来任何类型，通常我们会使用 `any` ：

```TypeScript
const doSomething = (val: any) => {
  val(); // no error
  val.foo.bar; // no error
}
```

## any 的问题

`any` 是类型系统提供给我们的一个妥协方案，在无法确定当前类型时就使用 `any` 类代码，它可以赋给任何类型值，也可以接受任何类型值：

```TypeScript
let T23: any;
T23 = 66;
T23 = '44';
T23 = [1];

declare let v1: string;
declare let v2: number;
declare let v3: boolean;
declare let v4: number[];
declare let T24: any;

v1 = T24;
v2 = T24;
v3 = T24;
v4 = T24;

```

使用 `any`  替代之后，这样我们就失去了类型检查的作用，在可能出错的地方也不会发现错误。

```typescript
let T1: any;
T1(); // no error
T1.pop(); // no error
```

而且使用 `any`  还会造成类型污染的问题，`any` 类型的对象会导致后续的属性类型都会变成 `any` ：

```TypeScript
let user: any = {
  avatar: {
    url: '/user-1.png'
  }
};
let avatar = user.avatar; // any
let url = avatar.url; // any
```

## unknown 的引入

失去了类型检查作用之后，TS 不会在开发或者编译时提示哪里可能出错，我们需要自己很小心地做条件判断。既然我们选择了使用 TS，那么在开发中就尽量避免使用 `any` ，以便 TS 能够帮助我们做更多的事情，减少开发的心智负担。

所以从 `TypeScript 3.0` 起就引入了一个新的基础类型 `unknown` 作为一个类型安全的 `any` 来使用。任何类型的值都可以赋给 `unknown` 类型，但是 `unknown` 类型的值只能赋给 `unknown` 本身和 `any` 类型。

```TypeScript
let T23: unknown;
T23 = 66;
T23 = '44';
T23 = [1];

declare let v1: string;
declare let v2: number;
declare let v3: boolean;
declare let v4: number[];
declare let v5: any;
declare let T24: unknown;

v1 = T24; // error;
v2 = T24; // error;
v3 = T24; // error;
v4 = T24; // error;
v5 = T24; // ok;
```

_如果要把 `unknown` 类型值赋给 `unknown` 或者 `any` 之外的其它类型，或者对 `unknown` 类型执行方法调用或者属性读取之类的操作，都必须先使用条件控制流或者类型断言来收窄 `unknown` 到指定的类型_ ：

```TypeScript

// any 类型
const doSomething = (val: any) => {
  // 没有断言，都不报错
  val();  
  val.foo.bar; 
}

const doSomething = (val: unknown) => {
  if (typeof val === 'function') {
    val(); // 条件分析，类型收窄到 Function，调用不报错；
  }
  // 没有断言，报错
  val.foo.bar;
  x[0];
  x();
}

```

## 联合类型和交叉类型中的 unknown
因为任何类型都可以赋给 `unknown` ，相当于 `T extends unknown -> true` ，反之不然，联合类型取最大集合，任何类型和 `unknown` 类型的联合类型都会得到 `unknown` ：

```TypeScript

type U1 = unknown | null; // unknown
type U2 = unknown | undefined; // unknown
type U3 = unknown | number; // unknown
type U4 = unknown | boolean; // unknown
type U5 = unknown | string[]; // unknown
type U6 = unknown | any; // any

```

在交叉类型中，取最小集合，能够赋值给 T 的一定能够赋给 `unknown` ，但是能够赋给 `unknown` 的不能赋给 `T` ，所以任何类型 T 跟 `unknown` 的交叉类型都会得到 `T` 。

```TypeScript
type U7 = unknown & null; // null;
type U8 = unknown & undefined; // undefined;
type U9 = unknown & number; // number;
type U10 = unknown & boolean; // boolean;
type U11 = unknown & string[]; // string[]
type U12 = unknown & any; // any;
```

因为 `unknown <-> any`  时可以互相赋值的，在这两个例子中 `unknown & any `  和 `unknown | any` TS 编译器都推断为 `any`  是为了更好的向后兼容性。

## 收窄 unknown 类型
TS 强制我们在进一步确认 `unknown` 的类型之前无法对其进行任何操作。

通过 `typeof`  `instanceof`  以及定义的类型断言等方法可以把 `unknown` 缩小到执行的类型，从而执行合法的操作。

```TypeScript
declare function isFunction(x: unknown): x is Function;

class Animal {
  constructor(public legs: number) {}
}

class Bird extends Animal {
  fly() {}
}

function isNumberArray(x: unknown): x is number[] {
  return Array.isArray(x) && x.every(v => typeof v === 'number');
}

function f22(x: unknown) {
  if (typeof x === 'string') {
    return x.toUpperCase();
  }

  if (isFunction(x)) {
    return x();
  }

  if (isNumberArray(x)) {
    return x.map(n => n ** 2);
  }

  if (x instanceof Bird) {
    return x.fly();
  }
}

```

## unknown 类型上的运算符
由于 JS 的弱类型特点，我们进行运算时，如果不是数字类型，内部会根据一定的规则转换到数字类型。

对于 `unknown` 类型，在没有进行类型收窄时，TS 强制我们只能对其执行等比较操作符，而不能执行加减乘除等运算。

```TypeScript
function f10(x: unknown) {
    x == 5;
    x !== 10;
    x >= 0;  // Error
    x + 1;  // Error
    x * 2;  // Error
    -x;  // Error
    +x;  // Error
}
```


## Reference

1. https://github.com/microsoft/TypeScript/pull/24439
2. https://github.com/microsoft/TypeScript/issues/10715
https://github.com/microsoft/TypeScript/issues/9999
3. [Mixed Types | Flow](https://flow.org/en/docs/types/mixed/)