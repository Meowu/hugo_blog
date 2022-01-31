---
title: "[TypeScript] TS 的环境声明(ambient declaration)"
date: 2020-04-30T20:06:57+08:00
keywords: ["TypeScript ambient declaration", "TypeScript 环境声明", "模块声明", "typescript3.7", "TypeScript命名空间声明", "typescript for beginners", "learn typescript", "static type check", "dive into typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---

有时候我们通过 npm 安装一个库，它并没有提供类型声明文件，TypeScript 编译器找不到它的类型定义，使用库方法时就会提示不存在该方法或者报编译错误；又或者我们是通过 `<script />` 标签引入库的，此时库的内容都被定义到全局变量中，我们需要添加类型声明，告诉编译器这些变量或者方法在运行时是存在的，可以放心使用。此时，我们就需要用到 TypeScript 的 **环境声明(ambient declarations)** 。

## 环境声明

环境声明跟普通的 JS 声明不一样，编译后不会产生代码，也不会引入新的变量或者方法什么的，它只是用来提供类型信息，告诉编译器这些变量或者方法之类的声明会在其它地方引入到当前的环境中，并且它们是这样定义的。如在 `vue-next` 的最新代码中，通过 `global.d.ts` 文件声明了一下编译时的全局常量：

```typescript
declare var __DEV__: boolean
declare var __TEST__: boolean
declare var __BROWSER__: boolean
declare var __BUNDLER__: boolean

// Feature flags
declare var __FEATURE_OPTIONS__: boolean
declare var __FEATURE_SUSPENSE__: boolean

// ...
```

还需要注意的是，环境声明中只能包含类型定义，而不能包含具体的实现，例如变量不能赋值，函数只能声明参数类型和返回值而不能定义函数体。

环境声明是通过 `declare` 关键字来定义的，我们通过声明变量、函数、类、枚举、命名空间以及模块。


### 变量声明
我们同样可以通过 `var` `let` `const` 来声明一个环境变量，但是在其后面只能包含变量名和类型，不能给其初始化一个值。没有声明变量类型的话默认是 `any` 类型。

```typescript
declare var foo: string;
declare const bar: number;

declare let baz: boolean, far; // far -> any
```

### 函数声明
环境函数声明表明当前环境存在这样的函数，我们同样可以声明多个同名函数来实现重载，但是不能包含实现细节，并且参数不允许带有默认值。

```typescript
declare function fake(name: number): number;
declare function fake(name: number): boolean;

declare function fake(name: number = 'foo'): boolean; // error
```

### 类声明
在环境声明类里，可以选择定义类的构造函数，类属性，类方法的类型，同样不能包含具体的实现细节。
```typescript
declare class MyClass {
  constructor(someParam?: string);

  someProperty: string[];

  myMethod(opts: MyClass.MyClassMethodOptions): number;
}
```

### 枚举声明

环境枚举声明基本上跟常规的枚举定义一样，但是有两点不一样的地方：

1. 所有的枚举成员都必须是「常量枚举表达式」，也就是说它们的值都必须是非计算的。下面的代码中，定义的第二个 Status 中 created 是计算值，所以会报错。
   
```typescript
declare enum Status {
  initial = 1,
  created = 2,
  running = initial,
}

declare enum Status {
  initial = 1,
// // error,  In ambient enum declarations member initializer must be constant expression.
  created = Math.random() * initial + 1, 
  running = initial,
}

```

2. 不包含 `const` 修饰符的环境 enum 声明，如果枚举成员没有指定值，那么它将会被视为是计算成员，而不是指定一个自增的值。

```typescript
declare enum Foo {
  X, // Computed
  Y = 2, // Non-computed
  Z, // Computed
}

```

如果有多个 `enum` 声明了相同的名称，它们之间不能存在命名冲突，并且最后所有成员会被合并成同一个 `enum` 。


### 命名空间声明

声明命名空间的时候区别不大，这里的 `export` 是可选的，因为环境命名空间声明内的定义总是默认被导出的。

```typescript
declare namespace Foo {

  export const bar: string;

  export interface IOptions {
    width: number;
    height: number;
  }

  namespace Bar {
    export function baz(): void
  }

}

```


### 模块声明

模块声明的语法如下：

```bash
AmbientModuleDeclaration:  declare module StringLiteral { DeclarationModule } 

```

模块名字是一个字符串字面量，而不是一个变量名的形式。

跟 `emum` 声明类似，同名的模块声明也会被合并为一个模块：

```typescript
declare module 'fs' {
  export function readFile(filename: string): void;
}

declare module 'fs' {
  export function writeFile(filename: string, data: string): void;
}

// 跟下面的是一样的

declare module 'fs' {
  export function readFile(filename: string): void;
  export function writeFile(filename: string, data: string): void;
}
```

