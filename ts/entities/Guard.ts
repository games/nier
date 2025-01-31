import {
  BoundingSphere,
  Quaternion,
  State,
  StateMachine,
  Telegram,
  Vehicle,
} from "yuka";
import * as THREE from "three";
import { World } from "../core/World";
import { playAudio } from "./utils";

const MAX_HEALTH_POINTS = 8;
const q = new Quaternion();

export class Guard extends Vehicle {
  private healthPoints = MAX_HEALTH_POINTS;
  public readonly boundingSphere: BoundingSphere;
  private stateMachineMovement: StateMachine<Guard>;
  private stateMachineCombat: StateMachine<Guard>;
  public readonly audios: Map<string, THREE.PositionalAudio>;
  public protectionMesh?: THREE.Mesh;
  private protected = false;
  public hitMesh?: THREE.Mesh;
  private hitted = false;
  private hitEffectDuration = 0.25;
  private hitEffectMinDuration = 0.15;
  private hideHitEffectTime = -Infinity;

  constructor(
    private readonly world: World,
    public readonly mesh: THREE.Mesh,
  ) {
    super();

    this.boundingRadius = 0.5;
    this.boundingSphere = new BoundingSphere();
    this.boundingSphere.radius = this.boundingRadius;

    this.stateMachineMovement = new StateMachine(this);
    this.stateMachineCombat = new StateMachine(this);

    this.audios = new Map();
  }

  enableProtection() {
    this.protected = true;
    if (this.protectionMesh) {
      this.protectionMesh.visible = true;
    }
  }

  disableProtection() {
    if (!this.protected) {
      return;
    }

    this.protected = false;
    if (this.protectionMesh) {
      this.protectionMesh.visible = false;
    }

    playAudio(this, "coreShieldDestroyed");
    return this;
  }

  setMovementPattern(pattern: State<Guard>) {
    this.stateMachineMovement.currentState = pattern;
    this.stateMachineMovement.currentState.enter(this);
    return this;
  }

  setCombatPattern(pattern: State<Guard>) {
    this.stateMachineCombat.currentState = pattern;
    this.stateMachineCombat.currentState.enter(this);
    return this;
  }

  update(delta: number) {
    this.boundingSphere.center.copy(this.position);
    this.stateMachineMovement.update();
    this.stateMachineCombat.update();

    super.update(delta);

    const world = this.world;
    if (
      this.protected &&
      this.protectionMesh &&
      this.protectionMesh.material instanceof THREE.ShaderMaterial
    ) {
      this.protectionMesh.material.uniforms.time.value =
        world.time.getElapsed();
    }

    if (this.hitted && this.hitMesh) {
      q.copy(this.rotation).inverse();
      this.hitMesh.quaternion.copy(q).multiply(world.camera.quaternion);
      this.hitMesh.updateMatrix();
      if (this.hitMesh.material instanceof THREE.ShaderMaterial) {
        this.hitMesh.material.uniforms.time.value += delta;
        if (world.time.getElapsed() > this.hideHitEffectTime) {
          this.hitMesh.visible = false;
          this.hitted = false;
        }
      }
    }

    return this;
  }

  handleMessage(telegram: Telegram) {
    const world = this.world;
    switch (telegram.message) {
      case "hit":
        if (!this.protected) {
          this.healthPoints--;
          if (!this.hitMesh) {
            break;
          }
          const material = this.hitMesh.material as THREE.ShaderMaterial;
          if (this.hitted) {
            if (material.uniforms.time.value > this.hitEffectMinDuration) {
              material.uniforms.time.value = 0;
              this.hideHitEffectTime =
                world.time.getElapsed() + this.hitEffectDuration;
            }
          } else {
            this.hitted = true;
            this.hitMesh.visible = true;
            material.uniforms.time.value = 0;
            this.hideHitEffectTime =
              world.time.getElapsed() + this.hitEffectDuration;
          }

          playAudio(this, "enemyHit");
          if (this.healthPoints <= 0) {
            playAudio(this, "coreExplode");
            world.removeGuard(this);

            this.stateMachineCombat.currentState?.exit(this);
            this.stateMachineMovement.currentState?.exit(this);
          }
        } else {
          playAudio(this, "coreShieldHit");
        }
        break;
      default:
        console.error("Unknown message type:", telegram.message);
    }

    return true;
  }
}
