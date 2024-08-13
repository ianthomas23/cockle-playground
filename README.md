Playground for [cockle](https://github.com/jupyterlite/cockle), an in-browser bash-like shell used in [JupyterLite](https://github.com/jupyterlite/jupyterlite), without all the JupyterLite dependencies.

```bash
npm install
npm run build
npm run serve
```

To use local `cockle` repo for rapid development:
```bash
cd <cockle directory>
npm link
cd <cockle-playground directory>
npm link @jupyterlite/cockle
```
