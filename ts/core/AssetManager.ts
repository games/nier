import * as THREE from "three";

export type Asset =
  | {
      type: "PositionalAudio";
      name: string;
      url: string;
      distance: number;
      volume?: number;
    }
  | { type: "Texture"; name: string; url: string };

export class AssetManager {
  private readonly loadingManager: THREE.LoadingManager;
  private readonly audioLoader: THREE.AudioLoader;
  private readonly audios: Map<string, any>;
  
  public readonly audioListener: THREE.AudioListener;

  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.audioLoader = new THREE.AudioLoader(this.loadingManager);
    this.audioListener = new THREE.AudioListener();
    this.audios = new Map();
  }

  init(manifest: readonly Asset[]): Promise<void> {
    this.loadAudios(manifest);
    return new Promise<void>((resolve) => {
      this.loadingManager.onLoad = () => {
        setTimeout(() => resolve(), 100);
      };
    });
  }

  cloneAudio(name: string): THREE.PositionalAudio {
    const source = this.audios.get(name);
    if (source === undefined) {
      throw new Error(`Audio not found: ${name}`);
    }
    if (source instanceof THREE.PositionalAudio) {
      const audio = new THREE.PositionalAudio(this.audioListener);
      audio.buffer = source.buffer;
      audio.setRefDistance(source.getRefDistance());
      audio.setVolume(source.getVolume());
      return audio;
    }
    throw new Error(`Unsupported audio type: ${source}`);
  }

  private loadAudios(manifest: readonly Asset[]) {
    manifest.forEach((asset) => {
      if (asset.type === "PositionalAudio") {
        this.audioLoader.load(asset.url, (buffer) => {
          const audio = new THREE.PositionalAudio(this.audioListener);
          audio.setBuffer(buffer);
          audio.setRefDistance(asset.distance);
          audio.setVolume(asset.volume ?? 1);
          this.audios.set(asset.name, audio);
        });
      } else {
        console.warn(`Unsupported asset type: ${asset.type}`);
      }
    });
  }
}
