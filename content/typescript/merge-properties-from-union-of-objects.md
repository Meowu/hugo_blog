---
title: "[TypeScript] 如何合并联合类型中多个对象的属性"
date: 2023-01-28T16:23:27+08:00
keywords: ["typescript", "intersection-types 交叉类型", "merge union object", "keyof", "union 联合类型", "advanced-types", "learn typescript", "static type check", "dive into typescript 深入 typescript"]
tags: ["TypeScript", "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---

最近遇到一个场景，根据一个较复杂的数组类型来生成一个新的对象类型，我利用[条件类型](/typescript/infer-keyword-in-typescript/)把数组类型中的数据提取出来后产生了[联合类型](/typescript/intersection-and-union-types/)，接着需要从多个对象联合类型再转换成单个对象类型，于是就有了这篇文章，简单记录一下如何把联合类型中的多个对象合并成一个对象。

假如现在我们有一个联合类型是这样的：

```typescript
  type UnionObject = { x: 1, y: 2 } | { x: 'a', z: 'c' }
```

一开始我写的工具类型是下面这样的：

```typescript
  type OfUnion<T> = T extends Record<infer U, any> ? {
      [P in U]: T[P]
  } : never
  type UU = OfUnion<UnionObject>
```

我这里有点想当然了，因为采用了 `extends` 条件类型，返回的结果也会是一个联合类型，实际上做了无用功，得到的还是原来的类型。

既然是转换成一个对象类型，首先看下如何定义一个对象类型：

```ts
   // 知道 prop name
   type obj1 = { a: number }

   // prop name 未知
   type obj2 = { [prop: PropertyKey]: number }

   // 从泛型参数中提取 key
   type obj3<T> = {
    [key in keyof T]: T[key],    
   }
```

这里不能直接把联合类型作为泛型参数传给 `obj3` ，因为 `keyof` 是作用在对象上的，恰好我们处理的是一个对象的联合类型，那么就可以使用条件类型来对其进行分解，实现一个提取所有 key 的类型方法：

```ts
  type UnionKeys<T> = T extends unknown ? keyof T : never;

  type KK = UnionKeys<UnionObject> // "y" | "x" | "z"
```

`UnionKeys<T>` 方法返回的是我们的 _union object_ 的 key 的联合类型。到这里完成了第一步，提取到了所有的 _key_ ，把上面的 `obj3<T>` 做一下修改，跟 `UnionKeys<T>` 结合起来：

```ts
  type OfUnion<T> = {
    [P in UnionKeys<T>]: unknown
  }
```

接下来就是计算每个属性所对应的值的类型。现在已经有了泛型 `T` 以及代表每个 _key_ 值的 `P` 参数，通过这两个我们就可以拿到每个 `P` 所对应的值的类型，我们定义一个方法 `UnionValues<T, K>`来 _从联合类型 T 中提取指定的 P 的值_ ，这里需要用到条件类型中的 [infer](/typescript/infer-keyword-in-typescript/) 。

```ts
   type UnionValues<T, K extends PropertyKey> = T extends Record<K, infer U> ? U : never;

   type V1 = UnionValues<T, 'z'> // 'c'
```

`PropertyKey` 是标准库提供的，它的类型是 `string | number | symbol` ，通用的对象属性的类型。我们已经拿到了具体的 `P` 的值，同样这里使用条件类型对 `T` 进行分解，结合 `infer` 就可以由编译器帮我们推断在 `T` 的每个 _object_ 里 `P` 所对应的值的类型。把上面的代码整合起来：

```ts
  /** 
   * @author: Meowu
   * @source: fullstackbb.com
  */

  type UnionKeys<T> = T extends unknown ? keyof T : never
  type UnionValues<T, K extends PropertyKey> = T extends Record<K, infer U> ? U: never;
  type OfUnion<T> = {
      [P in UnionKeys<T>]: UnionValues<T, P>
  }

  type UnionObject = { x: 1, y: 2 } | { x: 'a', z: 'c' }

  type V1 = OfUnion<UnionObject> // { x: 1 | "a"; y: 2; z: "c"; }
```

这里我们就成功地把 `Union` 类型中的全部 _object_ 合并成一个 _object_ 。代码可以直接点击这个 [链接](https://www.typescriptlang.org/play?#code/FAFwngDgpgBAqgOwJYHsEGkpgM4B4AqAfDALwz4xQAeIUCAJtjAK4IDWCKA7gjAPww2WFADNyMAFwwEUAG5QATqEixEqBADUAhgBtmUPPgA0MdJRp1GMAAoKU0BeExhiZCtVoMmAJSgBjFAV6XHQTJAQRRXhiATgpGXkFAG5laBgAeRE1NAJXGABvYBhimABtaxhw+GQ0Z0NCAF0pbM1dfUMTa0JgAF9gVNUahHSAIwArfxBSApgqKQBGEzApACYYHpgAHxm5mAByLT2TAC8pPb899f7wNI156cyW3BbRib8QbqA) 在官方 Playground 上查看。

### 总结

在整个转换的过程中主要涉及到以下技术点的使用：

1. Union 类型
2. 标准库内置类型：`Record`, `PropertyKey`
3. 条件类型和 `infer` 的使用
4. `keyof`, `in` 操作符

