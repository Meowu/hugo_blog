---
title: "webpack 中环境变量的使用"
date: 2020-05-29T18:42:34+08:00
keywords: ["webpack", "代码打包", "webpack 环境变量", "process.env", "process.env.NODE_ENV", "全局编译变量"]
tags: ["webpack"]
categories: ["技术分享"]
author: "Meowu"
---

## process.env 环境类型

`process.env` 返回一个包含当前用户环境变量的对象，在我的电脑上执行 `node -e "console.log(process.env)"` 可以看到输出了以下的内容：

```bash
{
  TERM_PROGRAM: 'iTerm.app',
  NVM_CD_FLAGS: '',
  TERM: 'xterm-256color',
  SHELL: '/bin/bash',
  TERM_PROGRAM_VERSION: '3.3.9',
  http_proxy: 'http://127.0.0.1:1087',
  NVM_DIR: '/Users/joi/.nvm',
  ...
}
```

我们可以对该对象进行修改，但是这些修改仅限于在当前的进程生效，也不会影响到其他 worker 线程。

```bash
$ node -e 'process.env.foo = "bar"' && echo $foo
# 这里不会打印内容

$ node -e 'process.env.foo = "bar"; console.log(process.env.foo)'
bar
```

## webpack  配置环境变量

有时候我们需要基于构建环境的差异，使用不同的 `webpack.config.js` 配置。`webpack`  命令行工具支持我们在 `--env` 选项中传递任意多的变量：

```bash
webpack --env.local --env.VERSION=1
```

它只是我们在 `webpack` 配置中用到的*环境变量*，跟表示用户本地环境的 `process.env` *环境类型*是完全不一样的。

如果我们要使用这些变量，`webpack.config.js`  默认导出的配置文件就需要从一个对象变成一个函数：

```JavaScript
module.exports = env =>  {
  console.log('env.VERSION', env.VERSION); // 1
  console.log('env.local', env.local); // true
  return {
    mode: 'development',
    entry: {
      index: './src/index.js'
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist')
    },
  }
}

```
在 `--env` 选项中，如果我们不指定键值对的形式，变量的值会默认为 `true` ，所以上述配置中 `env.local = true` 。

## DefinePlugin 插件

有时候我们需要在代码中基于环境做条件判断来执行不同的代码，例如这样：

```JavaScript
if (process.env.NODE_ENV === 'development') {
  console.log('Development: ...')
}
```

除了使用 `process.env` ， `webpack` 自带的 `DefinePlugin` 允许我们定义全局编译常量，在不同的构建环境下做不同的事情。插件参数的变量名，既可以是单个标志符，也可以是 `.` 号分隔的嵌套属性名：

```JavaScript
new webpak.DefinePlugin({
  __DEV__: true,
  __TEST__: JSON.stringify(true),
  PRODUCTION: "'production'",
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
})
```

因为构建的时候是直接进行文本替换，所以变量值字符串需要带有引号，是 `'"production"'`  而不是 `'production'` ，或者使用 `JSON.stringify('production')` ，不然构建后替换的代码会变成 `production` 变量导致执行异常。

然后我们就可以直接使用这些全局常量了：

```JavaScript
  if (__DEV__) {
    // ...
  }
```

如果在 `TypeScript` 中使用，记得给这些常量声明全局类型：

```TypeScript
// global.d.ts
declare var __DEV__: boolean;
declare var PRODUCTION: string;
...
```

从 `webpack v4` 起，我们在配置文件中指定 `mode` 的话会自动在 `DefinePlugin`  中配置 `process.env.NODE_ENV` 。

我们也可以在执行命令行的时候这样写：

```
  webpack  —define process.env.NODE_ENV="'production'"
```
跟在 `DefinePlugin` 中定义是一样的。

编译后除了进行值的替换，在不同的构建环境下 `webpack` 会有不同的处理， `if (__DEV__) { //… }`  这样的代码库，当 `__DEV__` 为 `false` 时，相当于死代码（ dead code），生产环境下会直接被删掉。