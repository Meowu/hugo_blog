---
title: "[Typescript] never 类型的分析和使用"
date: 2020-03-14T21:34:15+08:00
keywords: ["typescript", "never type", "void type", "basic type", "TypeScript 的 never 类型", "typescript for beginners", "learn typescript", "static type check", "dive into typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
draft: true
---

从 [TypeScript 2.0](https://github.com/Microsoft/TypeScript/pull/8652)起引入了 `never` 类型，它作为 TS 中的[Bottom Type](https://en.wikipedia.org/wiki/Bottom_type)用来表示当前不能返回值。它跟我们之前介绍过的 [void 类型 ](https://fullstackbb.com/typescript/void-type-in-typescript/) 的区别在于，`void` 表示的是返回为空（`undefined`），实际上是有返回值的，而`never`表示的是永不返回。

## never 的特性

`never` 主要有以下一些特性：

1. 在**函数表达式**或者**箭头函数**中，如果一个函数没有显式定义返回类型，它也没有 `return` 语句，或者说 `return` 的类型是 `never` ，并且该函数没有执行完毕时，它的返回类型会被推断为 `never` 。
2. 
```typescript
const error = (msg) => throw new Error(msg); // never

const fail = () => error('failed here.'); // never

// never
const infiniteLoop = () => {
  while (true) {}
}

const exit = () => {
  process.exit();
}
```
2. 它是任何类型的子类型，所以可以指派在任何需要其它返回值的地方，然而任何类型都不是它的子类型，所以只有 `never` 才能指派在需要 `never` 的地方。
```typescript
const v1: never = 1; // error
const v2: number = fail(); // ok

// 因为 never 可以指派给任何类型
const test = (cb: () => string) => {
  const str = cb();
  return str;
}
test(() => "of course"); // ok
test(error('oops.')); // yes
test(fail()); // ok
```
3. 如果一个函数显式定义了返回 `never` 类型，那么它所有的 `return` 语句只能返回 `never` ，如果没有 `return` 语句，函数也必须是无法正常结束的。这跟「只有 never 才能指派给 never」这个条件也是吻合的。
```typescript
// Type '1' is not assignable to type 'never'.
function f1(): never {
    return 1;
}

// A function returning 'never' cannot have a reachable end point.
function f2(): never {
  // ...
}

```
4. 在做条件语句分析时，在一个永远不可能为 true 的分支中，类型会被推断为 `never` 或者返回值必须是 `never` 。
```typescript
function f4(x: A | B) {
  if(isA(x)) {
  } else if(isB(x)) {
  } else {
    x; // appears as type 'never'
  }
}

function foo(x: string | number): boolean {
  if (typeof x === "string") {
    return true;
  } else if (typeof x === "number") {
    return false;
  }
  return fail();
}
```
在 `f4` 的 `else` 条件分支中，`x` 的类型将会被推断为 `never`。而对于 `foo` 函数，如果我们想要函数的返回类型是 `boolean`， 我们在最后一个 `return` 语句必须返回 `never` 类型或者 `boolean` 类型，否则将会出现跟 `boolean`类型不匹配的错误。由此可以看出， _**当我们想要编译器不捕获当前值或者类型时，我们可以返回 `never` 类型**_ 。
5. 类型 `T` 和 `never` 的联合类型是 `T` ，而它们的交叉类型则是 `never` 。
```typescript
type t1 = string | number;
type t2 = t1 & never; // never;
type t3 = t1 | never; // string | number;
```

## 使用 never
大多数情况我们并不需要手动定义 `never` 类型，只有在写一些非常复杂的类型和类型工具方法，或者为一个库定义类型等情况下才需要用到它，从 `TypeScript` 的标准库等一些类型方法中我们可以略窥一二。
```typescript
/**
 * Exclude from T those types that are assignable to U
 */
type Exclude<T, U> = T extends U ? never : T;

/**
 * Extract from T those types that are assignable to U
 */
type Extract<T, U> = T extends U ? T : never;

/**
 * Exclude null and undefined from T
 */
type NonNullable<T> = T extends null | undefined ? never : T;
```
记住我们前面说的那句话， _**当我们想要编译器不捕获当前值或者类型时，我们可以返回 `never`类型**_ 。从这几个方法可以明显地体现出来，当它们想要捕获一些类型并且忽略其它类型等，就在要忽略的地方返回 `never` 类型，也就是**这里不返回任何东西**。
基于上面的特性5，我们可以利用 `never` 来做一些更复杂的事情：
```typescript
type Diff<T extends string, U extends string> =
  ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];
type Foo = { a: string, b: number, c: boolean };
type FooWithoutB = Pick<Foo, Diff<keyof Foo, 'b'>>;
// equivalent to { a: string, c: boolean }
```
该类型方法接受两个字符串的联合类型 `T` 和 `U`，返回一个包含所有存在 `T` 中但同时不存在 `U`中的值的联合类型。

## 一点注意
在上面的特性1中，我着重强调了是**函数表达式**和**箭头函数**，因为在函数声明中，假如我们不显式定义返回类型是 `never` 的话，实际上它将会被推断为 `void` 类型：

![never-type-inferred-as-void](/images/never-inferred-as-void.png)

至于为什么会这样，`TypeScript` 的核心开发者 Ryan 在 [Stack Overflow](https://stackoverflow.com/questions/40251524/typescript-never-type-inference) 做了很详细的解答。

### 参考
 [TypeScript never type inference - Stack Overflow](https://stackoverflow.com/questions/40251524/typescript-never-type-inference)

https://mariusschulz.com/blog/the-never-type-in-typescript

https://github.com/microsoft/TypeScript/issues/3076

https://github.com/microsoft/TypeScript/pull/8340

https://github.com/Microsoft/TypeScript/pull/8652

https://github.com/microsoft/TypeScript/issues/23005

[What is the difference between never and void in typescript? - Stack Overflow](https://stackoverflow.com/questions/37910669/what-is-the-difference-between-never-and-void-in-typescript)
