---
title: "使用 Git 来处理 LF 和 CRLF 的系统差异"
date: 2021-12-31T22:09:06+08:00
keywords: ["CRLF vs LF", "Git config", ".gitattributes", "line break", "line endings"]
tags: ["Git"]
categories: ["工程化"]
author: "Meowu"
---


之前在部署一个外国客户的项目时，需要提交一份 *checklist* ，核对表上提到的代码检查是否已按要求完成，其中有一条是 *To use LF not CRLF* 。第一次看到时虽然能想到应该是跟 **Windows** 和 **Unix** 系统下的换行符不一样有关，并不理解为什么会有这样一条要求，并且我们用的都是 **macOS** ，也不会存在这样的差异。不过抱着严谨的态度，也正好学习一下，就花了点时间去研究了一下这个问题。


## 换行符
我们在输入文字的过程中一般通过按下回车键来进行换行，此时会在行末插入一个看不见的换行符。这个换行符主要有以下两种：

*  **Windows** ： *CR(carriage return)* ， (character : \r, Unicode : U+000D, ASCII : 13, hex : 0x0d)
*  **Linux  & macOS** ： *LF(line feed)* ， (character : \n, Unicode : U+000A, ASCII : 10, hex : 0x0a) 

至于为什么会有这样的差异，以及换行符的由来这里不再展开，感兴趣的同学强烈推荐看一下这篇文章：[CRLF vs. LF: Normalizing Line Endings in Git](https://www.aleksandrhovhannisyan.com/blog/crlf-vs-lf-normalizing-line-endings-in-git/#teletypewriters-and-the-birth-of-crlf) 。

### 查看换行符

因为它们在文本中是看不见的，我们可以在命令行将其打印出来看一下这两者的区别。我建了一个测试仓库，一边在 Mac 下操作，同时远程连上一台 Windows 使用 git bash 进行操作，分别新建一个文件并提交。

在 *macOS* 的命令行下执行：

```bash
cat -ve file.txt
# windows 下是 cat -A file.txt 
```

可以看到 *Windows* 下创建的文件每行末尾会打印出来 `^M$` (CRLF)，而 *macOS* 下创建的文件打印的只有 `$`（LF）。

当然也可以不必这么麻烦，直接通过 `brew install unix2dos` 安装命令行工具来转换成 *Windows* 的文件也可以。

这个时候我意识到客户为什么会要求我们使用 *LF* 而不是 *CRLF* 了。当多人通过 *Git* 在同一个项目中进行协作时，如果大家使用的系统不一样，并且我们也无法保证大家使用的系统一样，这个时候就会带来麻烦。假如使用不同系统的人编辑了同一个文件，Windows 下该文件使用了 **CRLF** 作为换行符，**Unix** 下该文件使用了 *LF* ，当这个文件被提交后就会出现冲突，这并不是我们想看到的。

这个时候我们就需要通过一些配置来确保不同用户下的文件换行符保持一致。


## 使用 Git 来处理换行符
Git 支持通过配置项来处理文件中的换行符。

### core.autocrlf

我们可以执行以下命令来当配置前用户所有 repo 的表现:

```
$ git config --global core.autocrlf true
$ git config --global core.autocrlf false
$ git config --global core.autocrlf input
```

Git 是在用户进行 `checkout` 或者 `add`  时根据配置对换行符进行处理的。

当设置 `core.autocrlf = true` 的时候，会基于用户当前的系统来进行自动转换，在 **Windows** 下进行 *checkout* 就会把 **LF** 转换成 **CRLF**，如果把代码添加（add）到 Git 的缓冲区，又会自动把 **CRLF** 转换成 **LF** 。

如果我们不想在检出 (checkout) 代码的时候自动转换，但是想在添加代码到 Git 时做转换，就可以设置 `core.autocrlf = input` 。
 
当设置 `core.autocrlf = false` 就是告诉 Git 不需要做任何转换。

### .gitattributes

使用 `core.autocrlf` 这种全局配置需要手动去进行配置，每当使用一台新的电脑拉取代码，或者新的用户加入该 repo 时，都要进行一次配置，这显然不是一种最理想的解决办法。

除此之外，我们还可以通过在 **repo** 下配置一个 `.gitattributes` 文件来管理 Git 的行为，它会覆盖 Git 的全局配置，以确保当前 repo 下所有用户的表现一直，不受环境和系统的影响。

```bash
# 强制使用 LF 
* text=auto eol=lf
```

这里 `eol=lf` 告诉 Git 使用 `lf`  来作为换行符。
而对于 `text=auto` ，因为 Git 有自己的一套简单的算法来检测文件是文本文件还是二进制文件，这里是让 Git 自己检测文本。我们也可以添加更多的属性配置：

```bash
# 强制使用 LF 
* text=auto eol=lf

# 告诉 git 这种格式是二进制文件，不用修改
*.png binary
*.jpg binary
```

## 修复换行符
到这里我们对换行符有了一定了解，同时也知道 Git 是如何处理换行符的，以及我们如何通过配置 Git 去保证不同系统下的用户行为一致。

回到我一开始的问题，为了确保满足客户的要求，我需要对全部代码进行检查。如果这个 repo 初始化的时候就配置好 `.gitattributes` 文件（我以后都会这么做）的话，不需要做任何检查就可以提交 checklist 了，但是目前还没有对这个进行配置，所以还是不能马虎，有必要做一下检查的。

我们在命令行下执行对某个文件执行 `file file.txt`  命令，如果使用的是 **LF** 作为换行符，那么输出的会是

```bash
file.txt: ASCII text
```

如果使用了 **CRLF** 那么输出的会是

```bash
file.txt: ASCII text, with CRLF line terminators
```

我在 repo 下执行以下命令，就可以找出我全部代码中哪些文件使用了 **CRLF** 作为换行符：

```bash
find . -not -type d -exec file "{}" ";" | grep CRLF
```

因为开发这个项目的同学用的都是 macOS 所以不会找到任何文件。

上面的方法其实有点麻烦，如果存在使用 `CRLF` 的文件，我可能还要安装 `dos2unix` 来逐个转换成使用 **LF** 。

Git 给我们提供了更便捷的方法， *我们在修改了 `core.autocrlf` 的配置或者添加 `.gitattributes`  文件后* ，执行以下命令：

```bash
$ git add --renormalize .
```

会把所有的文件按照当前的配置一次性修复并添加到 Git 中。

我在测试仓库中试了一下，可以看到文件变化如下：

![Git renormaliza](/images/git-renormalize.png)


## 总结
由于历史原因，**Windows** **Linux** **macOS** 使用了不同的换行符，这在跨平台的协作中会带来一些问题。

我们可以通过 Git 的 `core.autocrlf` 全局配置或者在初始化仓库时配置 `.gitattributes` 文件来保证用户的行为一致性，也可以在更新 Git 配置后很方便地修复历史文件。
