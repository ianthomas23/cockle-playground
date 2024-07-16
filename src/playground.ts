import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { proxy, wrap } from 'comlink'
import { MainBufferedStdin } from './buffered_stdin'
import { IPlayground, IRemoteWorkerPlayground } from './defs'

export class Playground {
  constructor(options: IPlayground.IOptions) {
    this._options = options

    const termOptions = {
      rows: 50,
      theme: {
        foreground: "black",
        background: "ivory",
        cursor: "slategray"
      },
    }
    this._term = new Terminal(termOptions)

    this._fitAddon = new FitAddon()
    this._term.loadAddon(this._fitAddon)

    this._bufferedStdin = new MainBufferedStdin()
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
    const char = arg.key as string
    if (this._bufferedStdin.enabled) {
      await this._bufferedStdin.push(char)
    } else {
      await this._remote!.input(char)
    }
  }

  async onResize(arg: any): Promise<void> {
    await this._remote!.setSize(arg.rows, arg.cols)
  }

  private async _initWorker() {
    this._worker = new Worker(new URL('./worker_playground.ts', import.meta.url), {
      type: 'module'
    })

    this._remote = wrap(this._worker)
    const { sharedArrayBuffer } = this._bufferedStdin
    await this._remote.initialize({ sharedArrayBuffer })
    this._remote.registerCallbacks(
      proxy(this.outputCallback.bind(this)),
      proxy(this.enableBufferedStdinCallback.bind(this)),
    )

    this._bufferedStdin.registerSendStdinNow(this._remote.input)
  }

  private async enableBufferedStdinCallback(enable: boolean) {
    if (enable) {
      await this._bufferedStdin.enable()
    } else {
      await this._bufferedStdin.disable()
    }
  }

  private outputCallback(text: string): void {
    this._term!.write(text)
  }

  private _options: IPlayground.IOptions
  private _worker?: Worker
  private _remote?: IRemoteWorkerPlayground
  private _term: Terminal
  private _fitAddon: FitAddon
  private _bufferedStdin: MainBufferedStdin
}
