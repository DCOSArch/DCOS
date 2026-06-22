/**
 * Zero-Click Folder Watcher API wrapper.
 * Utilizes the modern browser File System Access API to monitor a local directory
 * (e.g., C:/Scans) for new STL/PLY exports from a desktop scanner.
 */

export class ScannerFolderWatcher {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private knownFiles: Set<string> = new Set();
  private intervalId: number | null = null;
  private onNewFileCallback: (file: File) => void;

  constructor(onNewFile: (file: File) => void) {
    this.onNewFileCallback = onNewFile;
  }

  /**
   * Prompts the user to select the scanner export folder.
   * Requires user interaction (button click).
   */
  async requestDirectoryAccess(): Promise<boolean> {
    try {
      // @ts-ignore - window.showDirectoryPicker is widely supported in Chromium but missing in some TS definitions
      this.directoryHandle = await window.showDirectoryPicker({
        id: 'scanner-export-folder',
        mode: 'read',
      });

      if (!this.directoryHandle) return false;

      // Populate initial known files so we don't trigger uploads for historical data
      await this.scanCurrentFiles();
      
      return true;
    } catch (err) {
      console.error('Directory access denied or failed:', err);
      return false;
    }
  }

  /**
   * Scans the directory and adds all current file names to the known list.
   */
  private async scanCurrentFiles() {
    if (!this.directoryHandle) return;
    
    // @ts-ignore
    for await (const entry of this.directoryHandle.values()) {
      if (entry.kind === 'file') {
        const name = entry.name.toLowerCase();
        if (name.endsWith('.stl') || name.endsWith('.ply')) {
          this.knownFiles.add(entry.name);
        }
      }
    }
  }

  /**
   * Starts the polling mechanism to watch for new files.
   */
  startWatching(intervalMs: number = 2000) {
    if (!this.directoryHandle) {
      throw new Error("Must request directory access before watching.");
    }

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(async () => {
      await this.checkForNewFiles();
    }, intervalMs);
    
    console.log(`Started watching folder every ${intervalMs}ms`);
  }

  stopWatching() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Stopped watching folder.');
    }
  }

  private async checkForNewFiles() {
    if (!this.directoryHandle) return;

    try {
      // @ts-ignore
      for await (const entry of this.directoryHandle.values()) {
        if (entry.kind === 'file') {
          const name = entry.name.toLowerCase();
          const is3DModel = name.endsWith('.stl') || name.endsWith('.ply');
          
          if (is3DModel && !this.knownFiles.has(entry.name)) {
            // New file detected!
            this.knownFiles.add(entry.name);
            const fileHandle = entry as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            
            console.log(`New scanner file detected: ${file.name}`);
            
            // Trigger the application callback (e.g., open "Create Case" modal automatically)
            this.onNewFileCallback(file);
          }
        }
      }
    } catch (err) {
      console.error('Error polling directory (permissions may have been lost):', err);
      this.stopWatching();
    }
  }
}
