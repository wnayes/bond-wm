# @bond-wm/react-wallpaper

A dynamic React wallpaper component for the `bond-wm` window manager.

The rendering algorithm is modified from
https://github.com/roytanck/wallpaper-generator

## Usage

Use the `Wallpaper` component within your desktop's work area.

```tsx
import { Wallpaper } from "@bond-wm/react-wallpaper";

<Desktop>
  <WorkArea>
    <Wallpaper />
  </WorkArea>
</Desktop>;
```

## License

Since the algorithm's repository is licensed under GPL-3.0 License,
this package is also licensed under GPL-3.0 License.
See the `LICENSE` file.
