import { ShellManager } from '@jupyterlite/cockle';
import "./style/playground.css"
import { Playground } from "./playground"

document.addEventListener("DOMContentLoaded", async () => {
  const baseUrl = window.location.href;
  const shellManager = new ShellManager();
  const browsingContextId = await shellManager.installServiceWorker(baseUrl);

  const targetDiv: HTMLElement = document.getElementById('targetdiv')!;
  const playground = new Playground({ baseUrl, browsingContextId, shellManager, targetDiv });
  await playground.start();
})
