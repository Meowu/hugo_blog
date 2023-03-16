---
title: "Nuxt3 实战"
date: 2023-02-28T23:21:41+08:00
keywords: ["Vuejs", "Nuxtjs", "Nuxt3", "SSR", "Server side rendering", "深入前端", "Frontend"]
tags: ["Vue", "Nuxt"]
categories: ["技术分享"]
---

之前用的基于 Vite 构建的 Vue3 项目已经是两年前搭建的了，迭代得越来越大，也遇到一些痛点。最近要起一个新的项目，Nuxt3 也已经发布了新版，就尝试用它作为新项目的构建系统，整体用下来体验还是比较不错的，这里总结一下它的基本的概念，方便查阅。后续使用过程中，随着不断的熟悉也会继续完善这篇文章。

## 基本命令

通过 `npx nuxi init <project-name>` 创建了一个项目后，比较常用的会有以下三个命令：

```bash
  nuxi dev
  nuxi build
  nuxi generate
```

`dev` 命令启动一个支持 HMR 的开发服务器，默认运行在 `http://localhost:3000` 端口。也可以加上 `--https` 参数来使用 `https` 协议，如果使用自签证书的话，需要设置环境变量 `NODE_TLS_REJECT_UNAUTHORIZED=0` 。

`build` 命令在本地创建一个 `.output` 目录保存构建到生产环境的产物，会将 `process.env.NODE_ENV` 设为 `production` 。

`generate` 命令会 **预渲染** 每个路由页面，查看产物会发现每个路由都有一个对应的 HTML 文件。实际上它等同于 `nuxi build --prerender true` 。

## 自动导入

自动导入是 Nuxt 一个很有用的特性。在以往的开发过程中，每个页面都要 `import` 我们用到的 Vue 的 Api ，还有我们写的组件等等，这样显得繁琐。而现在这些都不需要了，Nuxt 会在当前上下文里自动导入 Vue 的 API 如 `ref`, `computed` ，还有 Nuxt 提供的组件、插件以及自带的工具函数 如 `useRuntimeConfig` ，以及在特定的文件目录下定义的内容。此外，Nuxt 会在 `.nuxt/imports.d.ts` 下为这些自动导入的函数生成对应的类型声明，以免 IDE 会抛出错误。

所有这些自动导入的内容，Nuxt 也把它们放在一个 `#imports` 别名里，在需要的时候，我们可以像下面这样来使用：

``` typescript
  <script setup>
    import { ref, computed } from '#imports'
  </script>
```

`composables` 定义在该目录下的 Vue 组合函数会被自动导入到我们的应用上下文中。Nuxt 只会扫描该目录下的顶级文件而忽略嵌套目录的文件，如果连嵌套目录下的文件也一起导入，可以在 `composables/index.ts` 下把对应文件的模块内容重新导出。也可以在配置中修改扫描规则：

``` typescript
  export default defineNuxtConfig({
    imports: {
      dirs: [
        // 扫描顶级模块
        'composables',
        // ... 扫描指定文件
        'composables/*/index.{ts,js,mjs,mts}',
        // ... 扫描指定目录的所有模块
        'composables/**'
      ]
    }
  })
```

`components` 可以把所有自定义的组件放在该目录下，然后就能在任何页面或者其他组件中使用。嵌套目录下的组件，自动导入后默认会在组件名中带上它的父级目录的名字，如 `components/foo/bar/Button.vue` ，在使用的时候应该是 `<FooBarButton />` 。最好在命名的时候直接命名为 `FooBarButton.vue` ，这样看上去更直观，而前面的 FooBar 部分也不会被重复添加。如果不想带上目录名，可以在配置中关掉。如果想把一个组件变成动态导入的，只要简单的在组件名前加上 `Lazy` 即可，`<LazyFooBarButton />` 。

`utils` 目录跟 `composables` 基于同样的扫描规则，定义在这个目录下的工具函数都会被自动导入。

`layouts` 目录下的排版组件会被自动导入，并且是异步加载的。可以直接在 `app.vue` 中通过 `<NuxtLayout />` 来引用它们。我们可以有多种方法来使用这些组件：

如果我们整个应用只有一种布局，那么只需要定义一个 `~/layouts/default.vue` 即可，然后在通过插槽的方式来使用它：

