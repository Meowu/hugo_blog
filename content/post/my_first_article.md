---
title: "My First Post"
date: 2017-12-14T11:18:15+08:00
weight: 70
keywords: ["hugo"]
description: "第一篇文章"
tags: ["Vue", "JavaScript", "SSR"]
categories: ["技术分享"]
author: "Meowu"
# thumbnail = "images/thumbnail.jpg" # Optional, referenced at `$HUGO_ROOT/static/images/thumbnail.jpg`
---

使用 `vue` 的时候，如果我们从一个组件切换到另外一个组件，前一个组件就会被销毁，有时候我们可能想要保存前一个组件的状态，这个时候就可以使用 `keep-alive` 把组件包裹从而将其缓存起来。它是一个抽象组件，既不会渲染出一个 `DOM` 元素，也不会出现在组件树中。深入研究`vue` 的源码，我们可以了解到更多细节。

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

#### 最多同时只能存在一个子组件。

在 `keep-alive` 的 `render` 函数中，第一行是这样的：

```javascript
  const vnode: VNode = getFirstComponentChild(this.$slots.default)
```

在渲染 `keep-alive` 内的组件时，`vue` 是取其第一个直属子组件来进行缓存。所以在文档中作者也提到：

> &lt;keep-alive&gt; 是用在其一个直属的子组件被开关的情形。如果你在其中有 v-for 则不会工作。如果有上述的多个条件性的子元素，&lt;keep-alive&gt; 要求同时只有一个子元素被渲染。