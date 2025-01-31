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
import { Particle, ParticleSystem } from "../core/ParticleSystem";
import { playAudio } from "./utils";
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
  public readonly particleSystem: ParticleSystem;
  private particlesPerSecond = 6;
  private particlesNextEmissionTime = 0;
  private particlesElapsedTime = 0;

  constructor(
    public readonly world: World,
    public readonly mesh: THREE.Mesh,
  ) {
    super();

    this.maxSpeed = 6;
    this.updateOrientation = false;
    this.boundingRadius = 0.5;

    this.obb = new OBB();
    this.obb.halfSizes.set(0.1, 0.1, 0.5);

    this.audios = new Map();
    this.particleSystem = new ParticleSystem();
    this.particleSystem.init(this.maxParticles);
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

  private updateParticles(delta: number) {
    const timeScale = this.getSpeed() / this.maxSpeed; // [0,1]
    const effectiveDelta = delta * timeScale;
    this.particlesElapsedTime += effectiveDelta;

    if (this.particlesElapsedTime > this.particlesNextEmissionTime) {
      const t = 1 / this.particlesPerSecond;

      this.particlesNextEmissionTime =
        this.particlesElapsedTime + t / 2 + (t / 2) * Math.random();

      // emit new particle
      const particle = new Particle();
      offset.x = Math.random() * 0.3;
      offset.y = Math.random() * 0.3;
      offset.z = Math.random() * 0.3;
      particle.position.copy(this.position).add(offset);
      particle.lifetime = Math.random() * 0.7 + 0.3;
      particle.opacity = Math.random() * 0.5 + 0.5;
      particle.size = Math.floor(Math.random() * 10) + 10;
      particle.angle = Math.round(Math.random()) * Math.PI * Math.random();

      this.particleSystem.add(particle);
    }

    // update the system itself
    this.particleSystem.update(delta);
  }

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
