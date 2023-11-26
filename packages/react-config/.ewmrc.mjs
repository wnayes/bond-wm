export const config = {
  /** Layout to use initially. */
  initialLayout: "Floating",

  /** Tag to select initially. */
  initialTag: "1",

  /** Virtual desktop names. */
  tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],

  /** Default terminal. */
  term: "xterm",

  /** Plugin configuration. */
  plugins: {
    desktop: {
      id: "$APP_PATH$/packages/react-desktop",
    },
    frame: {
      id: "$APP_PATH$/packages/react-frame",
      settings: {
        $modules: ["config"],
        config: "$APP_PATH$/packages/react-config/frame",
      },
    },
    layout: [
      {
        id: "$APP_PATH$/packages/layout-floating",
        settings: {
          name: "Floating",
          floatRight: false,
        },
      },
      "$APP_PATH$/packages/layout-tiling",
    ],
    taskbar: ["$APP_PATH$/packages/taskbar-clock", "$APP_PATH$/packages/taskbar-layout-indicator"],
    wallpaper: "$APP_PATH$/packages/wallpaper",
  },
};
