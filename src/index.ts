import { Playground } from "./playground"

function start() {
  const p = new Playground()
  p.run("targetdiv")
}
document.addEventListener("DOMContentLoaded", start);
