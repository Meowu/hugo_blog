---
title: "[TypeScript] void 类型"
date: 2020-03-04T20:43:55+08:00
keywords: ["typescript", "void type", "never type", "basic type", "TypeScript 空白类型", "typescript for beginners", "learn typescript", "static type check", "dive into typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---

## void
对于 `TypeScript` 中的其它基本类型如 `number` `string` `boolean` 都很好理解，`void` 的用法就有点特别。
我们最常见的就是在一个不返回任何值的函数中，它的返回类型会被推断为 `void` ：

```typescript
const f = () => {
  console.log('return nothing')
}
const v = f(); // inferred v: void
```

简单地说： `void` 表示不返回任何东西。我们可以把 `void` 看作是 `any` 的相反类型，因为 `any` 表示可以任何类型值。

虽然它也是一个类型，但在 `TS` 中给一个变量显式定义 `void` 类型是没有任何意义的，这样的话我们只能给该变量赋值为 `undefined` 或者 `null` （关闭 `—strictNullChecks` 的情况下），正如我们通常也不会特意去定义一个变量为 `undefined` 。

```typescript
let a: void = undefined; // no need.
a = null; // if --strictNullChecks disabled.
```

在 `JavaScript` 中，没有显式返回任何值的函数默认返回 `undefined` ，这样正好跟只有 `undefined` 才能赋值给 `void` 类型的规则契合。

### 使用 void 类型

前面说通常不会显式给一个变量定义 `void` 类型，在某些情况下手动指定 `void` 类型还是有用的，比如对于 `this` 值。

对于`TypeScript` 中的函数或者方法的 `this` ，它的默认类型都是 `any` ，从 `TypeScript 2.0` 开始，我们可以显式指定 `this` 的类型，它作为一个伪参数出现在函数参数列表的第一位：

```typescript
function f(this:void) {
  this.o = 0; // Property 'o' does not exist on type 'void'.
}
```

在一个全局定义的独立函数中，它的 `this` 值默认值是 `global` ，在这个函数内使用 `this` 是没有任何意义的，所以我们可以显式定义 `this: void` 表示这里不需要使用 `this` 。

来看一个更具体一点的[例子](https://www.typescriptlang.org/docs/handbook/functions.html#this)：

```typescript
// come from typescript release note.

interface UIElement {
    addClickListener(onclick: (this: void, e: Event) => void): void;
}

class Handler {
    info: string;
    onClickBad(this: Handler, e: Event) {
        // oops, used `this` here. using this callback would crash at runtime
        this.info = e.message;
    }
}
let h = new Handler();
uiElement.addClickListener(h.onClickBad); // error!
```

在上面的这里例子中，调用 `addClickListener` 方法的是 `UIElement` 的实例，它的 `this` 值指向的是该实例，而 `onclick` 方法作为一个回调函数传进来，会丢失它自身真正的 `this` ，所以在 `onclick` 的类型定义中显式把 `this` 定义为 `void` ，告诉使用者不能在传给 `addClickListener` 的回调函数中使用 `this`，否则会报错。 
