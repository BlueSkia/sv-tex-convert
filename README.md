# sv-tex-convert

## What

Web interface to easily convert between FF14's tex format and DirectX's DDS.

## Quick start

```sh
# Install deps
pnpm i

# Dev server
pnpm run dev
```

This project uses [Kaitai Struct](https://kaitai.io/), so the compiler is also needed if you need to change the format definitions in [src/lib/parsers](./src/lib/parsers).

## Building

```sh
pnpm run build
```

## Credits

Made with [svelte](https://svelte.dev) and [`sv`](https://github.com/sveltejs/cli).

DDS and TEX parsers based off of [kartoffels123/ffxiv-tex-converter](https://github.com/kartoffels123/ffxiv-tex-converter).

## License

[MIT](https://mit-license.org/)
