import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import * as YUKA from "yuka";
import { AssetManager } from "./AssetManager";
import { assets } from "../manifest";
import { Player } from "../entities/Player";
import { VehicleControls } from "./VehicleControls";
import { Projectile } from "../entities/Projectile";
import {
  createPlayerProjectileMesh,
  PlayerProjectile,
} from "../entities/PlayerProjectile";

const maxPlayerProjectiles = 100;

export class World {
  public readonly time: YUKA.Time;
  public readonly field: YUKA.Vector3;

  private readonly stats: Stats;
  private readonly camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private readonly renderer: THREE.WebGLRenderer;
  private requestID: number = -1;
  private readonly assetManager: AssetManager;

  private fieldMesh?: THREE.Mesh;

  private entityManager: YUKA.EntityManager;
  private player?: Player;
  private controls?: VehicleControls;
  private playerProjectiles: PlayerProjectile[] = [];
  private playerProjectileMesh: THREE.InstancedMesh;

  constructor() {
    this.time = new YUKA.Time();
    this.assetManager = new AssetManager();
    this.entityManager = new YUKA.EntityManager();

    this.field = new YUKA.Vector3(15, 1, 15);

    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.add(this.assetManager.audioListener);

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
    // this.scene.add(new THREE.CameraHelper(dirLight.shadow.camera));

    this.playerProjectileMesh =
      createPlayerProjectileMesh(maxPlayerProjectiles);
    this.scene.add(this.playerProjectileMesh);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    window.addEventListener("resize", this._onWindowResize, false);
  }

  private _onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private initScene() {
    // field
    const fieldGeometry = new THREE.BoxGeometry(
      this.field.x,
      this.field.y,
      this.field.z
    );
    const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0xaca181 });
    this.fieldMesh = new THREE.Mesh(fieldGeometry, fieldMaterial);
    this.fieldMesh.matrixAutoUpdate = false;
    this.fieldMesh.position.set(0, -0.5, 0);
    this.fieldMesh.updateMatrix();
    this.fieldMesh.receiveShadow = true;
    this.scene.add(this.fieldMesh);
  }

  private initBackground() {
    this.scene.background = new THREE.Color(0x6d685d);

    const count = 25;
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0xaca181 });

    const backgroundObjects = new THREE.InstancedMesh(
      geometry,
      material,
      count
    );

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      dummy.position.x = THREE.MathUtils.randFloat(-75, 75);
      dummy.position.y = THREE.MathUtils.randFloat(-75, -50);
      dummy.position.z = THREE.MathUtils.randFloat(-75, 75);

      dummy.scale.set(1, 1, 1).multiplyScalar(Math.random());

      dummy.updateMatrix();

      backgroundObjects.setMatrixAt(i, dummy.matrix);
    }

    this.scene.add(backgroundObjects);
  }

  private initPlayer() {
    this.player = new Player(this);
    this.entityManager.add(this.player);
    this.scene.add(this.player.mesh);

    this.controls = new VehicleControls(this.player, this.camera);
    this.controls.setPosition(0, 0, 0);
  }

  private updateProjectileMeshes() {
    for (let i = 0; i < this.playerProjectiles.length; i++) {
      const projectile = this.playerProjectiles[i];
      this.playerProjectileMesh.setMatrixAt(i, projectile.worldMatrix as any);
    }
    this.playerProjectileMesh.count = this.playerProjectiles.length;
    this.playerProjectileMesh.instanceMatrix.needsUpdate = true;
  }

  private update() {
    const delta = this.time.update().getDelta();
    // game logic here

    this.controls?.update(delta);
    this.entityManager.update(delta);

    // render
    this.updateProjectileMeshes();

    this.renderer.render(this.scene, this.camera);

    this.stats.update();
  }

  async init() {
    await this.assetManager.init(assets);
    this.initScene();
    this.initBackground();
    this.initPlayer();

    this.restart();
  }

  run() {
    this.requestID = requestAnimationFrame(() => this.run());
    this.update();
  }

  stop() {
    cancelAnimationFrame(this.requestID);
  }

  restart() {
    this.time.reset();
    this.controls?.connect();
  }

  addProjectile(projectile: Projectile) {
    if (projectile instanceof PlayerProjectile) {
      this.playerProjectiles.push(projectile);
    }

    this.entityManager.add(projectile);
  }

  removeProjectile(projectile: Projectile) {
    if (projectile instanceof PlayerProjectile) {
      const index = this.playerProjectiles.indexOf(projectile);
      if (index !== -1) {
        this.playerProjectiles.splice(index, 1);
      }
    }

    this.entityManager.remove(projectile);
  }
}
