---
title: "[TypeScript] Omit 和 Exclude 类型的区别与用法"
date: 2022-03-31T23:34:15+08:00
keywords: ["typescript", "omit", "exclude", "basic type", "typescript for beginners", "learn typescript", "static type check", "dive into typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---

从 [TypeScript 2.8](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#predefined-conditional-types) 起标准库引入了 `Exclude` 帮助类型， [TypeScript 3.5](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-5.html) 引入了 `Omit` 帮助类型。

最近在尝试使用 `Omit` 从一个枚举中提取它的类型子集时得不到预期的结果：

```typescript
enum methods {
  get = 'get',
  put = 'put',
  delete = 'delete',
}

type p1 = Omit<methods, methods.get>
```

看了一下 `p1` 的定义发现它是这样的：

```typescript
type p1 = {
    [x: number]: string;
    [Symbol.iterator]: () => IterableIterator<string>;
    toString: () => string;
    charAt: (pos: number) => string;
    charCodeAt: (index: number) => number;
    concat: (...strings: string[]) => string;
    ... 37 more ...;
    padEnd: (maxLength: number, fillString?: string | undefined) => string;
    ...
}
```

显然这是一个对象类型，我期望的是 `p2 = 'put' | 'delete'`， 当使用 `Exclude` 时就能得到想要的结果：

```typescript
type p2 = Exclude<methods, methods.get>

// equal to =
type p2 = methods.put | methods.delete
```

于是去研究了一下这两个方法类型。它们在标准库中的定义如下：

```typescript
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

type Exclude<T, U> = T extends U ? never : T;
```

文档中对于 `Exclude<UnionType, ExcludedMembers>` 的解释是从 `UnionType` 排除所有在`ExcludedMembers` 中的联合类型 。顾名思义，`Exclude` 的第一个参数是一个联合类型，

而 `Omit<Type, Keys>` 的解释是：取 `Type` 的全部属性然后移除其中的 `Keys` 。

**_也就是说 `Exclude` 是用在联合类型上的，而 `Omit` 是用在对象类型或者 `interface` 上的。`Omit` 的内部使用了 `Exclude` 来取 `Keys` 。_**

```typescript
type T1 = {
    a: 'a',
    b: 'b',
}

type p3 = Omit<T1, 'a'> // { b: 'b' }

type T2 = 'a' | 'b'

type P4 = Exclude<T2, 'a'> // 'b'
```

前面我在枚举中使用 `Omit` 时，枚举会被当成一个对象，事实上枚举编译后也确实是一个对象。而对枚举使用 `Exclude` 时，枚举值会被当成一个联合类型，从而能够得到期望的类型。同理，在非联合类型上使用 `Exclude` 也没有意义。

