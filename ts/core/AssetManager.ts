import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type Asset =
  | {
      type: "PositionalAudio";
      name: string;
      url: string;
      distance: number;
      volume?: number;
    }
  | { type: "Texture"; name: string; url: string }
  | { type: "GLB"; name: string; url: string };

export class AssetManager {
  private readonly loadingManager: THREE.LoadingManager;

  private readonly audioLoader: THREE.AudioLoader;
  private readonly audios: Map<string, any>;

  private readonly gltfLoader: GLTFLoader;
  private readonly models: Map<string, THREE.Group>;

  private readonly textureLoader: THREE.TextureLoader;
  private readonly textures: Map<string, THREE.Texture>;

  public readonly audioListener: THREE.AudioListener;

  constructor() {
    this.loadingManager = new THREE.LoadingManager();

    this.audioLoader = new THREE.AudioLoader(this.loadingManager);
    this.audioListener = new THREE.AudioListener();
    this.audios = new Map();

    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.models = new Map();

    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.textures = new Map();
  }

  init(manifest: readonly Asset[]): Promise<void> {
    const progressBar = document.querySelector(
      "#progressBar",
    ) as HTMLDivElement;
    this.loadingManager.onProgress = (url, loaded, total) => {
      const label = `${((loaded / total) * 100).toFixed(2)}%`;
      progressBar.innerHTML = `<div>${label}</div><div>${url}</div>`;
    };
    this.loadAssets(manifest);
    return new Promise<void>((resolve) => {
      this.loadingManager.onLoad = () => {
        setTimeout(() => resolve(), 100);
      };
    });
  }

  getAudio(name: string): THREE.PositionalAudio {
    const audio = this.audios.get(name);
    if (audio === undefined) {
      throw new Error(`Audio not found: ${name}`);
    }
    if (audio instanceof THREE.PositionalAudio) {
      return audio;
    }
    throw new Error(`Unsupported audio type: ${audio}`);
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

  getModel(name: string): THREE.Group {
    const model = this.models.get(name);
    if (model === undefined) {
      throw new Error(`Model not found: ${name}`);
    }
    return model;
  }

  getTexture(name: string): THREE.Texture {
    const texture = this.textures.get(name);
    if (texture === undefined) {
      throw new Error(`Texture not found: ${name}`);
    }
    return texture;
  }

  private loadAssets(manifest: readonly Asset[]) {
    manifest.forEach((asset) => {
      if (asset.type === "PositionalAudio") {
        this.audioLoader.load(asset.url, (buffer) => {
          const audio = new THREE.PositionalAudio(this.audioListener);
          audio.setBuffer(buffer);
          audio.setRefDistance(asset.distance);
          audio.setVolume(asset.volume ?? 1);
          this.audios.set(asset.name, audio);
        });
      } else if (asset.type === "Texture") {
        this.textureLoader.load(asset.url, (texture) => {
          this.textures.set(asset.name, texture);
        });
      } else if (asset.type === "GLB") {
        this.gltfLoader.load(asset.url, (gltf) => {
          // const root = new THREE.Object3D();
          // gltf.scene.traverse((child) => {
          //   if (child instanceof THREE.Mesh) {
          //     root.add(child);
          //   }
          //   console.log(child);
          // });
          // this.models.set(asset.name, root);
          this.models.set(asset.name, gltf.scene);
        });
      }
    });
  }
}
