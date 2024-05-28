import "./style/playground.css"
import { Playground } from "./playground"

document.addEventListener("DOMContentLoaded", () => {
  const div: HTMLElement = document.getElementById("targetdiv")!
  const playground = new Playground()
  playground.run(div)
})
