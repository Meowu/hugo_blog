---
title: "使用 SD WebUI 去除图片背景"
date: 2024-02-29T19:46:50+08:00
keywords: ["Stable Diffusion", "Stable Diffusion WebUI", "AIGC", "Background removal", "LLM", "comfyui", "animatediff", "automatic1111", "GPT", "MidJourney"]
tags: ["AI", "LLM"]
categories: ["技术分享"]
author: "Meowu"
---

去除图片背景是一个很常见的需求。使用 Stable Diffusion 来完成这个任务非常简单，这里记录一下如何在 sd webui 进行操作。

## 安装 rembg 扩展

1.  打开已经安装好的 Web-UI 界面，切换到 **Extensions** 界面
2.  点击 **Install from URL** ，在 **URL from extension's git repository** 输入以下地址：
   
   ```
   https://github.com/AUTOMATIC1111/stable-diffusion-webui-rembg
   ```

3.  点击 **Install** 按钮，等待安装完成然后重启 Web-UI 即可

如果本来已经安装了，点击一下 **Installed** 标签下的 **Check for updates** 检查并拉取最新版本，然后重启 WebUI 。

此时我们能够在 **Extras** 页面下看到如下的 **Remove Background** 菜单：

![remove-background](/images/rembg-extension.png)

## 背景去除

我们可以先在 **txt2img** 页面生成一张图片，然后发送到 **Extras** 页面，这里我们直接上传现有的图片。

切换到 **Extras** 页面，点击 **Single Image** 下的 Source 或者直接拖拽图片进去来完成图片的上传。

![extras-source-canvas](/images/extras-source-canvas.png)

点击展开 **Remove background** 菜单，在下拉列表里选择一个模型用来完成背景消除。通常来说，选择 `u2net` 即可。然后点击右边的 **Generate** 按钮开始执行任务，等一会就可以看到去除背景后的图片。

我们也可以在去除背景的同时，对图片进行缩放，这里我们不做缩放，**Upscaler** 选项都保持 **None** 。

把 **Return mask** 勾选上的话，返回的是一张黑白轮廓图，便于我们用于后续的其他任务，如背景替换：

![rembg-mask](/images/rembg-mask.png)


到这里就完成了背景的去除，十分简单。

## 模型对比

在上述过程中，选择了 `u2net` 模型来处理。我顺带测试了一下其他几个模型的效果，发现在 `u2net` `u2netp` `u2net_human_seg` 这个三个模型中，`u2net_human_seg` 的效果是最好的。下面放上两张 `u2net` 和 `u2net_human_seg` 效果的对比图，明显发现 `u2net_human_seg` 对于头发和任务边缘的效果处理得更好。

![sd-web-ui-rembg-0](/images/sd-web-ui-rembg-0.png)


![sd-web-ui-rembg-1](/images/sd-web-ui-rembg-1.png)

以上就是使用 SD WebUI 进行背景去除的过程。如果前景是人物的话，使用 `u2net_human_seg` 模型能够获得更好的效果。
