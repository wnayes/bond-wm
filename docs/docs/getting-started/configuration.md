---
sidebar_position: 2
---

# Configuration

Setting up bond-wm with your own configuration is the first step towards
customizing your desktop.

## Quick Setup

Use the following setup script to create a new bond-wm config. This script
requires a `git` installation.

```
npx @bond-wm/init
```

What this script does:

- Prompts for a config location.
- Uses `$XDG_CONFIG_HOME/bond-wm-config` by default (usually `~/.config/bond-wm-config`).
- Prompts for a template (`react` today).
- Clones the template branch into your chosen folder.

At this point, you have a local git repository that configures bond-wm.
You'll want to [get the window manager running](./running), but you're
otherwise free to start making tweaks inside the configuration.

Be sure to perform an `npm install` within the configuration folder to
set up dependencies, and repeat any time after you make package.json changes.

```
cd ~/.config/bond-wm-config
npm install
```

## Config Entry Point

Your config package exports a default `IConfig` object. The default React
template is a good baseline:

- core WM config in `index.ts`
- desktop renderer UI in `desktop/desktop.tsx`
- frame renderer UI in `frame/frame.tsx`
- theme values in `theme.ts`

Continue with:

- [Configuration Reference](../configuration/config-reference)
- [React Config Guide](../configuration/react-config-guide)
- [Layouts](../configuration/layouts)
- [Multi-Monitor Behavior](../configuration/multi-monitor)

## Optional Git Branch Setup

The working copy in the cloned repository branch is going to be compatible with
the latest release of bond-wm. When a new bond-wm release occurs in the
future, it may coincide with upstream updates to the config template branch.

To set yourself up to more easily accept future config updates, it is
recommended to create a new branch in the git repository.

```
cd ~/.config/bond-wm-config
git checkout -b config-personal
```

Then, as you customize your desktop, you can commit to this branch.

When you want to take upstream template changes, you can `git fetch` those and
rebase your branch, addressing any merge conflicts as needed.
