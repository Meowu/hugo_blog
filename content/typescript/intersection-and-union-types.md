---
title: "交叉类型和联合类型及其应用"
date: 2019-10-28T23:12:23+08:00
keywords: ["typescript", "intersection-types 交叉类型", "union-types 联合类型", "advanced-types", "learn typescript", "static type check", "dive into typescript 深入 typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
---


除了几种基本类型，`TS` 还有一些高级类型，其中包括交叉类型和联合类型这两种。
## 交叉类型（intersection types）
交叉类型可以让我们把现有的类型组合在一起得到一个新的类型，从而同时拥有它们的**全部属性**，表示方法是：`A & B`  。
```typescript
interface IPerson {
  name: string;
  age: number;
}
interface IStudent {
  grade: number;
}
const getBio = (user: IPerson & IStudent) => {
  return `His name is ${user.name}, I am ${user.age} years old and a student of Grade ${user.grade}.`
}
getBio({name: ‘Joi’, age: 12, grade: 6})
```
跟集合里的相交不一样，`TS` 的交叉类型并不是指每个类型的交集，`&`  的意思理解成 `and` ，`A & B`  表示同时包含 `A` **和** `B`  的结果，这里传进去的 `user` 必须同时拥有 `name, age, grade` 这三个属性，我们可以直接使用它而不需要判断是否存在该属性。

## 联合类型（union types）
联合类型应该是我们在  `TypeScript`  使用得最多的特性之一，它使用管道符 `|` 把多个类型连起来，表示它**有可能**是这些类型中的其中一个：
```typescript
const greet = (name: string | null) => {
  if (!name) {
    return `Hello, guest.`
  } else {
    return `Hello, ${name}.`
  }
}
```
强调**有可能**是因为它跟集合中的**并**不同，`|`  应该理解成 `or` ，`A | B` 表示 A 或 B 的结果，它只可能是其中一个，这也就意味着它的类型是不确定的。
```typescript
interface ICat {
  run(): void
  meow(): void
}
interface IDog {
  run(): void
  bark(): void
}
class Cat implements ICat {
    run() { };
    meow() { };
}
const getAnimal = (): ICat | IDog {
    return new Cat();
}

const animal = getAnimal();
animal.run(); // ok
animal.meow(); // error
```
这里 `ICat` 和 `IDog` 都拥有 `run` 方法，我们不确定返回的具体是什么类型，如果想要编译通过就需要使用类型断言：
```typescript
// 类型断言
(animal as ICat).meow() // ok

// 判断是否存在该方法
if (‘meow’ in animal) {
  animal.meow()
} else {
  animal.bark();
}
```
看起来它们的叫法换过来更符合直觉一点，至于为什么叫这两个名字，[官方 repo 有个专门讨论这个问题的 issue](https://github.com/Microsoft/TypeScript/issues/18383)] ，根据维护者的说法，这应该是约定俗成的，并不是他们刻意起的，是符合类型理论和其它语言的习惯的。
## 基于联合类型的条件类型分发
条件类型指的是 `T extends U ? X : Y`  ，在执行这条语句的时候，如果 `T` 是一个联合类型 `A | B | C` ，事实上它做的是: `(A extends U ? X : Y) | (B extends U ? X : Y) | (C extends U ? X : Y)` ，会在每个可能的类型分支上分别进行判断，最后得到的也是一个联合类型。基于这个特性，就可以做一些方便的操作：
```typescript
// 移除属性值
type Diff<T, U> = T extends U ? never : T
type T1 = Diff<‘a’ | ‘b’ | ‘c’, ‘b’ | ‘d'> // ‘a’ | ‘c’
```
