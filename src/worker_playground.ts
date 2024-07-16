import { Shell } from "@jupyterlite/cockle"
import { expose } from 'comlink'
import { IRemote, IWorkerPlayground } from './defs'

export class WorkerPlayground implements IWorkerPlayground {
  async initialize(options: IWorkerPlayground.IOptions): Promise<void> {
    this._options = options
    console.log("WorkerPlayground.options", this._options)
  }

  async input(text: string): Promise<void> {
    await this._shell!.input(text)
  }

  registerCallback(outputCallback: IRemote.OutputCallback): void {
    this._outputCallback = outputCallback
  }

  async setSize(rows: number, columns: number): Promise<void> {
    await this._shell!.setSize(rows, columns);
  }

  async start(): Promise<void> {
    this._shell = new Shell(this.output.bind(this))
    const { FS } = await this._shell.initFilesystem()

    // Add some dummy files.
    FS.writeFile('file.txt', 'This is the contents of the file')
    FS.writeFile('other.txt', 'Some other file\nSecond line')
    FS.writeFile('months.txt', 'January\nFebruary\nMarch\nApril\nMay\nJune\nJuly\nAugust\nSeptember\nOctober\nNovember\nDecember\n')
    FS.mkdir('dir')

    this._shell!.start()
  }

  private async output(text: string): Promise<void> {
    if (this._outputCallback) {
      await this._outputCallback(text)
    }
  }

  private _options?: IWorkerPlayground.IOptions
  private _shell?: Shell
  private _outputCallback?: IRemote.OutputCallback
}

const obj = new WorkerPlayground()

expose(obj)