``` html
  <template>
    <NuxtLayout>
      Your content...
    </NuxtLayout>
  </template>
```

最常见的方式是，我们用它来包裹一个 `<RouterView />` ，这样所有的页面都会默认使用这个布局，实际上 Nuxt 提供了一个自带组件 `<NuxtPage />` ，它内置了 `<RouterView />` ，让我们很方便将其和`<NuxtLayout />`结合起来。


``` html
  <template>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </template>
```

如果要使用其它排版组件，也通过改变 `<NuxtLayout />` 的 `name` 属性。

还有一种方式就是在组件中定义页面的元信息：

```typescript
  <script>
    definePageMeta({
      layout: "custom-layout",
    });
  </script>
```

## 路由系统

基于文件系统的页面路由是 Nuxt 的另外一个关键特性。定义在 `pages` 目录下的文件会自动生成一条表示该页面的路由记录(`Route`) ，并且页面是动态加载的，这样可以自动进行代码分割，降低初次加载的资源体积。
文件系统路由基于命名约定的方式来创建动态和嵌套的路由：

``` bash
      pages/
      --| about.vue
      --| posts/
      ----| [id].vue
```

像上面这样最终会生成两条路由记录：`/about`, `/post/:id` ，并且自动导入相应的组件。在进行路由导航的时间，我们可以使用内置的 `<NuxtLink />` 来做跳转，它是优化了的 `<RouterLink />` 。

通过 `definePageMeta` 方法，我们可以在组件内定义路由的属性，如中间件，元信息等。此外，Nuxt 还提供了 `validate` 属性来允许我们对页面路由进行校验，它是一个函数，如果该函数返回 false ，就会抛出 404 错误。

## 插件系统

在常规的 Vue 项目中，我们一般会有一个 `main.ts` 文件，在这里创建 Vue 实例，注册第三方插件以及初始化一些全局数据等等。

在 Nuxt 中没有这个入口文件，我们可以通过更强大的插件系统来完成这些事情。使用 `defineNuxtPlugin` 可以让我们自定义一个 Nuxt 插件，`plugins` 目录下的文件以及子目录下的 `index` 文件会被自动扫描并注册成插件，并在 Vue 应用创建的时候进行加载，通过在文件名后加 `.client` 或者 `.server` 来让插件只在在客户端还是服务端使用，如果要决定插件的注册顺序，可以在文件名前面添加数字 `1.plugin.ts` `2.plugin.ts` 这样来进行控制，后注册的插件可以使用前面注册的插件注入的数据。

插件工厂函数接受的参数是当前 Nuxt 实例，我们可以通过 `nuxtApp.vueApp` 拿到 Vue 实例从而进行第三方插件或者库的注册，下面是一个引入 `ant-design-vue` 的简单插件：

``` typescript
  import Antd from 'ant-design-vue'
  import 'ant-design-vue/dist/antd.css'

  export default defineNuxtPlugin((nuxt) => {
    nuxt.vueApp.use(Antd)
  })
```

在插件中返回一个包含 `provide` 属性的对象，我们可以在 Nuxt 实例中注入一些全局内容，从而在任意组件中通过 `useNuxtApp` 来使用：

``` typescript
  // page1.vue
  export default defineNuxtPlugin(() => {
    return {
      provide: {
        scrollToTop: () => {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        },
      },
    }
  })

  // page2.vue
  <script setup>
    const { scrollToTop } = useNuxtApp()
  </script>
```

此外，我们还可以在插件中使用自定义或者内置的组合函数。总之，Nuxt 的插件系统是一个非常强大且灵活的功能。

## 自定义 html 模板

有时候我们需要自定义页面 html 结构。 使用内置的 `useHead` 组合函数，可以让我们以编程式和响应式的方法去管理 head 标签，如 `script`, `link`, `meta` 等。

以上就是一个基本的 Nuxt3 项目的核心概念，了解这些之后我们就可以直接进行开发了。在 `layouts` 下定义好页面整体结构， `components` 下写组件，在 `composables` 下抽象出一些公共的业务逻辑，在 `utils` 下写一个常用的工具方法，就可以在 `pages` 下声明的页面里直接使用他们。

