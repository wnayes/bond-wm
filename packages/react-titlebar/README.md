# @electron-wm/react-titlebar

A frame window titlebar component implementation for the `electron-wm` window manager.

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
} from "@electron-wm/react-titlebar";

export default () => {
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
};
```
