import { OBB, Vector3 } from "yuka";
import { Player } from "./Player";
import { Projectile } from "./Projectile";

const target = new Vector3();

export class PlayerProjectile extends Projectile {
  public readonly isPlayerProjectile = true;
  public readonly obb: OBB;

  constructor(owner: Player, direction: Vector3) {
    super(owner.world);

    this.boundingRadius = 0.5;

    this.maxSpeed = 20;
    this.velocity.copy(direction).multiplyScalar(this.maxSpeed);
    this.position.copy(owner.position);
    this.position.y = 0.5;

    target.copy(this.position).add(direction);
    this.lookAt(target);

    this.obb = new OBB();
    this.obb.halfSizes.set(0.1, 0.1, 0.5);
    this.obb.rotation.fromQuaternion(this.rotation);
  }

  update(delta: number) {
    super.update(delta);
    this.obb.center.copy(this.position);
    return this;
  }
}
