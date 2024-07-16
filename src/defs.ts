import { ProxyMarked, Remote } from 'comlink'

export namespace IPlayground {
  export interface IOptions {
    targetDiv: HTMLElement
  }

  export type IOutputCallback = (output: string) => void
  export type IEnableBufferedStdinCallback = (enable: boolean) => void
}

export interface IWorkerPlayground {
  input(text: string): Promise<void>;
  setSize(rows: number, columns: number): Promise<void>;
  start(): Promise<void>;
}

export namespace IWorkerPlayground {
  export interface IOptions {
    sharedArrayBuffer: SharedArrayBuffer
  }
}

export namespace IRemote {
  export type OutputCallback = IPlayground.IOutputCallback & ProxyMarked
  export type EnableBufferedStdinCallback = IPlayground.IEnableBufferedStdinCallback & ProxyMarked
}

export interface IRemote extends IWorkerPlayground {
  initialize(options: IWorkerPlayground.IOptions): Promise<void>
  registerCallbacks(
    outputCallback: IRemote.OutputCallback,
    enableBufferedStdinCallback: IRemote.EnableBufferedStdinCallback,
  ): void
}

export type IRemoteWorkerPlayground = Remote<IRemote>
