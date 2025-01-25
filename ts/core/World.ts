import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import * as YUKA from "yuka";
import { AssetManager } from "./AssetManager";
import { assets } from "../manifest";
import { Player } from "../entities/Player";
import { VehicleControls } from "./VehicleControls";
import { Projectile } from "../entities/Projectile";
import { PlayerProjectile } from "../entities/PlayerProjectile";
import { StageManager } from "./StageManager";
import * as Prefabs from "../etc/Prefabs";
import { Guard } from "../entities/Guard";
import { playAudio } from "../entities/utils";
import { EnemyProjectile } from "../entities/EnemyProjectile";
import { Obstacle } from "../entities/Obstacle";

const maxPlayerProjectiles = 100;
const maxEnemyProjectiles = 200;
const maxDestructileEnemyProjectiles = 200;
const maxObstacles = 50;
const toVector = new YUKA.Vector3();
const displacement = new YUKA.Vector3();

export class World {
  public readonly time: YUKA.Time;
  public readonly field: YUKA.Vector3;

  private readonly stats: Stats;
  public readonly camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private readonly renderer: THREE.WebGLRenderer;
  private requestID: number = -1;
  public readonly assetManager: AssetManager;
  private readonly stageManager: StageManager;

  private fieldMesh?: THREE.Mesh;

  private currentStage = 0;
  private active = false;

