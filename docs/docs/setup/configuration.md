---
sidebar_position: 2
---

# Configuration

Setting up electron-wm with your own configuration is the first step towards
customizing your desktop.

## Quick Setup

Use the following setup script to create a new electron-wm config. This script
requires a `git` installation.

```
npx @electron-wm/init
```

What does this script do?

- It prompts you for a location to install the configuration.
  - The default is `$XDG_CONFIG_HOME/electron-wm-config/`, which is typically `~/.config/electron-wm-config/`
- It prompts you for a template to base your configuration from.
  - The only template available currently is `react`.
- It performs a `git clone` of your chosen template into the folder you chose.
  - For the `react` template, you get a local clone of
    `https://github.com/wnayes/electron-wm/tree/react-config-release`

At this point, you have a local git repository that configures electron-wm.
You'll want to [get the window manager running](./running), but you're
otherwise free to start making tweaks inside the configuration.

## Optional Git Branch Setup

The working copy in the cloned repository branch is going to be compatible with
the latest release of electron-wm. When a new electron-wm release occurs in the
future, it may coincide with upstream updates to the config template branch.

To set yourself up to more easily accept future config updates, it is
recommended to create a new branch in the git repository.

```
cd ~/.config/electron-wm-config
git checkout -b config-personal
```

Then, as you customize your desktop, you can commit to this branch.

When you want to take upstream template changes, you can `git fetch` those and
rebase your branch, addressing any merge conflicts as needed.
