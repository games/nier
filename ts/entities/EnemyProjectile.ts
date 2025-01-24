import { BoundingSphere, MovingEntity, Vector3 } from "yuka";
import { Projectile } from "./Projectile";
import { World } from "../core/World";

const target = new Vector3();

export class EnemyProjectile extends Projectile {
  public expiryTime: number;
  public readonly boundingSphere: BoundingSphere;
  public isDestructible = false;

  constructor(world: World, owner: MovingEntity, direction: Vector3) {
    super(world);

    this.expiryTime = world.time.getElapsed() + 5;
    this.boundingRadius = 0.4;
    this.boundingSphere = new BoundingSphere();
    this.boundingSphere.radius = this.boundingRadius;

    this.maxSpeed = 10;
    this.velocity.copy(direction).multiplyScalar(this.maxSpeed);
    this.position.copy(owner.position);
    this.position.y = 0.4;

    target.copy(this.position).add(this.velocity);
    this.lookAt(target);
  }

  update(delta: number) {
    super.update(delta);
    this.boundingSphere.center.copy(this.position);
    return this;
  }
}
