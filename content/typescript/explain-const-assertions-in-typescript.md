---
title: "[TypeScript] const assertions 的用法介绍"
date: 2020-10-14T17:43:26+08:00
keywords: ["const assertions", "typescript assertions", "const 断言", "提取对象属性类型", "infer keyword in typescript", "extract property typing from object", "typescript for beginners", "learn typescript", "static type check", "dive into typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---

最近写代码的时候，遇到一个类型定义的问题，有一段类似下面这样的代码：

```typescript
const tabs = [
  { id: 1, value: 'foo' },
  { id: 2, value: 'bar' },
]
```

 `tabs`  是常量，里面的内容有可能会有变化，后面需要使用到 `value` 的类型，又不想单独写一个类型定义，这样 `tabs` 的内容变化，类型定义也需要修改，但是这个类型定义只会被 `tabs` 用到。最理想的办法是利用类型推断直接从 `tabs` 中提取 `value` 的类型：`'foo' | 'bar'` 。尝试写了一个类型方法把 `value` 的类型提取出来：

```typescript

type getPropertyTypeOfArrayObject<T extends unknown, K extends string>= T extends Array<{[k in K]: infer R}> ? R : never;

const T1 = [
  { id: 1, value: 'foo' },
  { id: 2, value: 'bar' }
]

const T2 = [
  { id: 1, value: 'foo' },
  { id: 2, value: 3 },
]

type V1 = getPropertyTypeOfArrayObject<typeof T1, 'value'>; // string
type V2 = getPropertyTypeOfArrayObject<typeof T2, 'value'>; // string | number

```

`getPropertyTypeOfArrayObject` 的作用是从一个对象数组中，根据传入属性，返回属性在对象中的类型。我们定义了两个不同的值 T1 和 T2，`value` 值分别有点不一样，可以看到的是返回的是更加宽泛的类型 `string` 和 `number` ，而不是我们想要的字面量类型 `'foo' | 'bar' ` 和 `'foo' | 3 ` 。要解释这个问题，我们需要先简单了解一下 `TS` 中 `字符串字面量` 类型是如何使用的，以及是如何对其进行扩展的。

## 字符串字面量类型

这个 [PR](https://github.com/Microsoft/TypeScript/pull/5185) 详细地介绍了 TS 对字符串字面量的支持。所谓字符串字面量类型就是类型的文本跟字符串的值是一模一样的，也就是说 `'foo'`  的字面量类型就是 `'foo'` ，既然是字符串，所以它也是 `string` 的子类型。

## 类型扩展

为了提高开发体验，TS 能够自动从上下文推断出一些明显的类型，而不需要编程人员手动指定每一个类型。
例如：

```typescript

let t1 = 'foo'; // string
const t2 = 'bar'; // 'bar'
let t3: 'foo' = 'foo'; // 'foo'

// { id: number, name: string }
const t4 = {
    id: 1,
    name: 'baz',
} 
t4.id = 2;

```

从上面的例子可以看出，除非显示定义了类型，对于 `let` 声明的变量，会被推断为 `string` ，对于 `const` 声明的原始类型值， TS 能够识别到其是不能改变的，就会被推断为更严格的类型 `foo` ，而对于 `const` 声明的复杂类型值，里面的属性值的类型同样被扩展了，因为对象的属性值是可以进行更改的。

再回到上面的例子中，为了获得 `T1` 的类型，我们使用了 `typeof` 进行类型查找：

```typescript

const T1 = [
  { id: 1, value: 'foo' },
  { id: 2, value: 'bar' }
]

// { id: number, value: string }[]
type tt1 = typeof T1; 
```

这跟类型扩展的机制是一样的。为了得到更精确的 `id value` 的类型，我们还有另外一种方法，就是类型断言：

```typescript
const T1 = [
  { id: 1 as 1, value: 'foo' as 'foo' },
  { id: 2 as 2, value: 'bar' as 'bar' }
]
/**
({
    id: 1;
    value: "foo";
} | {
    id: 2;
    value: "bar";
})[]
*/
type tt1 = typeof T1;
```

很显然这种方法很不友好，要写大量繁琐的断言，那么有没有一种方法可以让我们一次性对整个值进行断言呢？这就是 `TypeScript 3.4` 引入的[const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions) 。

## const assertions

`const` 断言顾名思义也是一种类型断言方式，不同于断言到具体的类型 `'foo' as 'foo'`，它的写法是 `'foo' as const` 或者 `{ value: 'foo' } as const` 。

它主要有以下特性：

	1. `string number boolean`  字面量类型都不会被扩展；
	2. 数组字面量会变成只读的元组；
	3. 对象字面量的属性会变成只读的；

```typescript
/**
{
    readonly name: "foo";
    readonly age: 12;
}
*/
const readonlyObj = { name: 'foo', age: 12 } as const

/**
readonly [1, "foo", "bar"]
*/
const readonlyTuple = [1, 'foo', 'bar'] as const;

```

我们回头修改一下之前的代码：

```typescript
type getPropertyTypeOfArrayObject<T extends unknown, K extends string> = T extends Readonly<Array<{[k in K]: infer R}>> ? R : never;

const T1 = [
  { id: 1, value: 'foo' },
  { id: 2, value: 'bar' }
] as const;

// type V1 = "foo" | "bar"
type V1 = getPropertyTypeOfArrayObject<typeof T1, 'value'>; 

// type V2 = 1 | "foo" | 2 | "bar"
type V2 = getPropertyTypeOfArrayObject<typeof T1, 'value' | 'id'>;
```

需要注意的是 `getPropertyTypeOfArrayObject` 也做了一些修改，因为 `const assertions` 会把对象变成只读的，我们要使用内置的 `Readonly` 方法把条件语句的对象也变成只读的才会得到真值，从而推断到指定的属性值类型。

使用这个工具方法，结合 `const assertions` 我们就可以提取到指定的属性值类型。

基于 `const assertions` 的强大功能，推断出来的值都是确定的，我们不需要显式地声明更多定义来进行类型推断：

```typescript
// Works with no types referenced or declared.
// We only needed a single const assertion.
function getShapes() {
  let result = [
    { kind: "circle", radius: 100 },
    { kind: "square", sideLength: 50 }
  ] as const;

  return result;
}

for (const shape of getShapes()) {
  // Narrows perfectly!
  if (shape.kind === "circle") {
    console.log("Circle radius", shape.radius);
  } else {
    console.log("Square side length", shape.sideLength);
  }
}
```

以上就是 `const assertions` 的用法和一些使用的场景。