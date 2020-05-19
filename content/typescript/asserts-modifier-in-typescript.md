---
title: "[TypeScript] asserts 修饰词的使用"
date: 2020-03-19T12:04:57+08:00
keywords: ["asserts modifier", "asserts keyword", "typescript3.7", "type guard", "TypeScript 的 asserts 修饰符", "typescript for beginners", "learn typescript", "static type check", "dive into typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---

在 nodejs 的代码中，我们经常可以看到 `assert` 的使用，例如在调用方法或者获取属性之前进行断言，如果不通过则抛出异常，这样可以确保我们后面的代码是安全执行的。

```JavaScript
const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
}
const toUpper = val => {
    assert(typeof val === 'string')
    return val.toUpperCase()
}
```

这是纯粹的 `JavaScript` 代码，它存在一个潜在的问题就是，假如我们手误把 `toUpperCase` 写成了 `toUppercase` 也不容易察觉，因为没有类型，编辑器不会给我们实时的提示，编译的时候也不会报错，这就是为什么我们有必要使用 `TypeScript` 。

如果使用了 `TS` ，编译器知道 `toUpperCase` 是字符串特有的方法，同时字符串类型也不存在一个 `toUppercase` 方法，当发生错误时编辑器就可以及时提示我们，并且编译也不会通过。

既然这样，那么在编译到 `return val.toUppercase()` 这一行时，就需要知道此时 `val` 的类型是 `string` 。要让编译器知道此时 `val` 的类型是 `string` ，通常有以下方法：

```TypeScript
// 1. 显示定义它的类型为 string
const toUpper1 = (val: string) => {
    return val.toUpperCase();
}

// 2. 类型强制转换
const toUpper2 = (val: unknown)=> {
    return (val as string).toUpperCase()
}

// 3. 编译器通过代码分析推断出类型
const toUpper3 = (val: number | string) => {
  if (typeof val === 'number') {
      // ...
  } else {
      return val.toUpperCase();
  }
}
```

以上三种方法都可以通过编译，因为我们要说的是跟断言相关的，这里主要看第三种。

TS 在编译时，会进行[控制流分析（control flow analysis）](https://github.com/Microsoft/TypeScript/pull/8010)，能够根据上下文推断出每个条件分支值的类型。上面第三个例子中，我们定义的 `val` 的类型有两种可能：`string` 和 `number` 。在条件语句中根据不同的类型执行不同的操作，这让我们可以准确地知道 `else` 分支中，`val` 的类型是 `string` 并且它可以使用 `toUpperCase` 方法，如果发现 typo ，编辑器会及时地给我们发出警告：

![typo-toUppercase](/images/typo-toUppercase.png)

这实际上就是 `TypeScript` 中的[类型守卫(type guard)](https://fullstackbb.com/typescript/type_guards_and_type_assertions/)。
在类型守卫中，除了 `typeof` `instanceof` 等内置的判断语句，我们还可以通过类型 **预设(type predicates)** 来自定义类型保护。 它的语法是在函数的返回类型中以 `T is xxx` 的形式把 `T` 的类型收窄为类型 `xxx`。 

```typescript
class Animal {
   public run() {}
}

class Dog extends Animal {
  public bark() {
    console.log('bark.')
  }
}

class Cat extends Animal {
  public meow() {
    console.log('meow.')
  }
}

function isCat(lucky: Dog | Cat): lucky is Cat {
  return 'meow' in lucky;
}

const animalVoice = (animal: Dog | Cat) => {
  if (isCat(animal)) {
    animal.meow();
  };
}

const cat = new Cat();
animalVoice(cat); // meow.

```

在上面的代码中我们通过定义一个自定义的类型保护，可以让我们很好地在条件语句中获得准确的类型。但是它有一个不好的地方就是，类型预设必须结合条件判断语句才能获取知道当前的类型，要是我们能够写成这样：

```typescript

const animalVoice = (animal: Dog | Cat) => {
    assertCat(animal);
    animal.meow();
}

```

此时我们依然可以推断出准确的类型，这种写法具备获得像 `assert` 函数那样的表现力，不仅可以使代码更简洁，符合直觉，同时使旧的代码更加容易迁移到 TS。

从 [TypeScript 3.7](https://github.com/microsoft/TypeScript/pull/32695) 起，新增的 `asserts` 修饰符语法可以让我们获得这种强大友好的特性。

## asserts 修饰符

`asserts` 并不是一个断言函数，它只是一个修饰符，以 `asserts value` 、`asserts T is xxx` 的形式来确定函数的返回类型，只有 `asserts` 后面的表达式（ `value` 或者 `T is xxx` ）为真(truthy)值，才会正常返回，否则将会抛出异常，终止当前代码的运行。
有了这个强大的特性，我们的断言语句就可以像下面这样写：

```typescript

function assert(value: unknown, message?: string): asserts value {
  if (!value) {
    throw new Error(message);
  }
}

function assertNonNull<T>(obj: T): asserts obj is NonNullable<T>{}

function assertNumberArray(value: unknown): asserts value is number[] {
  if (!((value as any[]).every(item => typeof item === 'number'))) {
    throw new Error();
  }
}

function f1(n: number | string): number {
  assert(typeof n === 'string');
  return n.length; // 执行到这里 n 一定是 string 类型。
}

function f2(n: unknown) {
  assertNumberArray(n);
  return n[0] ** 2; // n => number[]
}

function f3(n: null | string) {
  assertNonNull(n);
  return n.length; // n -> string
}

```

上面的 `assert` 函数实际上就相当于写代码时多加一个条件语句判断：

```typescript

function f1(n: number | string) {
    if (!(typeof n === 'string')) {
       throw new Error();
    }
}

```

而 `assertNumberArray` 就相当于下面这样：

```typescript
declare function isArrayNumber(n: unknown): n is number[];

function f16(n: unknown) {
  if (!isArrayNumber(n)) {
    throw new Error();
  };
  return n[0] ** 2;
}

```

这个可以让我们不需要总是在代码中做类型判断就可以获得准确的类型推断，TS 编译器能够在控制流分析中，根据当前的 `asserts` 断言分析出后面的类型。

当然我们需要额外定义一些返回 `asserts` 断言的函数，事实上这是一种很常见的模式，在 `babel` 的源码中大量使用了这种写法，自动生成了很多类似 `assertString` `assertFunction` 函数，下面是在其源码中截取的一段代码：

```typescript
import is from "../../validators/is";

function assert(type: string, node: Object, opts?: Object): void {
  if (!is(type, node, opts)) {
    throw new Error(`Expected type "${type}" with option ${JSON.stringify((opts: any))}, ` 
    + `but instead got "{node.type}".`);
  }
}

export function assertArrayExpression(node: Object, opts?: Object = {}): void {
  assert("ArrayExpression", node, opts);
}

```

## 总结

1. `asserts` 是一个新的修饰符语法，它有 `asserts value` `asserts T is xxx` 这两种写法。
2. `asserts` 用在一个断言函数中，只有当断言的值或者类型为真时才会返回，否则函数会抛异常。
3. `asserts` 断言的使用可以让编译器在控制流分析中推断出后面的准确类型。
