---
title: "类型断言和类型保护"
date: 2019-11-07T23:09:56+08:00
keywords: ["typescript", "type guards 类型保护", "type assetions 类型断言",  "typescript for beginners", "learn typescript", "static type check", "dive into typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
---

## 类型断言
当一个变量是联合类型的时候，我们能够确定的只有每个类型共有的方法，除非准确地知道该变量属于哪个类型。
```ts
const canvas = document.getElementById('#canvas') // HTMLElement | null
const ctx = canvas.getContext('2d') // 错误
```
在上述代码中， `canvas`  元素可能不存在于文档中，所以 TS 推断它的类型是 `HTMLElement | null` ，不管是 `null` 还是 `HTMLElement` 都没有 `getContext` 方法。当我们很确定自己定义了该元素，并且它还是一个 `canvas` 元素，就可以使用 **类型断言** 来指定它的类型，告诉编译器「我很清楚自己在做什么，这里不会出错」。
类型断言的写法是 `<type>variable` 或者 `variable as type` ，之前的代码可以写成这样：
```ts
const canvas = document.getElementById('#canvas') // HTMLElement | null
const ctx = (canvas as HTMLCanvasElement).getContext('2d') 
// 或者 (<HTMLCanvasElement>canvas).getContext(‘2d’)
```
类型断言可以让我们在联合类型中对不同的类型做不同的事情，但是有时候这样也显得繁琐，假设我们有几个图形，有不同的求面积的方法：
```ts
interface ICircle {
  radius: number
}
interface IRectangle {
  width: number;
  height: number;
}

const getArea = (shape: ICircle | IRectangle): number => {
  if ((<ICircle>shape).radius) {
    return Math.PI * ((<ICircle>shape).radius ** 2);
  } else {
    return (shape as IRectangle).width * (shape as IRectangle).height;
  }
}
```
这样我们都需要写多次断言语句，体验实在不是特别友好。
## 类型保护
在上面的代码中，不仅在 `if` 条件分支里面需要写断言，在 `else` 分支同样要进行断言。通过类型保护，`TS` 可以判断出不同条件分支的类型。
### in
`in` 用来进行属性检测，它也可以用来做类型保护的判断：
```ts
const calcArea = (shape: ICircle | IRectangle): number => {
  if (‘radius’ in shape) {
    return Math.PI * (shape.radius ** 2);
  } else {
    return shape.width * shape.height;
  }
}
```
### instanceof
在 JavaScript 中 `instanceof`  被用来判断构造函数的实例，所以在它的右边必须是一个构造函数（或者类）， `TypeScript` 会根据构造函数的签名得到它的属性以及类型。
```ts
class Circle implements ICircle {
  constructor(public radius: number) {}
}

class Rectangle implements IRectangle {
  constructor(public width: number, public height: number) {}
}

const myArea = (shape: Circle | Rectangle): number => {
  if (shape instanceof Circle ) {
    return Math.PI * (shape.radius ** 2);
  } else {
    return shape.width * shape.height;
  }
}
```
### typeof
`typeof`  用来做类型判断，当它用于类型保护的时候， `TS` 同样能够识别出当前类型，从而允许我们基于该类型做不同的操作。它有两种写法：`typeof variable === ‘typename’`    和 `typeof variable !== ‘typename’` ：
```ts
const repeat = (x: number | string): number | string {
  if (typeof x === ‘number’) {
    return x * 2;
  } 
  return x + x + ''
}
```
需要注意的是这种用法只适用于原始类型，也即 `typename` 只能是 `string`  `number` `boolean` `symbol` 。
## 自定义类型保护
在上面的几种类型保护中，`instanceof` 的右边必须是一个构造函数，而 `typeof`  只对原始类型的判断生效，对于一个普通的对象无法使用这两种方法进行类型保护，TS 提供另外一种叫类型预设 (type predicates) 的用法允许我们自定义类型保护，它的形式是在函数的返回值里面写成 `param is Type` ，`param` 必须是当前函数签名中的一个参数。
```ts
function isCircle(shape: ICircle | IRectangle): shape is ICircle {
  return (<ICircle>shape).radius !== undefined;
}

class Rectangle implements IRectangle {
  constructor(public width: number, public height: number) {}
}

const myArea = (shape: Circle | Rectangle): number => {
  if (isCircle(shape) ) {
    return Math.PI * (shape.radius ** 2);
  }
  return shape.width * shape.height;
}
```
TS 不仅知道在 `if` 分支是 `ICircle` 类型，也知道在另一个分支是 `IRectangle` 类型。

类型保护的各种用法都是会做运行时 (runtime) 检查的，可以确保我们代码使用不会出问题，而在编译时编译器也不会报错。
