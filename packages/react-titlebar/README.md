# @bond-wm/react-titlebar

A frame window titlebar component implementation for the `bond-wm` window manager.

## Usage

Use the `TitleBar` component within your window frame component.

```tsx
import {
  TitleBar,
  TitleBarCloseButton,
  TitleBarIcon,
  TitleBarMaximizeButton,
  TitleBarMinimizeButton,
  TitleBarText,
} from "@bond-wm/react-titlebar";

return (
  <WindowFrame>
    <TitleBar>
      <TitleBarIcon />
      <TitleBarText />
      <TitleBarMinimizeButton />
      <TitleBarMaximizeButton />
      <TitleBarCloseButton />
    </TitleBar>
    <WindowClientArea />
  </WindowFrame>
);
```
