import "./style/playground.css"
import { Playground } from "./playground"

document.addEventListener("DOMContentLoaded", async () => {
  const targetDiv: HTMLElement = document.getElementById("targetdiv")!
  const playground = new Playground({ targetDiv })
  await playground.start()
})
