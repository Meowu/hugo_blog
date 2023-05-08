---
title: "TypeScript 中的 interface 和抽象类"
date: 2023-04-28T21:44:03+08:00
keywords:
  [
    "typescript",
    "interface",
    "abstract class",
    "接口和抽象类",
    "advanced-types",
    "learn typescript",
    "static type check",
    "dive into typescript 深入 typescript",
  ]
tags: ["TypeScript", "JavaScript", "Programming Language"]
---

在面向对象设计中，不同的类或模块之间经常会需要共享逻辑或者接口，TypeScript 提供了强大的面向对象支持，可以通过接口（interface）或抽象类（abstract class）来实现代码的共享。

下面通过实现一个简单的例子来比较一下这两种方法的异同。

### interface
假设我们要实现一个 `Person` 类，它包含一个 `name` 字段和 `printName` `getPermissions` 两个方法。我们可以使用接口来描述它的结构，如下所示：

```TypeScript
interface Person {
  name: string;
  getPermissions(): string;
  printName(): void;
}
```

使用该接口有两种方式。一种是通过类去实现 （`implements`） 它的所有功能；另一种是直接初始化一个包含所有属性和方法的对象。

```typescript
// Method 1
class Employee implements Person {
    constructor(public name: string) {}
    getPermissions() {
        // according to role...
    }
    printName() {
        console.log('My name is ' + this.name)
    }
}
class Contractor implements Person {
    constructor(public name: string) {}
    getPermissions() {
    }
    printName() {
        console.log('My name is ' + this.name)
    }
}
// Method 2
const p1: Person = {
    name: 'Nina',
    getPermissions() {
    },
    printName() {
        console.log('My name is ' + this.name)
    }
}
```

可以看出，`interface`  定义了对象的结构或者一系列属性和方法，我们根据该结构来实现接口，然后就可以使用这些功能。

接口是 TS 特有的编译时的特性，在 JS 中运行时并不存在。`Employee`  `Contractor` 实现了它，所以在运行时是存在的。

在上面的代码中，有一个可以优化的地方，`Contractor` 和 `Employee` 都实现了 `Person` 接口的功能， `getPermissions`  根据用户的角色可能不同，但 `printName` 方法的实现都是一样的，我们可以避免重复实现 `printName` 方法。

### 抽象类

在 TypeScript 中，类、方法和字段都是可以是抽象( abstract )的，即它们还没有被具体实现，同时也意味着不能直接实例化抽象类。

我们可以用抽象类来替代 `Person` 接口：

```typescript
abstract class Person {
    abstract name: string
    abstract getPermissions(): unknown
    printName() {
        console.log('My name is ' + this.name)
    }
}
class Contractor extends Person {
    constructor(public name: string) {
        super()
    }
    getPermissions() {
    }
}
class Employee extends Person {
    constructor(public name: string) {
        super()
    }
    getPermissions() {
        // according to role...
    }
}
const p2 = new Employee('Nina')
p2.printName() // My name is Nina
```

在新的实现中，具有相同功能的不同子类无需再分别实现 `printName` 方法，而是将其放在抽象基类中去实现，供所有的子类继承。不同的子类再各自实现抽象方法，这样既约束了类的功能，又实现了代码的共享。然而，这种方法也有一个缺点，就是不同类之间的耦合性增加了。

### 总结

接口（interface）或抽象类（abstract class）都是 TypeScript 中非常强大的功能，便于我们使用面向对象的思想去进行代码的抽象和复用。

它们整体上比较相似，但也有一些不同之处，适用于不同的场景。对于只需要约束对象的结构来讲，使用 `interface` 是更好的选择。接口可以通过类和简单对象字面量来使用，避免了不同类之间的耦合，并且不会在运行时生成多余的代码。当需要在不同类之间共享逻辑时，抽象基类是更好的选择。
