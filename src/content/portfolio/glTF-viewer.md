---
title: glTF Viewer w/ Cel Shading
description: |
  An 3d glTF viewer written in C++ with openGL.
tags:
  - OpenGL
  - C++
  - glTF
---

## Description
A glTF file viewer and shader program developed for a course on computer graphics at Uppsala University. 

## Method
An implementation of [cel-shading](https://en.wikipedia.org/wiki/Cel_shading), a type of non-photorealistic rendering widely used in computer graphics to make objects appear flat and hand-drawn by limiting colors and adding outlines. It is also known as __toon shading__ because it is typically used to mimic the style of a cartoon. 

A longer description can be found [here](https://github.com/kaischuygon/gltf_viewer/blob/main/report/finalReport.pdf). 

__tl;dr__: I calculated a depth and normal texture in a seperate framebuffer and applied the sobel operator to detect edges. The detected edges are then rendered black and the rest is rendered using the quantized lighting to create the full effect.

[View on GitHub](https://github.com/kaischuygon/gltf_viewer)