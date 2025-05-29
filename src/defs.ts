import { IShellManager } from '@jupyterlite/cockle';

export namespace IPlayground {
  export interface IOptions {
    baseUrl: string;
    browsingContextId: string;
    shellManager: IShellManager;
    targetDiv: HTMLElement;
  }
}
