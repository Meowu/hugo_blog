---
title: "[TypeScript] 在条件类型中使用 infer 关键字"
date: 2020-02-09T22:12:57+08:00
keywords: ["typescript", "type inference", "infer 关键字", "advanced-types", "learn typescript", "static type check", "dive into typescript， 深入 typescript"]
tags: ["TypeScript", "Programming Language"]
categories: ["技术分享"]
---

在 TypeScript 中条件类型的用法是：
```typescript
T extends U ? X : Y
```
跟 JS 中的条件表达式一样，如果`extends`语句为真，则取`X`类型 ，反之得到`Y`类型 。我们这里把`X`称为条件类型的**真分支**，`Y` 称为**假分支**。

现在，在 [TypeScript 2.8](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html) 之后，我们可以在 `extends` 条件语句中使用`infer`关键字引入一个**变量**表示推断的类型，这个变量可以被用在**真分支**中，也就是说`infer`实际上是一个**声明**关键字，我们可以用它来声明一个变量，而该变量表示的是类型。以标准库的 `ReturnType` 为例：
```typescript
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

const getFullName = (firstName: string, lastName: string): string {
    return `${firstName}_${lastName}`;
}
const fullName: ReturnType<typeof getFullName> = getFullName('foo', 'bar');
```
这里`ReturnType<T>`接收一个任意函数，在`extends`分支把推断的函数返回值的类型赋给变量`R`，从而得到该类型。这里需要注意的是，我们**只能在`extends`语句中**使用`infer`关键字，不能在诸如类型参数这样的地方使用它：
```typescript
type ReturnType<T extends (...args: any[]) => infer R> = R;  // Error.
```
既然可以获取到函数的返回值的类型，同样也可以推断出函数的参数类型，标准库的`Paramaters<T>`把函数的每个参数类型提取到一个元组中：
```typescript
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

const getFullName = (firstName: string, lastName: string, age: number): string =>{
    return `${firstName}_${lastName}`;
}
type params = Parameters<typeof getFullName> // [string, string, number] 
```
除了把函数参数列表的类型提取出来，进一步深入，假如函数的参数是单个对象，我们可以利用`infer`把参数的结构推断出来：
```typescript
type FunctionWithMappedArgument<P extends { [key: string]: any }> = (args: P) => any;
type DestructuredArguments<F extends FunctionWithMappedArgument<any>> = F extends FunctionWithMappedArgument<infer R> ? R : never;

declare function drawPoint(config: { x: number, y: number, color: string}): any;
const args: DestructuredArguments<typeof drawPoint> = {
    x: 4,
    y: 6,
}
```
这里我们先定义出参数类型为单个对象的通用函数`FunctionWithMappedArgument<T>`，接着定义解构参数的方法`DestructuredArguments<T>`，这个方法做的事情是接收一个`FunctionWithMappedArgument<T>`类型的函数，然后把函数的泛型参数`T`推断为新的变量`R`，这样编译器就会替我们计算出`R`的解构。

通过上面的代码，我们就可以把函数的参数类型提取出来，无需再声明一个类型，编码过程中编辑器的智能感知也能很好地进行代码补全提示。
![infer-1](/images/infer-1.png)

## 多处 infer 推断一个变量
上面展示的例子都只用到了一个`infer`，在`extends`条件语句中，我们可以有多个`infer`，只不过它们只能作用于同一个变量，根据推断位置的不同产生的类型也有所不同。

在共变的位置，会推断出联合类型：

```typescript
type Foo<T> = T extends { a: infer U, b: infer U } ? U : never;
type T10 = Foo<{ a: string, b: string }>;  // string
type T11 = Foo<{ a: string, b: number }>;  // string | number
```

在逆变的位置，推断的是交叉类型：
```typescript
type Bar<T> = T extends { a: (x: infer U) => void, b: (x: infer U) => void } ? U : never;
type T20 = Bar<{ a: (x: string) => void, b: (x: string) => void }>;  // string
type T21 = Bar<{ a: (x: string) => void, b: (x: number) => void }>;  // string & number
```

## 函数重载中的推断
当作用于一个有多处调用签名（函数重载）的类型时，`infer`只对最后一个签名生效，不可能基于参数列表的不同进行重载。
```typescript
declare function foo(x: string): number;
declare function foo(x: number): string;
declare function foo(x: string | number): string | number;
type T30 = ReturnType<typeof foo>;  // string | number
```


