import { Shell } from "@jupyterlite/cockle"
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'

export class Playground {
  constructor() {
    const options = {
      theme: {
        foreground: "black",
        background: "ivory",
        cursor: "slategray"
      },
    }
    this._term = new Terminal(options)

    this._fitAddon = new FitAddon()
    this._term.loadAddon(this._fitAddon)
  }

  async run(element: HTMLElement): Promise<void> {

    const outputCallback = async (output: string) => {
      //console.log("from shell:", output)
      this._term.write(output)
    }

    this._shell = new Shell(outputCallback)
    const { FS } = await this._shell.initFilesystem()

    // Add some dummy files.
    FS.writeFile('file.txt', 'This is the contents of the file');
    FS.writeFile('other.txt', 'Some other file');
    FS.mkdir('dir')

    this._term.onResize((arg) => this.onResize(arg))
    this._term.onKey((arg) => this.onKey(arg))

    const resizeObserver = new ResizeObserver((entries) => {
      this._fitAddon.fit()
    })

    this._term.open(element)
    this._shell.start()
    resizeObserver.observe(element)
  }

  onKey(arg: any) {
    this._shell!.input(arg.key)
  }

  onResize(arg: any) {
    this._shell!.setSize(arg.rows, arg.cols)
  }

  private _term: Terminal
  private _fitAddon: FitAddon
  private _shell?: Shell
}
