import {
  BoundingSphere,
  GameEntity,
  State,
  StateMachine,
  Telegram,
} from "yuka";
import { World } from "../core/World";
import { Object3D, PositionalAudio } from "three";
import { playAudio } from "./utils";
import { Player } from "./Player";

const MAX_HEALTH_POINTS = 8;

export class Tower extends GameEntity {
  private healthPoints = MAX_HEALTH_POINTS;
  public readonly boundingSphere: BoundingSphere;
  private stateMachineCombat: StateMachine<Tower>;
  public readonly audios: Map<string, PositionalAudio>;

  constructor(
    private world: World,
    public readonly view: Object3D,
  ) {
    super();
    this.boundingRadius = 0.5;
    this.boundingSphere = new BoundingSphere();
    this.boundingSphere.radius = this.boundingRadius;
    this.stateMachineCombat = new StateMachine(this);

    this.audios = new Map();
  }

  setCombatPattern(pattern: State<Tower>) {
    this.stateMachineCombat.currentState = pattern;
    this.stateMachineCombat.currentState?.enter(this);
    return this;
  }

  updateBoundingVolumes() {
    this.boundingSphere.center.copy(this.position);
  }

  update() {
    this.stateMachineCombat.update();
    return this;
  }

  handleMessage(telegram: Telegram) {
    if (telegram.message === "hit") {
      this.healthPoints--;
      playAudio(this, "enemyHit");
      if (this.healthPoints === 0) {
        playAudio(this, "enemyExplode");
        this.world.removeTower(this);
        this.stateMachineCombat.currentState?.exit(this);
      }
    }

    return true;
  }

  intersectsPlayer(player: Player) {
    const squaredDistance = player.position.squaredDistanceTo(this.position);
    const range = player.boundingRadius + this.boundingRadius;
    if (squaredDistance <= range * range) {
      return player.obb.intersectsBoundingSphere(this.boundingSphere);
    }
    return false;
  }
}
