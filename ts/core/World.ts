import * as THREE from "three";
import * as YUKA from "yuka";

export class World {
  private readonly camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly time: YUKA.Time;
  private requestID: number = -1;

  constructor() {
    this.time = new YUKA.Time();

    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );

    this.scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    ambientLight.matrixAutoUpdate = false;
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(1, 10, -1);
    dirLight.matrixAutoUpdate = false;
    dirLight.updateMatrix();
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 20;
    dirLight.shadow.mapSize.x = 2048;
    dirLight.shadow.mapSize.y = 2048;
    dirLight.shadow.bias = 0.01;
    this.scene.add(dirLight);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener("resize", this._onWindowResize, false);

    this.initScene();
  }

  private _onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private initScene() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    this.scene.add(cube);

    this.camera.position.z = 5;
  }

  private update() {
    const delta = this.time.update().getDelta();
    // game logic here

    // render
    this.renderer.render(this.scene, this.camera);
  }

  run() {
    this.requestID = requestAnimationFrame(() => this.run());
    this.update();
  }

  stop() {
    cancelAnimationFrame(this.requestID);
  }
}
