---
title: "TypeScript 中的 readonly 类型"
date: 2019-05-26T14:41:18+08:00
# draft: true
keywords: ["typescript", "readonly type", "dive into readonly typescript", "readonly type in typescript"]
tags: ["TypeScript", "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---


`readonly` 是一个**属性(property)** 修饰符，顾名思义，在 TypeScript 中它可以把一个属性变成只读的。我们可以在 `class` `interface` `type` `array-like` 定义中使用它，也可以用来定义一个函数的参数。既然是只读的意味着一旦定义了就不能再修改，所以这些属性必须在声明的时候或者在类中对它进行初始化。

```typescript
interface Point {
    readonly x: number;
    readonly y: number;
}
const start: Point = {
    x: 0,
    y: 0
}
start.x = 2 // 报错 Cannot assign to 'x' because it is a read-only property.
```

我们来看一个更加实际一点的用法。

```typescript
const walk1 = (position: Point, distance: number): Point => {
    position.x += distance; // ⚠️
    return position
}
// 可以这样
const walk2 = (position: Point, distance: number): Point => {
    const { x, y } = position;
    return {
        x: x + distance, // ✅
        y
    }
}
```

这种写法也让代码看起来更加函数式。

### 在 Class 中使用 readonly

除了 `private` `public` `protected` ，我们还可以在类的定义中使用 `readonly` 修饰符，声明一个类属性是只读的，或者把这两者结合起来。

```typescript
class Foo {
    readonly bar = 'bar';
    readonly baz: number;
    constructor() {
        this.baz = 23;
    }
}

// 利用 TS 的参数属性，还可以这样
class Foo {
    constructor(readonly bar: string, readonly baz: number) {}
}

const f = new Foo('bar', 23)
console.log(f.bar); // 👌
```

在类的使用中，如果一个属性只定义了 `getter` 没有定义 `setter` ，TS 会将其自动推断为只读的：

```typescript
class Rectangle {
    constructor(readonly width: number, readonly length: number) {}
    get area() {
        return this.width * this.length;
    }
}

const rect = new Rectangle(4, 5)
console.log(rect.area) // ok
rect.area = 30; // 报错： Cannot assign to 'area' because it is a read-only property.
```

只读属性只能第一次创建的时候进行初始化随后不能修改，在 `WebStorm` 中，如果你只在 `constructor` 构造函数中对它初始化，没有在其它地方重新赋值的话，编辑器也会提示你应该将其定义为只读属性：

```typescript
class Student {
  // Field is assigned only in the constructor and can be made readonly
  private name: string;
  readonly id: number;
  constructor() {
    this.name = 'Joi'
  }
  logging() {
    console.log(this.name)
  }
}
```



### Readonly<T> 映射类型

像这样对于每个属性都要写一个 `readonly` 的做法实在是不够优雅。作为一个推崇 **_Less is more_**  (lan duo) 的人，能够少写一点就尽量少写。有没有一种方法可以一键给所有属性添加 `readonly` 定义呢？有的，官方标准库 [lib.es5.d.ts](https://github.com/Microsoft/TypeScript/blob/master/lib/lib.es5.d.ts) 提供了一个方法 `Readonly<T>` 把对象上所有属性变为只读，它的定义是这样的：

```typescript
/**
 * Make all properties in T readonly
 */
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

// 像这样去使用它
interface IPoint {
  x: number;
  y: number;
}
const start: Readonly<IPoint> = {
  x: 0,
  y: 0
}
start.x = 2; // 🙅 no

// 上面的用法只对当前实例有效，并不会改变 IPoint
// 要重复使用，我们可以给它定义一个类型别名
type ReadonlyPoint = Readonly<IPoint> // 或者
interface ReadonlyPoint extends Readonly<IPoint>
const end: ReadonlyPoint = {
    x: 10,
    y: 10
}
end.x = 3; // ❌
```

需要注意的是，`Readonly<T>` 只对它当前修饰的属性有效，并不会对嵌套属性产生影响：

```typescript
interface foo {
    readonly bar: string;
    readonly baz: {
        hoo: number;
    }
}
const fuu: foo = {
    bar: 'bar',
    baz: {
        hoo: 1
    }
}
fuu.baz = { hoo: 2 } // ❌  
fuu.baz.hoo = 3; // ✅
// 要在嵌套里面再使用 Readonly<T>
interface foo {
    readonly bar: string;
    readonly baz: Readonly<{
        hoo: number;
    }>
}
```

只读属性只是一种类型定义，它是用来约束我们的代码行为的，养成良好的代码规范的，并且只会在编译时生效，对运行时无效。我们无法避免其他人调用我们的代码时修改这些只读属性，如果不想别人修改内部属性，可以使用 `Object.freeze()` 方法进行限制。事实上，TS 对于该方法的定义返回的就是一个 `Readonly<T>` 类型，以提醒我们不能修改返回的对象：

```typescript
interface ObjectConstructor {
    ...
    /**
    * Prevents the modification of existing property attributes and values, and prevents the addition of new properties.
    * @param o Object on which to lock the attributes.
    */
  	freeze<T>(o: T): Readonly<T>;
    ...
}
```

### Readonly array-like 对象

`array-like` (类数组) 对象指的是那些具有 `length` 属性，并且可以通过下标(index) 进行取值的对象，它还有特有的方法 `item(index)` 取值，在 `JavaScript` 中包括 `HTMLCollection (document.forms)` 、`NodeList (document.querySelectorAll(*))` 等，以及  `TypeScript` 中的 `tuple` 类型。

在 TS 中可以定义只读的 `array` 。

```typescript
function foo(arr: ReadonlyArray<string>) {
    arr.slice();        // 👌
    arr.push("hello!"); // 🈲️
}
```

如果数组不存在修改，最佳实践是使用 `ReadonlyArray` 而不是 `Array` 。在 TS 中定义一个数组除了 `Array<number>` 之外，还可以使用更漂亮的 `number[], string[]` 等。如果使用 `Readonly<number>` 来替代 `Array<number>` 就失去了这种优雅。因此，[TS-3.4](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html) 版本提供了更好的支持，让我们可以使用 `readonly` 来修饰数组，从而保留这种优雅性：

```typescript
function foo(arr: readonly string[]) {
    arr.slice();        
    arr.push("hello!"); // never
}
// 但是不能使用这种写法：readonly Array<string> 
// 要么是 ReadonlyArray<string> 要么是 readonly string[]
```

还添加了对只读 `tuple` 的支持:

```typescript
function foo(pair: readonly [string, string]) {
    console.log(pair[0]);
    pair[1] = "hello!";  // error
}
```

这样的改进还带来另一个好处。

在此之前，`Readonly<T>` 对于数组和元组类型不会生效：

```typescript
// { readonly a: string, readonly b: number }
type A = Readonly<{ a: string, b: number }>;

// number[] 每个值并没有变成 readonly
type B = Readonly<number[]>;

// [string, boolean]
type C = Readonly<[string, boolean]>;
```

现在，它们也可以变成只读的了：

```typescript
// readonly number[]
type B = Readonly<number[]>;

// readonly [string, boolean] 只读的元组
type C = Readonly<[string, boolean]>;
```

### 移除 readonly

我们不仅可以给对象添加 `readonly` 修饰符，也可以移除它。从 TypeScript 2.8 起， 允许我们在修饰符前面通过 `+` 或者 `-` 号来添加或者删除指定修饰符。

```typescript
// 先定义一个工具方法
type Mutable<T> = {
    -readonly [K in keyof T]: T[K]
}
interface Point {
    readonly x: number;
    readonly y: number;
}
const start: Mutable<Point> = {
    x: 0,
    y: 0
}
start.x = 2 // 👌

// number[]
type B = Mutable<readonly number[]>;

// [string, boolean]
type C = Mutable<readonly [string, boolean]>;

// 也可以改变 required 
type MutableRequired<T> = { -readonly [P in keyof T]-?: T[P] }; // Remove readonly and ?
```

### 总结

`readonly` 是 TypeScript 中的一个属性修饰符，我们可以在 `interface` `Class` `type` 以及 `array` 和 `tuple` 类型中使用它，对数据类型进行更严格的定义。我们可以使用标准库的 `Readonly<T>` 工具方法来创建一个只读的对象，不需要给每个属性添加 `readonly` 关键字，也可以通过 `+` 和 `-` 号对修饰符进行更灵活的控制。