  private entityManager: YUKA.EntityManager;
  private player?: Player;
  public controls?: VehicleControls;
  private playerProjectiles: PlayerProjectile[] = [];
  private playerProjectileMesh: THREE.InstancedMesh;
  private guards: Guard[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private enemyDestructibleProjectiles: EnemyProjectile[] = [];
  private enemyProjectileMesh: THREE.InstancedMesh;
  private enemyDestructibleProjectileMesh: THREE.InstancedMesh;
  private obstacles: Obstacle[] = [];
  private obstacleMesh: THREE.InstancedMesh;

  public readonly prefabs = {
    guard: Prefabs.guard(this),
    playerProjectile: Prefabs.playerProjectile(),
    enemyProjectile: Prefabs.enemyProjectile(),
    enemyDestructibleProjectile: Prefabs.enemyDestructibleProjectile(),
    obstacle: Prefabs.obstacle(),
  };

  constructor() {
    this.time = new YUKA.Time();
    this.assetManager = new AssetManager();
    this.entityManager = new YUKA.EntityManager();
    this.stageManager = new StageManager(this);

    this.field = new YUKA.Vector3(15, 1, 15);

    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
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
      this.prefabs.playerProjectile(maxPlayerProjectiles);
    this.scene.add(this.playerProjectileMesh);
    this.enemyProjectileMesh =
      this.prefabs.enemyProjectile(maxEnemyProjectiles);
    this.scene.add(this.enemyProjectileMesh);
    this.enemyDestructibleProjectileMesh =
      this.prefabs.enemyDestructibleProjectile(maxDestructileEnemyProjectiles);
    this.scene.add(this.enemyDestructibleProjectileMesh);
    this.obstacleMesh = this.prefabs.obstacle(maxObstacles);
    this.scene.add(this.obstacleMesh);

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
      this.field.z,
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
      count,
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

  private updateObstaclesMeshes(force: boolean) {
    let needsUpdate = force;
    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i];
      if (obstacle.needsUpdate) {
        obstacle.updateBoundingVolumes();
        this.obstacleMesh.setMatrixAt(i, obstacle.worldMatrix as any);
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      this.obstacleMesh.count = this.obstacles.length;
      this.obstacleMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private updateProjectileMeshes() {
    for (let i = 0; i < this.playerProjectiles.length; i++) {
      const projectile = this.playerProjectiles[i];
      this.playerProjectileMesh.setMatrixAt(i, projectile.worldMatrix as any);
    }
    this.playerProjectileMesh.count = this.playerProjectiles.length;
    this.playerProjectileMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.enemyProjectiles.length; i++) {
      const projectile = this.enemyProjectiles[i];
      this.enemyProjectileMesh.setMatrixAt(i, projectile.worldMatrix as any);
    }
    this.enemyProjectileMesh.count = this.enemyProjectiles.length;
    this.enemyProjectileMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.enemyDestructibleProjectiles.length; i++) {
      const projectile = this.enemyDestructibleProjectiles[i];
      this.enemyDestructibleProjectileMesh.setMatrixAt(
        i,
        projectile.worldMatrix as any,
      );
    }
    this.enemyDestructibleProjectileMesh.count =
      this.enemyDestructibleProjectiles.length;
    this.enemyDestructibleProjectileMesh.instanceMatrix.needsUpdate = true;
  }

  private checkOverlappingEntites(a: YUKA.GameEntity, b: YUKA.GameEntity) {
    toVector.subVectors(a.position, b.position);
    const distance = toVector.length();
    const range = a.boundingRadius + b.boundingRadius;
    const overlap = range - distance;
    if (overlap > 0) {
      toVector.divideScalar(distance || 1); // normalize
      displacement.copy(toVector).multiplyScalar(overlap);
      a.position.add(displacement);
    }
  }

  private enforceNonPenetrationConstraint() {
    const guards = this.guards;
    // guards
    for (let i = 0; i < guards.length; i++) {
      const guard = guards[i];

      for (let j = 0; j < guards.length; j++) {
        const entity = guards[j];
        if (guard !== entity) {
          this.checkOverlappingEntites(guard, entity);
        }
      }
      for (let j = 0; j < this.obstacles.length; j++) {
        const entity = this.obstacles[j];
        this.checkOverlappingEntites(guard, entity);
      }

      // TODO pursuers, towers and obstacles
    }
  }

  private checkPlayerCollision() {
    const player = this.player;
    if (!player) {
      return;
    }

    const guards = this.guards;
    for (let i = 0; i < guards.length; i++) {
      const guard = guards[i];
      const squaredDistance = player.position.squaredDistanceTo(guard.position);
      const range = player.boundingRadius + guard.boundingRadius;
      if (squaredDistance <= range * range) {
        if (player.obb.intersectsBoundingSphere(guard.boundingSphere)) {
          player.healthPoints = 0;
          playAudio(player, "playerExplode");
        }
      }
    }
  }

  private checkPlayerProjectileCollision(projectile: PlayerProjectile) {
    // enemies
    // guards
    for (let i = 0; i < this.guards.length; i++) {
      const guard = this.guards[i];
      const squaredDistance = projectile.position.squaredDistanceTo(
        guard.position,
      );
      const range = projectile.boundingRadius + guard.boundingRadius;
      if (squaredDistance <= range * range) {
        if (projectile.obb.intersectsBoundingSphere(guard.boundingSphere)) {
          projectile.sendMessage(guard, "hit");
          this.removeProjectile(projectile);
          return;
        }
      }
    }
    // pursuers
    // towers
    // obstacles
    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i];
      const squaredDistance = projectile.position.squaredDistanceTo(
        obstacle.position,
      );
      const range = projectile.boundingRadius + obstacle.boundingRadius;
      if (squaredDistance <= range * range) {
        if (projectile.obb.intersectsOBB(obstacle.obb)) {
          this.removeProjectile(projectile);
          return;
        }
      }
    }
  }

  private checkPlayerProjectileCollisions() {
    const projectiles = this.playerProjectiles;
    for (let i = 0; i < projectiles.length; i++) {
      this.checkPlayerProjectileCollision(projectiles[i]);
    }
  }

  private checkEnemyProjectileCollision(projectile: EnemyProjectile) {
    const obstacles = this.obstacles;
    const player = this.player!;
    const playerProjectiles = this.playerProjectiles;

    // obstacles
    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      const squaredDistance = projectile.position.squaredDistanceTo(
        obstacle.position,
      );
      const range = projectile.boundingRadius + obstacle.boundingRadius;
      if (squaredDistance <= range * range) {
        if (obstacle.obb.intersectsBoundingSphere(projectile.boundingSphere)) {
          this.removeProjectile(projectile);
          return;
        }
      }
    }

    // projectiles
    if (projectile.isDestructible) {
      for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const playerProjectile = playerProjectiles[i];
        const squaredDistance = projectile.position.squaredDistanceTo(
          playerProjectile.position,
        );
        const range =
          projectile.boundingRadius + playerProjectile.boundingRadius;
        if (squaredDistance <= range * range) {
          if (
            playerProjectile.obb.intersectsBoundingSphere(
              projectile.boundingSphere,
            )
          ) {
            this.removeProjectile(playerProjectile);
            this.removeProjectile(projectile);
            return;
          }
        }
      }
    }

    // player
    const squaredDistance = projectile.position.squaredDistanceTo(
      player.position,
    );
    const range = projectile.boundingRadius + player.boundingRadius;
    if (squaredDistance <= range * range) {
      if (player.obb.intersectsBoundingSphere(projectile.boundingSphere)) {
        projectile.sendMessage(player, "hit");
        this.removeProjectile(projectile);
      }
    }
  }

  private checkEnemyProjectileCollisions() {
    for (let i = 0; i < this.enemyProjectiles.length; i++) {
      this.checkEnemyProjectileCollision(this.enemyProjectiles[i]);
    }
    for (let i = 0; i < this.enemyDestructibleProjectiles.length; i++) {
      this.checkEnemyProjectileCollision(this.enemyDestructibleProjectiles[i]);
    }
  }

  private update() {
    const delta = this.time.update().getDelta();
    if (this.active) {
      // game logic here

      this.controls?.update(delta);
      this.entityManager.update(delta);

      this.enforceNonPenetrationConstraint();
      this.checkPlayerCollision();
      this.checkPlayerProjectileCollisions();
      this.checkEnemyProjectileCollisions();
      // this.checkGameStatus();

      // render
      this.updateObstaclesMeshes(false);
      this.updateProjectileMeshes();

      this.renderer.render(this.scene, this.camera);

      this.stats.update();
    }
  }

  private clearStage() {
    for (let i = this.guards.length - 1; i >= 0; i--) {
      this.removeGuard(this.guards[i]);
    }
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.removeObstacle(this.obstacles[i]);
    }
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      this.removeProjectile(this.enemyProjectiles[i]);
    }
    for (let i = this.enemyDestructibleProjectiles.length - 1; i >= 0; i--) {
      this.removeProjectile(this.enemyDestructibleProjectiles[i]);
    }
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      this.removeProjectile(this.playerProjectiles[i]);
    }
    this.updateObstaclesMeshes(true);
  }

  private loadStage(id: number) {
    this.clearStage();
    this.stageManager.load(id);
    this.active = true;
  }

  async init() {
    await this.assetManager.init(assets);
    this.initScene();
    this.initBackground();
    this.initPlayer();
    this.loadStage(this.currentStage);

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
    } else if (projectile instanceof EnemyProjectile) {
      if (projectile.isDestructible) {
        this.enemyDestructibleProjectiles.push(projectile);
      } else {
        this.enemyProjectiles.push(projectile);
      }
    }

    this.entityManager.add(projectile);
  }

  removeProjectile(projectile: Projectile) {
    if (projectile instanceof PlayerProjectile) {
      const index = this.playerProjectiles.indexOf(projectile);
      if (index !== -1) {
        this.playerProjectiles.splice(index, 1);
      }
    } else if (projectile instanceof EnemyProjectile) {
      if (projectile.isDestructible) {
        const index = this.enemyDestructibleProjectiles.indexOf(projectile);
        if (index !== -1) {
          this.enemyDestructibleProjectiles.splice(index, 1);
        }
      } else {
        const index = this.enemyProjectiles.indexOf(projectile);
        if (index !== -1) {
          this.enemyProjectiles.splice(index, 1);
        }
      }
    }

    this.entityManager.remove(projectile);
  }

  addGuard(guard: Guard) {
    this.guards.push(guard);
    this.entityManager.add(guard);
    this.scene.add(guard.mesh);
  }

  removeGuard(guard: Guard) {
    const index = this.guards.indexOf(guard);
    if (index !== -1) {
      this.guards.splice(index, 1);
    }

    this.entityManager.remove(guard);
    this.scene.remove(guard.mesh);
  }

  addObstacle(obstacle: Obstacle) {
    this.obstacles.push(obstacle);
    this.entityManager.add(obstacle);
  }

  removeObstacle(obstacle: Obstacle) {
    const index = this.obstacles.indexOf(obstacle);
    if (index !== -1) {
      this.obstacles.splice(index, 1);
    }
    this.entityManager.remove(obstacle);
  }

  updateField(x: number, y: number, z: number) {
    this.field.set(x, y, z);
    if (this.fieldMesh) {
      this.fieldMesh.geometry.dispose();
      this.fieldMesh.geometry = new THREE.BoxGeometry(x, y, z);
    }
  }
}
