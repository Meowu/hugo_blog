---
title: "Generate Sha256 Hash in Javascript"
keywords: ["Web Crypto API", "SHA-256", "md5", "Web API", "Hash Algorithm in Browser", "crypto-js"]
date: 2024-04-28T21:33:31+08:00
---

部门有个文件管理系统，用于发布内部开发的客户端或者 SDK ，在上传文件的时候，会计算文件的哈希值。

用了很长时间后，最近上传文件时在计算 hash 值那一步报错，花点时间定位了一下这个问题。

之前的代码是使用 [crypto-js](https://github.com/brix/crypto-js) 这个库来实现的，我们先来看一下如何使用它来计算哈希值。

## 使用 crypto-js 计算哈希值

先通过 `npm install crypto-js` 安装依赖，然后导入 `crypto-js` 库。

```javascript
import sha256 from 'crypto-js/sha256';

function sha256(data) {
    const hash = CryptoJS.SHA256(data).toString();
    return hash;
}
```

Hash 算法的输入接收字符串或者 `CryptoJS.lib.WordArray` 实例，如果我们输入字符串，那么 `CryptoJS.SHA256` 函数会自动将字符串转换为 `WordArray` 实例。

所以，我们可以直接将文件内容作为输入。

如果要手动创建一个 `WordArray` 实例，可以这样写：

```javascript
const wordArray = CryptoJS.lib.WordArray.create(data);
const sha256 = CryptoJS.SHA256(wordArray).toString();
```

Hash 算法的输出不是一个字符串而是一个 `WordArray` 对象，我们可以调用 `toString()` 方法将结果转换为十六进制字符串。

如果想要输出 Base64 格式，可以调用 `toString(CryptoJS.enc.Base64)` 方法。

```javascript
const base64 = CryptoJS.SHA256(data).toString(CryptoJS.enc.Base64);
```


## 出现问题

对比了一下，之所以出现问题应该是因为文件太大导致的。之前发布的包最多只有 100 多 MB ，这次发布的包大小达到了 230 MB。

文件太大的话，用 `crypto-js` 计算哈希值，内存会溢出。

## 使用 SubtleCrypto 计算哈希值

Javascript 提供了一个 [SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) 接口，可以用于加密和哈希计算。

我直接移除了 `crypto-js` 依赖，使用原生的 `SubtleCrypto` 接口来计算哈希值。

这里主要用到的是 `SubtleCrypto` 接口的 `digest()` 方法计算哈希值。

`digest` 方法接受两个参数：

* `algorithm`: 要使用的哈希算法，如 `SHA-256`、`SHA-384` 或 `SHA-512`
* `data`: 要计算哈希值的 buffer 数据

输入 `ArrayBuffer` 数据，异步计算完成后返回的也是 `ArrayBuffer` 数据。

我们可以先使用 `TextEncoder` 将数据转换为 `ArrayBuffer` 数据输入，但输出 `ArrayBuffer` 数据结果无法直接转换为十六进制字符串，我们需要将 `ArrayBuffer` 转换为 `Uint8Array`，然后使用 `map` 方法将每个字节转换为十六进制字符串。

完成代码如下：

```javascript
const hash = async (data) => {
  const dataBuffer = new TextEncoder().encode(data)
  const hashBuffer = await await crypto.subtle.digest('SHA-256', dataBuffer);
  const uint8Array = new Uint8Array(hashBuffer);
  const hexString = Array.from(uint8Array, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

## 总结

以上就是在浏览器中计算文件哈希值的两种方法，其中 `crypto-js` 方法比较简单易用，而 `SubtleCrypto` 方法则更符合现代 Web 标准。

1. `crypto-js` 方法虽然比较方便地进行摘要计算，但计算大文件时会出错，因为 `crypto-js` 将整个文件加载到内存中，而文件过大会导致内存溢出；
2. `SubtleCrypto` 接口可以异步地计算哈希值，适用于计算大文件；并且是浏览器原生支持的，不需要额外安装依赖，目前的浏览器支持也十分完善了；

## References

* [MDN: SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
* [MDN: TextEncoder](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder)