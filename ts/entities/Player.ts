import { AABB, MovingEntity, MathUtils, OBB, Ray, Vector3 } from "yuka";
import * as THREE from "three";
import { World } from "../core/World";
import { ParticleSystem } from "../core/ParticleSystem";
import { sync } from "./utils";

const aabb = new AABB();
const direction = new Vector3();
const intersectionPoint = new Vector3();
const intersectionNormal = new Vector3();
const ray = new Ray();
const reflectionVector = new Vector3();
const offset = new Vector3();

const MAX_HEALTH_POINTS = 3;

export class Player extends MovingEntity {
  private healthPoints = MAX_HEALTH_POINTS;
  private shotsPerSecond = 10;
  private lastShotTime = 0;
  private obb: OBB;
  private audios: Map<string, any>;
  private maxParticles = 20;
  private particleSystem: ParticleSystem;
  private particlesPerSecond = 6;
  private particlesNextEmissionTime = 0;
  private particlesElapsedTime = 0;

  public readonly mesh: THREE.Mesh;

  constructor(private readonly world: World) {
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
  }

  update(delta: number) {
    this.obb.center.copy(this.position);
    this.obb.rotation.fromQuaternion(this.rotation);

    this.restrictMovement();
    super.update(delta);
    this.updateParticles(delta);

    return this;
  }

  shoot() {}

  private updateParticles(delta: number) {}

  private restrictMovement() {}
}
