import { Shell } from '@jupyterlite/cockle'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { IPlayground } from './defs'

export class Playground {
  constructor(options: IPlayground.IOptions) {
    this._targetDiv = options.targetDiv;

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

    const { baseUrl, browsingContextId, shellManager } = options;

    this._shell = new Shell({
      browsingContextId,
      baseUrl,
      wasmBaseUrl: baseUrl,
      shellManager,
      outputCallback: this.outputCallback.bind(this),
      initialDirectories: ['dir'],
      initialFiles: {
        'file.txt': 'This is the contents of the file',
        'other.txt': 'Some other file\nSecond line',
        'months.txt': 'January\nFebruary\nMarch\nApril\nMay\nJune\nJuly\nAugust\nSeptember\nOctober\nNovember\nDecember\n',
        'factorial.lua':
        'function factorial(n)\n' +
        '  if n == 0 then\n' +
        '    return 1\n' +
        '  else\n' +
        '    return n * factorial(n-1)\n' +
        '  end\n' +
        'end\n' +
        'print(factorial(tonumber(arg[1])))\n'
      }
    })
  }

  async start(): Promise<void> {
    this._term!.onResize(async (arg: any) => await this.onResize(arg))
    this._term!.onData(async (data: string) => await this.onData(data))

    const resizeObserver = new ResizeObserver((entries) => {
      this._fitAddon!.fit()
    })

    this._term!.open(this._targetDiv)
    await this._shell.start()
    resizeObserver.observe(this._targetDiv)
  }

  async onData(data: string): Promise<void> {
    await this._shell.input(data)
  }

  async onResize(arg: any): Promise<void> {
    await this._shell.setSize(arg.rows, arg.cols)
  }

  private outputCallback(text: string): void {
    this._term!.write(text)
  }

  private _targetDiv: HTMLElement;
  private _term: Terminal
  private _fitAddon: FitAddon
  private _shell: Shell
}
