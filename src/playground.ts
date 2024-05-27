import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'

export class Playground {
  constructor() {
    const options = {
        //cursorBlink: true,
        //cols: 30, rows: 30,
        //fontSize: 30,
        theme: {
            foreground: "white",
            background: "slategray",
        },
    }
    this._term = new Terminal(options)

    this._fitAddon = new FitAddon()
    this._term.loadAddon(this._fitAddon)  // not working?
  }

  run(divName: string) {
    const el = document.getElementById(divName)

    this._term.onResize((arg) => this.onResize(arg))
    this._term.onKey((arg) => this.onKey(arg))

    this._term.open(el!)


    this._term.write("prompt>")
  }

  onKey(arg: any) {
    console.log("key", arg)
    this._term.write("X")
  }

  onResize(arg: any) {
    console.log("resize", arg)
  }


  private _term: Terminal
  private _fitAddon: FitAddon
}
