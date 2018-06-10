---
title: "了解 Vuejs 中 keep-alive 的实现原理"
date: 2018-06-10T11:33:19+08:00
weight: 70
keywords: ["keep-alive", "vue-source-code", "vuejs", "深入前端"]
tags: ["Vuejs", "JavaScript",]
categories: ["技术分享", "源码阅读"]
author: "Meowu"
# CJKLanguage: Chinese, Japanese, Korean 这样中文摘要才会生效
isCJKLanguage: true
thumbnail : "images/jump.jpeg"
---

使用 `vue` 的时候，如果我们从一个组件切换到另外一个组件，前一个组件就会被销毁，有时候我们可能想要保存前一个组件的状态，这个时候就可以使用 `keep-alive` 把组件包裹从而将其缓存起来。它是一个抽象组件，既不会渲染出一个 `DOM` 元素，也不会出现在组件树中。深入研究 `vue` 的源码，我们可以了解到更多细节。
在 `keep-alive` 组件中使用了两个生命周期钩子。在 `created` 钩子中初始化了一个 `cache` 对象来存放缓存的组件，以及一个 `keys` 数组来存放每个被缓存组件的 `key` 。

```javascript
created () {
    this.cache = Object.create(null)
    this.keys = []
  }
```

而在 `destroyed` 钩子中则会销毁所有被缓存的组件：

```javascript
destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  }
```

这也就是为什么通常我们会将 `keep-alive` 使用在根组件上，这样它不会被销毁从而达到缓存效果。如果在子组件中使用，当切换到另一个子组件时，前一个组件下缓存的将会全部被销毁。

## 最多同时只能存在一个子组件。

在 `keep-alive` 的 `render` 函数中，第一行是这样的：

```javascript
const vnode: VNode = getFirstComponentChild(this.$slots.default);
```

在渲染 `keep-alive` 内的组件时，`vue` 是取其第一个直属子组件来进行缓存。所以在文档中作者也提到：

> &lt;keep-alive> 是用在其一个直属的子组件被开关的情形。如果你在其中有 v-for 则不会工作。如果有上述的多个条件性的子元素，&lt;keep-alive> 要求同时只有一个子元素被渲染。
> 如果没有子组件，则直接返回空值。

## 组件应该有一个 name 属性

在获取到相应的组件之后，就会去查找组件的 `name` 属性然后检验其是否满足提供的 `include` 或者 `exclude` 选项。如果当前组件不匹配 include 或者匹配 exclude，则不需要缓存直接返回它。

```javascript
const name: ?string = getComponentName(componentOptions);
if (
  name &&
  ((this.include && !matches(this.include, name)) ||
    (this.exclude && matches(this.exclude, name)))
) {
  return vnode;
}
```

这就是为什么文档中会提醒我们：

> &lt;keep-alive> 要求被切换到的组件都有自己的名字，不论是通过组件的 name 选项还是局部/全局注册。
> 如果我们不提供 `name` 属性的话 `vue` 会取 `tag` 属性。

获取到组件 `name` 并且满足了需要缓存的情况，就会查找 `this.cache` 中是否存在当前组件，如果有则直接返回它并刷新缓存 `key` 的位置，否则将其缓存起来：

```javascript
if (cache[key]) {
  vnode.componentInstance = cache[key].componentInstance;
  // make current key freshest
  remove(keys, key);
  keys.push(key);
} else {
  // 反之则将其进行缓存。同时若缓存达到指定的最大数量，删除第一个缓存组件。
  cache[key] = vnode;
  keys.push(key);
  // prune oldest entry
  if (this.max && keys.length > parseInt(this.max)) {
    pruneCacheEntry(cache, keys[0], keys, this._vnode); // 如果达到最大缓存，移除第一个。
  }
}
```

这里发现一个很有意思的是，`props` 其实还暴露了一个 `max` 属性，你可以指定缓存的最大数量，如果达到了该值则会按照队列先进先出的原则删除最早被缓存的组件。

## 动态调整缓存的组件

在源码中 `vue` 还监视了 `include` 和 `exclude` 这两个数据，因为我们有可能会绑定一个动态值，当它们发生变化时，就会及时刷新缓存中的组件：

```javascript
watch: {
    // include 或者 exclude 有可能是动态改变的，因此 watch 它们的值。
    include (val: string | RegExp | Array<string>) {
      pruneCache(this, name => matches(val, name))
    },
    exclude (val: string | RegExp | Array<string>) {
      pruneCache(this, name => !matches(val, name))
    }
  },
```
