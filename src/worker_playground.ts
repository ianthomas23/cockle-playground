import { Shell } from "@jupyterlite/cockle"
import { expose } from 'comlink'
import { WorkerBufferedStdin } from './buffered_stdin'
import { IRemote, IWorkerPlayground } from './defs'

export class WorkerPlayground implements IWorkerPlayground {
  async initialize(options: IWorkerPlayground.IOptions): Promise<void> {
    this._options = options
    this._bufferedStdin = new WorkerBufferedStdin(this._options!.sharedArrayBuffer)
  }

  async input(text: string): Promise<void> {
    await this._shell!.input(text)
  }

  registerCallbacks(
    outputCallback: IRemote.OutputCallback,
    enableBufferedStdinCallback: IRemote.EnableBufferedStdinCallback,
  ): void {
    this._outputCallback = outputCallback
    this._enableBufferedStdinCallback = enableBufferedStdinCallback
  }

  async setSize(rows: number, columns: number): Promise<void> {
    await this._shell!.setSize(rows, columns);
  }

  async start(): Promise<void> {
    this._shell = new Shell({
      outputCallback: this.output.bind(this),
      enableBufferedStdinCallback: this.enableBufferedStdin.bind(this),
      stdinCallback: this.getStdin.bind(this),
    })
    const { FS } = await this._shell.initFilesystem()

    // Add some dummy files.
    FS.writeFile('file.txt', 'This is the contents of the file', { mode: 0o664 })
    FS.writeFile('other.txt', 'Some other file\nSecond line', { mode: 0o664 })
    FS.writeFile('months.txt', 'January\nFebruary\nMarch\nApril\nMay\nJune\nJuly\nAugust\nSeptember\nOctober\nNovember\nDecember\n',  { mode: 0o664 })
    FS.mkdir('dir', 0o775)

    this._shell!.start()
  }

  private async enableBufferedStdin(enable: boolean): Promise<void> {
    if (enable) {
      await this._bufferedStdin!.enable()
    } else {
      await this._bufferedStdin!.disable()
    }
    if (this._enableBufferedStdinCallback) {
      await this._enableBufferedStdinCallback(enable)
    }
  }

  private getStdin(): number[] {
    return this._bufferedStdin!.get()
  }

  private async output(text: string): Promise<void> {
    if (this._outputCallback) {
      await this._outputCallback(text)
    }
  }

  private _options?: IWorkerPlayground.IOptions
  private _shell?: Shell
  private _outputCallback?: IRemote.OutputCallback
  private _enableBufferedStdinCallback?: IRemote.EnableBufferedStdinCallback
  private _bufferedStdin?: WorkerBufferedStdin
}

const obj = new WorkerPlayground()

expose(obj)
