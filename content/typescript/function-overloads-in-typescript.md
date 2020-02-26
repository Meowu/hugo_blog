---
title: "[TypeScript] 函数重载"
date: 2020-02-26T22:28:58+08:00
keywords: ["typescript", "function overload", "函数重载", "advanced-types", "learn typescript", "static type check", "dive into typescript， 深入 typescript"]
tags: ["TypeScript", "Programming Language"]
categories: ["技术分享"]
---

在 `C++` `Java` 这些静态语言中，可以通过为一个函数定义多个不同的签名，也即不同输入和输出来达到函数的重载。但是 `JavaScript` 的函数是没有签名的，它的输入参数是由包含零个或者多个值的数组来表示的，并且 JS 不定义参数的类型，也不检查接收的参数的类型和个数，所以在 JavaScript 中是不可能实现真正的函数重载的。

`TypeScript` 作为 `JavaScript` 的超集，既允许我们对函数参数的类型进行定义，也可以进行函数重载。那么在什么情况我们会需要函数的重载呢？假设有一个这样的场景，我们需要一个函数，它接收一个用户列表做为第一个参数，用户 `id` 作为第二个参数，过滤出`id`所对应的用户名，如果`id`是一个数字，就返回该用户名字字符串，如果`id`是一个列表，则返回一个用户姓名列表，很容易得到以下定义：

```TypeScript
interface IUser {
  name: string;
  id: number;
  address: string;
  // ...
}

const getNames = (userList: IUser[], id: number | number[]): string | string[] => {
  if (Array.isArray(id)) {
    const names: string[] = [];
    userList.forEach((user: IUser) => {
      if (id.includes(user.id)) {
        names.push(user.name);
      }
    })
    return names;
  }
  const found = userList.find((user: IUser) => user.id === id);
  if (found) {
    return found.name;
  }
  return ''
}
```
定义好函数之后，我们试着用它来执行看看输入的结果：
```typescript
const users: IUser[] = [
  {name: 'John', id: 1, address: ''},
  {name: 'Joi', id: 2, address: ''},
  {name: 'Kevin', id: 3, address: ''}
]
const John = getNames(users, 1);
const JohnAndKevin = getNames(users, [1, 3]);
```
![type-withour-overload](/images/type-without-overloads.gif)

我们发现`John`和`JohnAndKevin`的类型都是`string | string[]`，它无法根据我们输入的类型来推断出输出的类型，当我们执行`JohnAndKevin.join('、')` 按照 `、`分隔的形式把姓名列表渲染到界面中，就要先判断它是不是数组，因为 `string` 类型是没有 `join` 方法的。

这个时候函数重载就派上用场了，我们可以定义两个函数签名，它们的输入将会决定它们的输出：
```typescript
function getNames(userList: IUser[], id: number): string;
function getNames(userList: IUser[], id: number[]): string[];
function getNames(userList: IUser[], id: number | number[]): string | string[]{
    if (Array.isArray(id)) {
      const names: string[] = [];
      userList.forEach((user: IUser) => {
        if (id.includes(user.id)) {
          names.push(user.name);
        }
      })
      return names;
    }
    const found = userList.find((user: IUser) => user.id === id);
    if (found) {
      return found.name;
    } else {
      return ''
    }
  }
```
这个时候我们就会发现函数会根据输入的参数类型来决定返回值的类型，我们就可以获得更精确的类型。
![type-with-overload](/images/type-with-overloads.gif)

从上面的方法重载的定义可以看出，实现重载需要定义多个重载方法，它实际上是一个列表，定义的最后一个签名应该包含所有可能的类型，但是它不属于重载的列表。
## 重载的顺序
进行函数重载的时候，还有一个需要遵循的原则是：越具体的类型，应该定义在越前面。这样有利于 `TypeScript` 编译器推断出更准确的类型。
以标准库中数组的 `reduce` 方法为例：
```typescript
interface ReadonlyArray<T> {
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: readonly T[]) => T): T;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: readonly T[]) => T, initialValue: T): T;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: readonly T[]) => U, initialValue: U): U;
}
```
它有三个签名，对应着不同的参数个数和返回值，事实上标准库中的这个定义的顺序存在 bug，开发者在搜集用例打算重写它的声明，我们看一段示例代码：
```typescript
const A = [1, '2', 3]
const str: string = A.reduce((str, a) => `${str} ${a.toString()}`, '')
// const str: string
// Type 'string | number' is not assignable to type 'string'.
// Type 'number' is not assignable to type 'string'
```
在编辑器中写这段代码的时候会报错，是因为函数错误地匹配到了第二个重载签名，我们来仔细分析以下这个过程：
首先这里传入了 `initialValue` 参数，跳过签名一；签名二只有一个泛型参数 T，就是数组中每一项可能的类型，`A` 的类型是`(string|number)[]`，所以这里`T`是`string|number`，我们传入的 `initialValue`类型是`string`，而`string`是可以赋给`string|number`的，到了第二个这里是匹配的，所以最后返回`T`类型是为`string|number`，跟我们想要的 `string` 是不兼容的。

而第三个签名是更具体的，它多了一个泛型参数`U`，它相当于由`initialValue`的类型去决定了函数的返回值的类型，假设第二个签名跟第三个签名交换位置的，我们就可以得到更严格的类型 `string` 而不是`string|number`。
不过我们可以采取另外一个方法去解决这个编译错误，就是手动指定`U`的类型，因为只有第三个签名有泛型参数`U`，从而匹配到准确的重载签名：
```typescript
const A = [1, '2', 3]
const str: string = A.reduce<string>((str, a) => `${str} ${a.toString()}`, '')
```

## 总结
一、函数重载让编译器根据函数的输入决定函数的输出，从而推断出更准确的类型。

二、最后一个签名要包含前面所有签名的情况，并且它不在重载列表内。

三、在定义多个重载方法时，越具体的签名应该定义在越前面。

#### 参考
以下是一些 Github 上的讨论，便于了解更多的细节。
* [Consider re-ordering Array#reduce overloads in lib.d.ts](https://github.com/microsoft/TypeScript/issues/26332)
* [Array method definition revamp: Use case collection](https://github.com/microsoft/TypeScript/issues/36554)