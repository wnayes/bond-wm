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

What does this script do?

- It prompts you for a location to install the configuration.
  - The default is `$XDG_CONFIG_HOME/bond-wm-config/`, which is typically `~/.config/bond-wm-config/`
- It prompts you for a template to base your configuration from.
  - The only template available currently is `react`.
- It performs a `git clone` of the template into the folder chosen earlier.
  - For the `react` template, you get a local clone of
    `https://github.com/wnayes/bond-wm/tree/react-config-release`

At this point, you have a local git repository that configures bond-wm.
You'll want to [get the window manager running](./running), but you're
otherwise free to start making tweaks inside the configuration.

Be sure to perform an `npm install` within the configuration folder to
set up dependencies, and repeat any time after you make package.json changes.

```
cd ~/.config/bond-wm-config
npm install
```

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
