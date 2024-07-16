import { ProxyMarked, Remote } from 'comlink'

export namespace IPlayground {
  export interface IOptions {
    targetDiv: HTMLElement
  }

  export type IOutputCallback = (output: string) => void
}

export interface IWorkerPlayground {
  input(text: string): Promise<void>;
  setSize(rows: number, columns: number): Promise<void>;
  start(): Promise<void>;
}

export namespace IWorkerPlayground {
  export interface IOptions {
  }
}

export namespace IRemote {
  export type OutputCallback = IPlayground.IOutputCallback & ProxyMarked
}

export interface IRemote extends IWorkerPlayground {
  initialize(options: IWorkerPlayground.IOptions): Promise<void>
  registerCallback(outputCallback: IRemote.OutputCallback): void
}

export type IRemoteWorkerPlayground = Remote<IRemote>
