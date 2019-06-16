---
title: "TypeScript 的基本类型及用法"
date: 2019-06-17T00:25:45+08:00
keywords: ["typescript", "basic types", "typescript for beginners", "learn typescript", "static type check", "dive into typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---


> We designed TypeScript to meet the needs of the JavaScript programming teams that build and maintain large JavaScript programs.  
>                                          					    ——  TypeScript spec 1.8  

`TypeScript`  是 `ECMAScript 2015 (ES6)`  语法的超集，它让我们可以使用所有 `ES6` 的语法，包括 `class`  `ES module`  等等，并且可以通过配置文件，把这些特性转译成  `ES3`  或者  `ES5`  代码。
在 `TS`  中使用 `variable :TypeAnnotation`  这样的方式来给变量添加一个类型注释。只要是在当前声明空间内的类型都可以直接用来注释变量，包括用户自己定义的，从第三方库导入的，以及 `TS`  自带的标准库。
```typescript
 const foo: string = 'foo'  // 字符串类型
 const bar: number[] = [1, 2, 3] // 数字数组类型
  
 const baz: ReadonlyArray<number> = [1, 2] // 使用标准库声明一个只读数组
  baz[0] = 0  // 🙅 Error: Index signature in type 'readonly number[]' only permits reading.
```

## 原始类型
`TS` 是 `JS` 的超集，它提供的是可选的类型系统，所以一个 `JS` 程序同样是一个合法的 `TS` 程序，在 `JS` 中的所有原始类型在 `TS`  中都是可用的，所有语法也都可以放心使用，`let`  `const` 等，我们也应该尽可能的使用这些新的特性，不必再使用 `var` 来声明变量。
```TypeScript
  let bool: boolean = true  // 布尔类型
  bool = 'bool' // error
  const foo: number = 3 // number 类型
  const bar: string = 'bar' // string 类型
```
使用 `string`  来定义一个类型有时候显得笼统，我们需要一个更精确的字符类型，它只需包含有限的字符串值， `TS` 允许我们定义**字符串字面类型** (_String Literal Types_) ，它是 `string` 类型的子集，可以让我们更准确地定义我们的类型。
```typescript
  let foo: 'foo' = 'foo'
  let bar: string = 'bar'
  bar = foo  // 👌 foo 属于字符串的一种
  foo = bar  // ⚠️ 字符串不一定是 'foo'
  // 使用联合类型，我们可以定义一个更具有实际意义的类型
  type Direction = 'North' | 'South' | 'East' | 'West'
```
除此之外，`ES6` 新增的 `symbol` 原始类型，可以通过 `Symbol` 构造函数来创建，它是全局唯一的，通常结合 `ES6` 的计算属性将其作为对象属性的 `key` 。
```typescript
  // Symbol 构造函数不需要 new ，并且 'key' 是可选的。
  let key = Symbol('key')
  const obj = {}
  obj[key] = 'key value'
 
  // symbol 类型是全局唯一的
  const key1 = Symbol('key1')
  const key2 = Symbol('key1')
  key1 === key2 // no
```

除了原始类型，`TS`  还包括了以下类型：

## 数组类型
数组类型使用普通类型来表示  `JavaScript`  数组，使用数组类型主要有两种方法，一个是使用全局的泛型类型 `Array<T>` 进行创建，把数组元素的类型作为参数 `T`  。
```typescript
  const a: Array<number> = [1, 2]
  a[0] = '1' // error
```
第二种方法是使用数组字面量，这种方法更加简洁优雅：
```typescript
  const a: number[] = [1, 2]
```
## 元组类型
在 `JS`  中没有元组的概念，`TS` 提供了对元组的支持，它跟数组非常像，不过数组长度是不确定的，而元组可以被看做是一个事先确定元素个数以及每个元素类型的定长数组，我们可以通过元组字面量的方式 (tuple type literals) 来定义它：
```typescript
  const person: [string, number] = ['name', 12]
  person[0] = 1 // 🈲️ error
  // 我们只给元组定义了两个元素
  // Tuple type '[string, number]' of length '2' has no element at index '2'.
  // Type '3' is not assignable to type 'undefined'.
  person[2] = 3
```

## 特殊类型
### Any 类型
`Any` 类型可以用来代表任意 `JS` 值，它用 `any`  关键字来表示，是所有类型的超类型，一般在任何没有显式声明类型或者 `TS` 无法推断类型的地方，都假设它是 `any` 。一个声明了 `any` 类型的地方可以使用任意其它类型来替换，也可以赋给任意其它类型。
```typescript
  let x: any // 显式声明为 any
  let y // 等同于 let y: any
  function f(x) { // x 会被视为 any 类型
    console.log(x)
  }
```

### Unknown 类型
`Unknown` 类型是 `TS 3.0` 版本新增的类型，它跟 `Any` 类型比较像，但是更安全。 对于 `Any` 类型，可以把它赋给任何其它类型，也可以把任何类型赋给它，而对于 `Unknown` 类型，任何类型都可以赋给它，但是它只能赋给它本身以及 `Any` 类型。
```typescript
  let val: unknown
  val = 1 // 👌
  val = '2' // ✅
  val = [3] // ✅
  val = new Error() // 😊

  let x: unknown
  let v1: any = x // 👌
  let v2: unknown = x // 👌
  let v3: string = x // ⚠️ no
  let v4: object = x // ⚠️ no
  let v5: number = x // ⚠️ no
  let v6: null | undefined | {} = x // 🈲️ no
```

### Undefined 类型
`Undefined` 类型等同于 `JS` 中的 `undefined` ，`undefined` 就是它的字面量表示，代表所有未初始化值的变量，但是我们无法引用 `Undefined` 类型本身。它是所有类型的子类型，意味着它可以赋值给任何其它类型的变量。
```typescript
  let n: number // let n: number = undefined
  let a: Undefined // error. 不能引用 Undefined 类型本身
  // 别忘了所有未显式声明变量的地方都是 any 。
  // 等同于 let x: any = undefined
  let x = undefined 
```

### Null 类型
类似于 `Undefined` 类型，`Null` 类型的字面量就是 `null` ，我们也无法直接引用 `Null`  本身，它是除了 `Undefined` 类型之外的所有类型的子类型。
```typescript
  let e: Null // 不能直接引用 Null
  let a: number = null
  let x = null // => let x:any = null
```

### Void 类型
`Void` 类型通过 `void` 关键字来引用，代表缺少值，通常用来表示函数没有返回值。它是 `Any`  类型的子类型，同时是 `Undefined` 和 `Null` 类型的超类型，也就是说 `Void` 的可能值只有 `undefined` 和 `null` 。你可以声明一个变量为 `Void` 类型，这实际上没有任何意义。
```typescript
  function logging(): void {
    console.log('logging')
  }
  let n: void = undefined // 🤦‍♂️
```



