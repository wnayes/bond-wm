exports.config = {
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
        wallpaper: "$APP_PATH$/packages/wallpaper"
    },
};
