import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { proxy, wrap } from 'comlink'
import { IPlayground, IRemoteWorkerPlayground } from './defs'

export class Playground {
  constructor(options: IPlayground.IOptions) {
    this._options = options

    const termOptions = {
      theme: {
        foreground: "black",
        background: "ivory",
        cursor: "slategray"
      },
    }
    this._term = new Terminal(termOptions)

    this._fitAddon = new FitAddon()
    this._term.loadAddon(this._fitAddon)

    this._initWorker()
  }

  async start(): Promise<void> {
    this._term!.onResize(async (arg: any) => await this.onResize(arg))
    this._term!.onKey(async (arg: any) => await this.onKey(arg))

    const resizeObserver = new ResizeObserver((entries) => {
      this._fitAddon!.fit()
    })

    this._term!.open(this._options!.targetDiv)
    await this._remote!.start()
    resizeObserver.observe(this._options!.targetDiv)
  }

  async onKey(arg: any): Promise<void> {
    await this._remote!.input(arg.key)
  }

  async onResize(arg: any): Promise<void> {
    await this._remote!.setSize(arg.rows, arg.cols)
  }

  private async _initWorker() {
    this._worker = new Worker(new URL('./worker_playground.ts', import.meta.url), {
      type: 'module'
    })

    this._remote = wrap(this._worker)
    await this._remote.initialize({})
    this._remote.registerCallback(proxy(this.outputCallback.bind(this)))
  }

  private outputCallback(text: string): void {
    this._term!.write(text)
  }

  private _options: IPlayground.IOptions
  private _worker?: Worker
  private _remote?: IRemoteWorkerPlayground
  private _term: Terminal
  private _fitAddon: FitAddon
}
