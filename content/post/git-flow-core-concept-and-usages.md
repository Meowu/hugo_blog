---
title: "Git Flow 的核心概念及其用法"
date: 2018-06-13T20:45:12+08:00
# draft: true
weight: 70
keywords: ["工程化", "开发流程", "git", "核心概念"]
tags: ["Git", "Git-flow"]
categories: ["技术分享", "工程化"]
author: "Meowu"
# CJKLanguage: Chinese, Japanese, Korean 这样中文摘要才会生效
isCJKLanguage: true
thumbnail : "images/jump.jpeg"
---

最近花时间了解了一下 `git-flow` 的用法，它是当下比较流行的工作流程。这个工具的诞生是基于 _Vincent Driessen_ 的文章 [A successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/) ，他在文中介绍了自己从多个项目中实践多年的工程经验中总结出来的这套开发流程。

## git-flow 的核心概念

### 主分支

在整个 repo 的生命周期中应该只包含两个分支： `develop` 和 `master` 。

* _master_ 这个分支只能包含发布到生产环境的代码，不能直接在这个分支上进行工作。
* _develop_ 该分支是进行任何开发的基础，所有其它的次要分支都是从这个分支签出，并且结束分支后都要被合并到这个分支，以保证它始终包含着全部的最新特性。

### 次要分支

项目自始至终应该只包含两个主分支，同时主要有三个次要分支，这些分支需要遵循严格的规定，比如基于哪个分支进行签出，最终必须合并回哪个分支等等，并且<u>它们只存在开发者的本地 `repo` 中，不允许 `push` 到 `origin` 。</u>

* _Features branches_ 特性分支。当需要进行新功能的开发时，开发者需要从 `develop` 签出一个特性分支，该分支的本质是只要当前版本的功能尚未开发完成它就会一直存在，结束后必须合并回 `develop` 分支。当然我们无法确保新特性最终的结果，要么被合并到 develop 分支中，如果通不过测试，也可能会被废弃。

  ```shell
  $ git checkout -b myfeature develop
  Switched to a new branch "myfeature"

  // 合并分支回 develop 分支
  $ git checkout develop
  Switched to branch 'develop'
  $ git merge --no-ff myfeature  // --no-ff 保留 feature 分支的信息，便于 revert
  Updating ea1b82a..05e9557
  (Summary of changes)
  $ git branch -d myfeature
  Deleted branch myfeature (was 05e9557).
  $ git push origin develop

  ```

* _Release branches_ 发布分支。同样是从 develop 分支中签出，完成后被合并回 _develop_  和 _master_ 分支，通常分支命名为 `release-*` 。这个分支主要是用来准备一个新的生产版本的发布，包括准备发布的版本信息，如版本号、构建日期等等。签出该分支的时候，必须保证当前 `develop` 已经包含了即将发布的版本的全部新特性，同时不能包含下个版本的特性。

  直到代码上线前，这个分支会一直存在，期间的小 bug 会在这个分支进行修改，不允许进行大的改动。准备上线时，先将其合并到 `master`分支，然后在 `master`分支上打 `tag` 以便未来引用。最后，再把 `release` 分支合并回 `develop` ，以确保未来的分支都会包含当前这个分支的信息。

  ```shell
  $ git checkout master
  Switched to branch 'master'
  $ git merge --no-ff release-1.2
  Merge made by recursive.
  (Summary of changes)
  $ git tag -a 1.2

  $ git checkout develop
  Switched to branch 'develop'
  $ git merge --no-ff release-1.2
  Merge made by recursive.
  (Summary of changes)

  $ git branch -d release-1.2
  Deleted branch release-1.2 (was ff452fe).
  ```

* _Hotfix branches_ 分支。该分支是从 `master` 分支中签出的，当生产环境出现了一些意外的 `bug` 需要立马解决时，从对应的 `tagged` 的 `master` 中签出一个分支来进行紧急修复，修复后再打包发布。合并到 `master` 分支后还需要合并到 `develop` 分支，以保证其始终包含着最近的更新。不过，如果 `Hotfix` 分支提交的时候 `release` 分支还在，那么需要合并到 `Release` 分支而不是 `develop`  分支，这样 `release` 的时候会包含这些修复，同时 `release` 分支最后也会被合并会 `develop` 分支的。

这就是整个 `git-flow` 流程的主要概念，接下来会介绍 `git-flow` 这些工具的基本用法。