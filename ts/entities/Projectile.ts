import { MovingEntity } from "yuka";
import { World } from "../core/World";

export class Projectile extends MovingEntity {
  constructor(private world: World) {
    super();
  }

  update(delta: number) {
    super.update(delta);

    const fx = this.world.field.x * 0.5;
    const fz = this.world.field.z * 0.5;
    if (
      this.position.x < -fx ||
      this.position.x > fx ||
      this.position.z < -fz ||
      this.position.z > fz
    ) {
      this.world.removeProjectile(this);
    }

    return this;
  }
}
