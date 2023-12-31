# @electron-wm/react-taskbar

A React-based taskbar component for the `electron-wm` window manager.

## Usage

Use the `Taskbar` component within your desktop component.

```tsx
import { Taskbar, TagList, TaskList, RunField, SystemTray, Clock, LayoutIndicator } from "@electron-wm/react-taskbar";

const screenIndex = useScreenIndex();
return (
  <Desktop>
    <Taskbar height={20}>
      <TagList />
      <RunField />
      <TaskList />
      {screenIndex === 0 && <SystemTray />}
      <Clock />
      <LayoutIndicator />
    </Taskbar>
    <WorkArea>
      <Wallpaper />
    </WorkArea>
  </Desktop>
);
```
