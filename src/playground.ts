import { JupyterFileSystem, Shell } from "@ianthomas23/cockle"
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { ContentsManagerMock } from "./contents_manager_mock"

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
    const fs = await this._createJupyterFileSystem()

    const outputCallback = async (output: string) => {
      //console.log("from shell:", output)
      this._term.write(output)
    }

    this._shell = new Shell(fs, outputCallback)

    this._term.onResize((arg) => this.onResize(arg))
    this._term.onKey((arg) => this.onKey(arg))

    const resizeObserver = new ResizeObserver((entries) => {
      this._fitAddon.fit()
    })

    this._term.open(element)
    this._shell!.start()
    resizeObserver.observe(element)
  }

  onKey(arg: any) {
    this._shell!.input(arg.key)
  }

  onResize(arg: any) {
    this._shell!.setSize(arg.rows, arg.cols)
  }

  async _createJupyterFileSystem(): Promise<JupyterFileSystem> {
    const cm = new ContentsManagerMock()
    await cm.save("file1", {content: "Contents of file1"})
    await cm.save("file2")
    await cm.save("dirA", { type: "directory" })
    return new JupyterFileSystem(cm)
  }

  private _term: Terminal
  private _fitAddon: FitAddon
  private _shell?: Shell
}
