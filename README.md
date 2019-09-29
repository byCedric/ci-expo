# Expo for GitHub Actions

> GitHub Actions is still in beta, use it at your own risk.

Publish, build or manage your [Expo][link-expo] Project with GitHub Actions!
This repository contains a prebuilt base image with GitHub Actions implementations.
You can also use [the base image][link-base] in other Docker-based environments.

1. [What's inside?](#whats-inside)
2. [Used secrets](#used-secrets)
3. [Example workflows](#example-workflows)
4. [Things to know](#things-to-know)

## What's inside?

Within this Expo CLI action, you have full access to the original [Expo CLI][link-expo-cli].
That means you can perform any command like login, publish and build.
Also, this action will authenticate automatically when both `EXPO_CLI_USERNAME` and `EXPO_CLI_PASSWORD` variables are defined.

> You don't necessarily need this action to use Expo.
> You can also add `expo-cli` as a dependency to your project and use the official [NPM action][link-actions-npm] for example.
> However, when you do that you need to manage authentication yourself.

## Used secrets

To authenticate with your Expo account, use the variables listed below. For more info, see [Automatic Expo login](#automatic-expo-login).

variable            | description
---                 | ---
`EXPO_CLI_USERNAME` | The email address or username of your Expo account.
`EXPO_CLI_PASSWORD` | The password of your Expo account, [automatically picked up by the cli][link-expo-cli-password].

## Example workflows

Before you dive into the workflow examples, you should know the basics of GitHub Actions.
You can read more about this in the [GitHub Actions documentation][link-actions].

1. [Publish on any push](#publish-on-any-push)
2. [Publish on a specific branch](#publish-on-a-specific-branch)
3. [Test and build web every day at 08:00](#test-and-build-web-every-day-at-0800)

### Publish on any push

Below you can see the example configuration to publish whenever the repository is updated.
The workflow listens to the `push` event and resolves directly to the `publish` action.
Before publishing your app, it installs your project's dependencies using the [NPM action][link-actions-npm].

```hcl
workflow "Install and Publish" {
  on = "push"
  resolves = ["Publish"]
}

action "Install" {
  uses = "actions/npm@master"
  args = "install"
}

action "Publish" {
  needs = "Install"
  uses = "expo/expo-github-action@3.0.0"
  args = "publish"
  secrets = ["EXPO_CLI_USERNAME", "EXPO_CLI_PASSWORD"]
}
```

### Publish on a specific branch

This workflow is similar to the [publish on any push](#publish-on-any-push) configuration.
It will install and test the code using the [NPM action][link-actions-npm] on every push.
But instead of publishing on any push too, it will publish on the `master` branch only.

```hcl
workflow "Install and Publish" {
  on = "push"
  resolves = ["Publish"]
}

action "Install" {
  uses = "actions/npm@master"
  args = "install"
}

action "Test" {
  needs = "Install"
  uses = "actions/npm@master"
  args = "test"
}

action "Filter branch" {
  needs = "Test"
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Publish" {
  needs = "Filter branch"
  uses = "expo/expo-github-action@3.0.0"
  args = "publish"
  secrets = ["EXPO_CLI_USERNAME", "EXPO_CLI_PASSWORD"]
}
```

### Test and build web every day at 08:00

The most significant change here is that we've changed the workflow trigger.
Instead of listening to push events, it's scheduled to run every day at 08:00.

> For web builds, you don't need to be authenticated.
> That's why `secrets = [...]` is omitted here.

```hcl
workflow "Install, Test and Build for Web" {
  on = "schedule(0 8 * * *)"
  resolves = ["Build"]
}

action "Install" {
  uses = "actions/npm@master"
  args = "install"
}

action "Test" {
  needs = "Install"
  uses = "actions/npm@master"
  args = "test"
}

action "Build" {
  needs = "Test"
  uses = "expo/expo-github-action@3.0.0"
  args = "build:web"
}
```

### Things to know

#### Automatic Expo login

You need to authenticate for some Expo commands, like `expo publish` and `expo build:*`.
This project has an additional feature to make this easy and secure.
The [`entrypoint.sh`][link-expo-cli-proxy] is a simple bash script which is [set as a proxy for the original `expo` command][link-docker-expo-proxy].
If you don't want to use this, you can call the original Expo command directly using `expo-cli publish`.

#### Why use a base-image?

Every GitHub action will start from scratch using the dockerfile as the starting point.
If you define `expo-cli` in this dockerfile, it will install it every time you run an action.
By using [a prebuilt image][link-base], it basically "skips" the process of downloading the full CLI over and over again.
This makes the Expo actions overall faster.

#### Overwriting `NODE_OPTIONS`

By default, Node has a "limited" memory limit.
To fully use the available memory in GitHub Actions, [the `NODE_OPTIONS` variable is set to `--max_old_space_size=4096`][link-docker-node-options].
If you need to overwrite this variable, make sure you add this value too or risk Node running out of memory.
See [issue #12][link-issue-memory] for more info.

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.

--- ---

<p align="center">
    with :heart: <a href="https://bycedric.com" target="_blank">byCedric</a>
</p>

[link-actions]: https://developer.github.com/actions/
[link-actions-npm]: https://github.com/actions/npm
[link-base]: base/3
[link-docker-expo-proxy]: Dockerfile#L7
[link-docker-node-options]: Dockerfile#L11
[link-expo]: https://expo.io
[link-expo-cli]: https://docs.expo.io/versions/latest/workflow/expo-cli
[link-expo-cli-password]: https://github.com/expo/expo-cli/blob/8ea616d8848a123270b97e226e33dcb3dde49653/packages/expo-cli/src/accounts.js#L94
[link-expo-cli-proxy]: entrypoint.sh
[link-issue-memory]: https://github.com/expo/expo-github-action/issues/12
