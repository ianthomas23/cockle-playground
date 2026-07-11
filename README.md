Playground for [cockle](https://github.com/jupyterlite/cockle), an in-browser bash-like shell used in [JupyterLite](https://github.com/jupyterlite/jupyterlite), without all the JupyterLite dependencies.

Deployment available on github pages at https://ianthomas23.github.io/cockle-playground (without cross-origin headers).

Local deployment

```bash
npm install
npm run build
npm run serve
```

This serves the playground on two separate ports:

- `http://localhost:4500` without cross-origin headers
- `http://localhost:4501` with cross-origin headers

To use local `cockle` repo for rapid development:
```bash
cd <cockle directory>
npm link
cd <cockle-playground directory>
npm link @jupyterlite/cockle
```
