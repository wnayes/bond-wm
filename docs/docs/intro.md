---
sidebar_position: 1
slug: /
---

# Introduction

Bond Window Manager is an [X window manager](https://en.wikipedia.org/wiki/X_window_manager) that gives web developers a familiar platform for total customization of their desktop appearance.

The goal is to thoughtfully apply front-end technologies to the desktop. Today this means:

- [Node.js](https://nodejs.org) driving a window manager core, which creates desktop and frame windows using [Electron](https://www.electronjs.org/) and its underlying Chromium engine.
- [Vite](https://vitejs.dev/) providing first class support for TypeScript, JSX, CSS modules, and more. Vite enables "hot module replacement" for rapid iteration on desktop styling.
- [React](https://react.dev/) as the primary supported UI library.

Layout of windows is [dynamic](https://en.wikipedia.org/wiki/Dynamic_window_manager). Floating and tiling layouts are supported, but layout behavior is pluggable with custom layout implementations.
