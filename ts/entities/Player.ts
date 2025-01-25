import {
  AABB,
  MovingEntity,
  MathUtils,
  OBB,
  Ray,
  Vector3,
  Telegram,
} from "yuka";
import * as THREE from "three";
import { World } from "../core/World";
import { ParticleSystem } from "../core/ParticleSystem";
import { playAudio, sync } from "./utils";
import { PlayerProjectile } from "./PlayerProjectile";

const aabb = new AABB();
const direction = new Vector3();
const intersectionPoint = new Vector3();
const intersectionNormal = new Vector3();
const ray = new Ray();
const reflectionVector = new Vector3();
const offset = new Vector3();

const MAX_HEALTH_POINTS = 3;

export class Player extends MovingEntity {
  public healthPoints = MAX_HEALTH_POINTS;
  private shotsPerSecond = 10;
  private lastShotTime = 0;
  public readonly obb: OBB;
  public readonly audios: Map<string, any>;
  private maxParticles = 20;
  private particleSystem: ParticleSystem;
  private particlesPerSecond = 6;
  private particlesNextEmissionTime = 0;
  private particlesElapsedTime = 0;

  public readonly mesh: THREE.Mesh;

  constructor(public readonly world: World) {
    super();

    this.maxSpeed = 6;
    this.updateOrientation = false;
    this.boundingRadius = 0.5;

    this.obb = new OBB();
    this.obb.halfSizes.set(0.1, 0.1, 0.5);

    this.audios = new Map();
    this.particleSystem = new ParticleSystem();
    this.particleSystem.init(this.maxParticles);

    const geometry = new THREE.ConeGeometry(0.2, 1, 8);
    geometry.rotateX(Math.PI * 0.5);
    const material = new THREE.MeshLambertMaterial({ color: 0xdedad3 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.matrixAutoUpdate = false;
    this.mesh.castShadow = true;
    this.setRenderComponent(this.mesh, sync);

    const assetManager = this.world.assetManager;
    const playerShot = assetManager.getAudio("playerShot");
    const playerHit = assetManager.getAudio("playerHit");
    const playerExplode = assetManager.getAudio("playerExplode");

    this.mesh.add(playerShot, playerHit, playerExplode);

    this.audios.set("playerShot", playerShot);
    this.audios.set("playerHit", playerHit);
    this.audios.set("playerExplode", playerExplode);
  }

  update(delta: number) {
    this.obb.center.copy(this.position);
    this.obb.rotation.fromQuaternion(this.rotation);

    this.restrictMovement();
    super.update(delta);
    this.updateParticles(delta);

    return this;
  }

  shoot() {
    const elapsedTime = this.world.time.getElapsed();
    if (elapsedTime - this.lastShotTime > 1 / this.shotsPerSecond) {
      this.lastShotTime = elapsedTime;

      this.getDirection(direction);
      const projectile = new PlayerProjectile(this, direction);
      this.world.addProjectile(projectile);

      playAudio(this, "playerShot");
    }
  }

  handleMessage(telegram: Telegram) {
    if (telegram.message === "hit") {
      playAudio(this, "playerHit");
      this.healthPoints--;
      if (this.healthPoints === 0) {
        playAudio(this, "playerExplode");
      }
    }

    return true;
  }

  private updateParticles(delta: number) {}

  private restrictMovement() {
    if (this.velocity.squaredLength() === 0) {
      return;
    }

    const world = this.world;
    const obstacles = world.obstacles;
    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      aabb.copy(obstacle.aabb);
      aabb.max.addScalar(this.boundingRadius * 0.5);
      aabb.min.subScalar(this.boundingRadius * 0.5);

      ray.origin.copy(this.position);
      ray.direction.copy(this.velocity).normalize();

      // perform ray/AABB intersection test
      if (ray.intersectAABB(aabb, intersectionPoint) !== null) {
        const squaredDistance =
          this.position.squaredDistanceTo(intersectionPoint);
        if (squaredDistance <= this.boundingRadius * this.boundingRadius) {
          // derive normal vector
          aabb.getNormalFromSurfacePoint(intersectionPoint, intersectionNormal);
          // compute reflection vector
          reflectionVector.copy(ray.direction).reflect(intersectionNormal);
          // compute new velocity vector
          const speed = this.getSpeed();
          this.velocity.addVectors(ray.direction, reflectionVector).normalize();
          const f = 1 - Math.abs(intersectionNormal.dot(ray.direction));
          this.velocity.multiplyScalar(speed * f);
        }
      }
    }

    // ensure player does not leave the game area
    const fieldXHalfSize = world.field.x / 2;
    const fieldZHalfSize = world.field.z / 2;

    this.position.x = MathUtils.clamp(
      this.position.x,
      -(fieldXHalfSize - this.boundingRadius),
      fieldXHalfSize - this.boundingRadius,
    );

    this.position.z = MathUtils.clamp(
      this.position.z,
      -(fieldZHalfSize - this.boundingRadius),
      fieldZHalfSize - this.boundingRadius,
    );

    return this;
  }
}
