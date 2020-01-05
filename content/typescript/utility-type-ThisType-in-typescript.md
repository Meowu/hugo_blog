---
title: "使用 TS 的实用类型 ThisType 表明对象的 this 值"
date: 2020-01-05T12:29:39+08:00
keywords: ["typescript", "ThisType<T>", "utility types", "TypeScript 实用类型", "typescript for beginners", "learn typescript", "static type check", "dive into typescript"]
tags: ["TypeScript", "JavaScript",  "Programming Language"]
categories: ["技术分享"]
author: "Meowu"
---

在看 `vue-class-component` 这个库源码的时候，注意到有这样的一个类型定义：

```typescript
function Component <V extends Vue>(options: ComponentOptions<V> & ThisType<V>): 
<VC extends VueClass<V>>(target: VC) => VC
```

这是组件装饰器 `Component` 	的类型定义，它接收初始化 vue 组件实例所需的选项，返回的是接收一个组件作为参数的函数，最后该函数直接返回传入的组件，意思就是，这个装饰器允许我们这样使用：

```javascript
@Component({
  methods: {},
  filters: {},
})
class Demo extends Vue {
  
  method1() {}
  method2() {}

}
```

我们既可以给装饰器传初始化参数作为组件的 `options` ，也可以在组件内部定义 `options` ，最后都会合并到当前组件上。

不过 `ThisType<V>` 这个用法是我第一个见到，所以就去 Google 了一下，才知道这是 *TypeScript* 标准库内置的一个泛型类型。

## 含义
既然是标准库提供的，去 [TypeScript/es5.d.ts](https://github.com/microsoft/TypeScript/blob/master/src/lib/es5.d.ts) 看了一下该类型的详细定义是这样的：

```typescript
/**
 * Marker for contextual 'this' type
 */
interface ThisType<T> { }
```

它实际上是一个空的接口，根据[官方文档](https://www.typescriptlang.org/docs/handbook/utility-types.html#thistypet)的介绍，它不返回任何转换过的类型，而是作为*对象字面量*上下文 `this` 的标识，并且要使用这个类型，需要启用配置 `-noImplicitThis` 。

## 用法
总结上面的意思就是：我们可以用它来表明对象字面量中方法的 `this` 的类型。所以，再回到开头的定义：

```typescript
function Component <V extends Vue>(options: ComponentOptions<V> & ThisType<V>): <VC extends VueClass<V>>(target: VC) => VC
```

这里泛型参数 `V` 是一个  `Vue` 组件， `options: ComponentOptions<V> & ThisType<V>`  表示 `options` 的 `this` 指向的就是 `V`  。

全局搜索了标准库文件，发现 `Object`  的几个静态方法也使用了这个类型：

```typescript

create(o: object | null, properties: PropertyDescriptorMap & ThisType<any>): any;

defineProperty(o: any, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>): any;

defineProperties(o: any, properties: PropertyDescriptorMap & ThisType<any>): any;
```

说明这几个方法并不在乎提供的 properties 或者 attributes 的  this 指向什么，因为最终都指向 `o` 。

再看官方文档中提供的例子：

```typescript
// Compile with --noImplicitThis

type ObjectDescriptor<D, M> = {
    data?: D;
    methods?: M & ThisType<D & M>;  // Type of 'this' in methods is D & M
}

function makeObject<D, M>(desc: ObjectDescriptor<D, M>): D & M {
    let data: object = desc.data || {};
    let methods: object = desc.methods || {};
    return { ...data, ...methods } as D & M;
}

let obj = makeObject({
    data: { x: 0, y: 0 },
    methods: {
        moveBy(dx: number, dy: number) {
            this.x += dx;  // Strongly typed this
            this.y += dy;  // Strongly typed this
        }
    }
});

obj.x = 10;
obj.y = 20;
obj.moveBy(5, 5);
```

`makeObject` 函数的参数中 `methods` 类型的被定义为 `M & ThisType<D & M>`， 所以 **methods** 中 `this` 最后指向的是 `{ x: number, y: number } & { moveBy(dx: number, dy: number): number }` 。