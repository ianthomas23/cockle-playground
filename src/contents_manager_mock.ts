// Based on ContentsManagerMock in @jupyterlab/services
import { PathExt } from '@jupyterlab/coreutils';
import { Contents, ContentsManager, ServerConnection } from '@jupyterlab/services';
import { UUID } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';

export class ContentsManagerMock implements Contents.IManager {
  private files = new Map<string, Map<string, Contents.IModel>>();
  private dummy = new ContentsManager();
  private checkpoints = new Map<string, Contents.ICheckpointModel>();
  private checkPointContent = new Map<string, string>();
  private baseModel = Private.createFile({ type: 'directory' });
  public fileChanged: Signal<Contents.IManager, Contents.IChangedArgs>;
  public readonly serverSettings: ServerConnection.ISettings;

  constructor() {
    this.fileChanged = new Signal<Contents.IManager, Contents.IChangedArgs>(this);

    // create the default drive
    this.files.set(
      '',
      new Map<string, Contents.IModel>([
        ['', { ...this.baseModel, path: '', name: '' }]
      ])
    );

    this.serverSettings = ServerConnection.makeSettings();
  }

  newUntitled(options: Contents.ICreateOptions = {}): Promise<Contents.IModel> {
    const driveName = this.dummy.driveName(options?.path || '');
    const localPath = this.dummy.localPath(options?.path || '');
    // create the test file without the drive name
    const createOptions = { ...options, path: localPath };
    const model = Private.createFile(createOptions || {});
    // re-add the drive name to the model
    const drivePath = driveName ? `${driveName}:${model.path}` : model.path;
    const driveModel = {
      ...model,
      path: drivePath
    };
    this.files.get(driveName)!.set(model.path, driveModel);
    this.fileChanged.emit({
      type: 'new',
      oldValue: null,
      newValue: driveModel
    });
    return Promise.resolve(driveModel);
  }
  createCheckpoint(path: string): Promise<Contents.ICheckpointModel> {
    const lastModified = new Date().toISOString();
    const data = { id: UUID.uuid4(), last_modified: lastModified };
    this.checkpoints.set(path, data);
    const driveName = this.dummy.driveName(path);
    const localPath = this.dummy.localPath(path);
    this.checkPointContent.set(
      path,
      this.files.get(driveName)!.get(localPath)?.content
    );
    return Promise.resolve(data);
  }
  listCheckpoints(path: string): Promise<Contents.ICheckpointModel[]> {
    const p = this.checkpoints.get(path);
    if (p !== undefined) {
      return Promise.resolve([p]);
    }
    return Promise.resolve([]);
  }
  deleteCheckpoint(path: string): Promise<void> {
    if (!this.checkpoints.has(path)) {
      return Private.makeResponseError(404);
    }
    this.checkpoints.delete(path);
    return Promise.resolve();
  }
  restoreCheckpoint(path: string): Promise<void> {
    if (!this.checkpoints.has(path)) {
      return Private.makeResponseError(404);
    }
    const driveName = this.dummy.driveName(path);
    const localPath = this.dummy.localPath(path);
    (this.files.get(driveName)!.get(localPath) as any).content =
      this.checkPointContent.get(path);
    return Promise.resolve();
  }
    getSharedModelFactory(path: string): Contents.ISharedFactory | null {
    return null;
  }
  normalize(path: string): string {
    return this.dummy.normalize(path);
  }
  localPath(path: string): string {
    return this.dummy.localPath(path);
  }
  resolvePath(root: string, path: string): string {
    return this.dummy.resolvePath(root, path);
  }
  get(path: string, options?: Contents.IFetchOptions): Promise<Contents.IModel> {
    const driveName = this.dummy.driveName(path);
    const localPath = this.dummy.localPath(path);
    const drive = this.files.get(driveName)!;
    path = Private.fixSlash(localPath);
    if (!drive.has(path)) {
      return Private.makeResponseError(404);
    }
    const model = drive.get(path)!;
    const overrides: { hash?: string; last_modified?: string } = {};
    if (path == 'random-hash.txt') {
      overrides.hash = Math.random().toString();
    } else if (path == 'newer-timestamp-no-hash.txt') {
      overrides.hash = undefined;
      const tomorrow = new Date();
      tomorrow.setDate(new Date().getDate() + 1);
      overrides.last_modified = tomorrow.toISOString();
    }
    if (model.type === 'directory') {
      if (options?.content !== false) {
        const content: Contents.IModel[] = [];
        drive.forEach(fileModel => {
          const localPath = this.dummy.localPath(fileModel.path);
          if (
            // If file path is under this directory, add it to contents array.
            PathExt.dirname(localPath) == model.path &&
            // But the directory should exclude itself from the contents array.
            fileModel !== model
          ) {
            content.push(fileModel);
          }
        });
        return Promise.resolve({ ...model, content });
      }
      return Promise.resolve(model);
    }
    if (options?.content != false) {
      return Promise.resolve(model);
    }
    return Promise.resolve({ ...model, content: '', ...overrides });
  }
  driveName(path: string): string {
    return this.dummy.driveName(path);
  }
  rename(oldPath: string, newPath: string): Promise<Contents.IModel> {
    const driveName = this.dummy.driveName(oldPath);
    const drive = this.files.get(driveName)!;
    let oldLocalPath = this.dummy.localPath(oldPath);
    let newLocalPath = this.dummy.localPath(newPath);
    oldLocalPath = Private.fixSlash(oldLocalPath);
    newLocalPath = Private.fixSlash(newLocalPath);
    if (!drive.has(oldLocalPath)) {
      return Private.makeResponseError(404);
    }
    const oldValue = drive.get(oldPath)!;
    drive.delete(oldPath);
    const name = PathExt.basename(newLocalPath);
    const newValue = { ...oldValue, name, path: newLocalPath };
    drive.set(newPath, newValue);
    this.fileChanged.emit({
      type: 'rename',
      oldValue,
      newValue
    });
    return Promise.resolve(newValue);
  }
  delete(path: string): Promise<void> {
    const driveName = this.dummy.driveName(path);
    const localPath = this.dummy.localPath(path);
    const drive = this.files.get(driveName)!;
    path = Private.fixSlash(localPath);
    if (!drive.has(path)) {
      return Private.makeResponseError(404);
    }
    const oldValue = drive.get(path)!;
    drive.delete(path);
    this.fileChanged.emit({
      type: 'delete',
      oldValue,
      newValue: null
    });
    return Promise.resolve(void 0);
  }
  save(path: string, options: Partial<Contents.IModel> = {}): Promise<Contents.IModel> {
    if (path == 'readonly.txt') {
      return Private.makeResponseError(403);
    }
    path = Private.fixSlash(path);
    const timeStamp = new Date().toISOString();
    const drive = this.files.get(this.dummy.driveName(path))!;
    if (drive.has(path)) {
      const updates =
        path == 'frozen-time-and-hash.txt'
          ? {}
          : {
              last_modified: timeStamp,
              hash: timeStamp
            };
      drive.set(path, {
        ...drive.get(path)!,
        ...options,
        ...updates
      });
    } else {
      drive.set(path, {
        path,
        name: PathExt.basename(path),
        content: '',
        writable: true,
        created: timeStamp,
        type: 'file',
        format: 'text',
        mimetype: 'plain/text',
        ...options,
        last_modified: timeStamp,
        hash: timeStamp,
        hash_algorithm: 'static'
      });
    }
    this.fileChanged.emit({
      type: 'save',
      oldValue: null,
      newValue: drive.get(path)!
    });
    return Promise.resolve(drive.get(path)!);
  }
  getDownloadUrl(path: string): Promise<string> {
    return this.dummy.getDownloadUrl(path);
  }
  addDrive(drive: Contents.IDrive) {
    this.dummy.addDrive(drive);
    this.files.set(
      drive.name,
      new Map<string, Contents.IModel>([
        ['', { ...this.baseModel, path: '', name: '' }]
      ])
    );
  }
  copy(fromFile: string, toDir: string): Promise<Contents.IModel> {
    throw Error("Not implemented")
  }
  dispose() {}
  get isDisposed(): boolean {
    return false
  }
};

namespace Private {
  export type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
  };

  export function createFile(
    options?: Contents.ICreateOptions
  ): Contents.IModel {
    options = options || {};
    let name = UUID.uuid4();
    switch (options.type) {
      case 'directory':
        name = `Untitled Folder_${name}`;
        break;
      case 'notebook':
        name = `Untitled_${name}.ipynb`;
         break;
      default:
        name = `untitled_${name}${options.ext || '.txt'}`;
    }

    const path = PathExt.join(options.path || '', name);
    let content = '';
    if (options.type === 'notebook') {
      content = JSON.stringify({});
    }
    const timeStamp = new Date().toISOString();
    return {
      path,
      content,
      name,
      last_modified: timeStamp,
      writable: true,
      created: timeStamp,
      type: options.type || 'file',
      format: 'text',
      mimetype: 'plain/text'
    };
  }

  export function fixSlash(path: string): string {
    if (path.endsWith('/')) {
      path = path.slice(0, path.length - 1);
    }
    return path;
  }

  export function makeResponseError<T>(status: number): Promise<T> {
    //const resp = new Response(void 0, { status });
    //return Promise.reject(new ServerConnection.ResponseError(resp));
    throw new Error()
  }
}
