# Contributing to Virgo Terminal

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) in project spaces.

## Report a bug or propose a change

Search [existing issues](https://github.com/virgo-galaxy/virgo-terminal/issues) before opening a new one. For a bug, include the affected demo or package, steps to reproduce it, and the expected and actual behavior. For Local Shell reports, include your operating system and the shell you selected.

For a public API change, describe the use case and how it would affect existing callers.

## Set up the workspace

Fork and clone the repository, then create a branch from `main`. Use Node.js 24 and the pnpm version in [package.json](package.json).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

React component code and its tests live in [packages/react](packages/react). Demos and local shell integration live in [apps/playground](apps/playground).

## Build the Windows desktop client

From [apps/local-client](apps/local-client), run `go generate .` to embed the app icon and Windows manifest. Then build the x64 desktop executable. Use the GUI linker option so launching the app from Explorer opens its native window.

```powershell
go generate .
$env:GOARCH = 'amd64'
go build -ldflags '-H=windowsgui' -o dist/virgo-terminal-windows-x64.exe .
```

## Verify and open a pull request

Run the same checks used by CI.

```sh
pnpm check
```

Open a focused pull request against `main`. Describe what changed and how you tested it. For a visual change, include a screenshot. For a terminal interaction change, name the Playground example you tested.
