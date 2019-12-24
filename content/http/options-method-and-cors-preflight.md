---
title: "OPTIONS 方法与 CORS 预检"
date: 2019-12-25T02:24:43+08:00
keywords: ["OPTIONS", "CORS", "跨域请求", "http method", "cross origin", "cors 预检"]
tags: ["HTTP"]
categories: ["技术分享"]
author: "Meowu"
---

## OPTIONS 方法的使用
`OPTIONS` 方法用于请求关于目标资源可用的通讯选项的信息，它允许客户端在没有指明特定操作的情况下，了解资源关联的选项、需要或者服务器功能。
`OPTIONS` 请求即可以针对特定的 `URI` 地址，也可以使用 `*`  来对全站使用。
```
OPTIONS /index.html HTTP/1.1
OPTIONS * HTTP/1.1
```
最常见的是使用它来检测服务器所支持的请求方法：
```bash
  curl -X OPTIONS http://example.org -i
```
根据 [RFC7231](https://tools.ietf.org/html/rfc7231#page-31) 的定义，在使用 `OPTIONS` 的时候，服务端和客户端都有一些值得注意的地方：

服务器返回一个成功响应给 `OPTIONS` 请求时应该返回任何头部字段，表明该服务器所实现的一些可选的特性，或者可以应用到目标资源上的，比如 `Allow` 头部。
服务器的响应体中如果没有返回任何内容，必须返回一个值为 0 的 `Content-Length` 字段。以下是一个从  [Medium](https://medium.com/) 请求中摘取的 `OPTIONS` 请求相应头：
```
access-control-allow-credentials: true
access-control-allow-headers: LightStep-Access-Token, Content-Type
access-control-allow-methods: POST
access-control-allow-origin: *
content-length: 0
date: Mon, 23 Dec 2019 16:10:52 GMT
status: 200
```

客户端生成一个包含请求体的 `OPTIONS` 请求时，必须发送一个有效的 `Content-Type` 头部字段来描述响应的媒体类型。虽然目前尚未明确定义请求体的使用场景，未来 HTTP 可能使用它来对目标资源做更详细的查询。
此外，返回给 `OPTIONS` 方法的响应内容是不可缓存的。
## CORS 
因为浏览器有*同源策略*的限制，当应用从与其当前所在的地址不同的的源地址（协议不同、域名不同或端口不同）请求资源时，就会发生跨域请求。在 `XHR` 或者 `FETCH` 请求以及 `ctx.drawImage` 方法把图片或者视频绘制到画布的时候都有可能遇到跨域问题。

`CORS(Cross-Origin Resource Sharing)`  定义了在必须访问跨域资源时，浏览器应该如何与服务器进行通讯。`CORS` 的本质，就是使用自定义的 `HTTP` 头部让浏览器与服务器进行沟通，从而决定请求或响应时应该成功，还是应该失败。

### CORS 预检请求
> _`CORS` 通过一种叫做 `Preflighted Requests` 的透明服务器验证机制支持开发人员使用自定义的头部、`GET`  或者  `POST`  和 `HEAD` 之外的方法，以及不同类型的主体内容。_ 

意思就是，当满足某些条件时，不会触发 `CORS` 的预检请求，这种请求我们称之为「简单请求」，它需要满足以下条件：
##### 使用以下任一方法：

1. GET
2. HEAD
3. POST

##### 只能使用以下头部字段 ：
Fetch 规范把它们定义为 [对 CORS 安全的首部字段集合](https://fetch.spec.whatwg.org/#cors-safelisted-request-header)
*  [Accept](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Accept) 
*  [Accept-Language](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Accept-Language) 
*  [Content-Language](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Language) 
*  [Content-Type](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Type)  （需要注意额外的限制）
*  [DPR](http://httpwg.org/http-extensions/client-hints.html#dpr) 
*  [Downlink](http://httpwg.org/http-extensions/client-hints.html#downlink) 
*  [Save-Data](http://httpwg.org/http-extensions/client-hints.html#save-data) 
*  [Viewport-Width](http://httpwg.org/http-extensions/client-hints.html#viewport-width) 
*  [Width](http://httpwg.org/http-extensions/client-hints.html#width) 
#####  Content-Type 的值仅限于下列三者之一：
* text/plain
* multipart/form-data
* application/x-www-form-urlencoded
##### 请求中的任意 XMLHttpRequestUpload 对象均没有注册任何事件监听器；XMLHttpRequestUpload 对象可以使用  XMLHttpRequest.upload  属性访问。
##### 请求中没有使用  ReadableStream 对象。
下面两个例子：
```javascript
const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                    document.body.innerText = xhr.responseText;
                } else {
                    console.log('Request failed: ', xhr.status);
                }
            }
        }
        xhr.open('POST', 'http://127.0.0.1:3000/message', true);
        xhr.send(null);
```
```
// Request Headers
Accept: */*
Accept-Encoding: gzip, deflate, br
Accept-Language: en,zh-CN;q=0.9,zh;q=0.8,zh-TW;q=0.7,fr;q=0.6,zu;q=0.5,ja;q=0.4
Connection: keep-alive
Content-Length: 0
Host: 127.0.0.1:3000
Origin: http://127.0.0.1:4000
Referer: http://127.0.0.1:4000/
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-site
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36
```
在上面的代码中，`POST` 方法符合规则，是一个简单的请求，所以不会发起预检请求。
不符合简单请求条件的请求我们称为「需预检的请求」。假设我们给刚才的请求加上一个额外的头部 `Content-Type` ，它不属于 `text/plain` `multipart/form-data`  `application/x-www-form-urlencoded`  三者之一，在发起真正请求之前会先发送一个 `OPTIONS` 预检请求到服务器。
```javascript
const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                    document.body.innerText = xhr.responseText;
                } else {
                    console.log('Request failed: ', xhr.status);
                }
            }
        }
        xhr.open('POST', 'http://127.0.0.1:3000/message', true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(null);

```
`OPTIONS` 请求头部：
```
Accept: */*
Accept-Encoding: gzip, deflate, br
Accept-Language: en,zh-CN;q=0.9,zh;q=0.8,zh-TW;q=0.7,fr;q=0.6,zu;q=0.5,ja;q=0.4
Access-Control-Request-Headers: content-type // new header
Access-Control-Request-Method: POST // new header
Connection: keep-alive
Host: 127.0.0.1:3000
Origin: http://127.0.0.1:4000
Referer: http://127.0.0.1:4000/
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-site
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36
```

可以看到，此时浏览器会在 `OPTIONS` 请求中发送两个往外的请求，服务器收到请求后决定是否允许该类型的请求，在响应中发送以下头部进行沟通：

* Access-Control-Allow-Origin: 与简单的请求相同
* Access-Control-Allow-Methods: 允许的方法，以逗号隔开
* Access-Control-Allow-Headers: 允许头部，多个头部以逗号隔开
* Access-Control-Max-Age: 这个 OPTIONS 请求缓存多久（以秒表示）

以下是一段简单的使用 `express` 的处理代码：
```javascript
const express = require('express');
const app = express();
const WHITE_LIST = ['http://127.0.0.1:4000']
app.use((req, res, next) => {
    const { origin } = req.headers;
    console.log('options headers', req.headers);
    if (WHITE_LIST.includes(origin)) {
        const headers = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': '*'
        }
        const reqHeader = req.headers['access-control-request-headers'];
        if (reqHeader) {
            headers['Access-Control-Allow-Headers'] = reqHeader;
        }
        res.set(headers);
        if (req.method === 'OPTIONS') {
            res.end();
        }
    }
    next();
})
```
要注意的是，简单请求和预检请求的主要区别在于，是否要发送额外的 `OPTIONS` 请求来检验服务器是否支持发送的方法或者自定义头部。
### 带身份凭证的请求
默认情况下，跨域请求不发送 `cookie` ，如果想要发送凭据，需要为该请求指定  `xhr.withCredentials = true` 。此时，服务器需要在响应中返回：
```
Access-Control-Allow-Credentials: true
```
否则，请求会被忽略，浏览器不会把响应的内容返回给客户端。此外，对于附带身份凭证的请求，服务器不得设置 `Access-Control-Allow-Origin` 的值为 `*` 。这是因为请求的首部中携带了 Cookie 信息，如果设置 `Access-Control-Allow-Origin: '*'` ，请求将会失败，需要设置 `Access-Control-Allow-Origin: req.headers.origin` 。


