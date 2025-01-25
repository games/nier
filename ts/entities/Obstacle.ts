import { AABB, GameEntity, OBB, Vector3 } from "yuka";

export class Obstacle extends GameEntity {
  public readonly aabb: AABB;
  public readonly obb: OBB;
  public needsUpdate = true;
  public readonly size: Vector3;

  constructor() {
    super();
    this.boundingRadius = 0.75;
    this.aabb = new AABB();
    this.obb = new OBB();
    this.size = new Vector3(1, 1, 1);
  }

  updateBoundingVolumes() {
    this.aabb.fromCenterAndSize(this.position, this.size);
    this.obb.center.copy(this.position);
    this.obb.halfSizes.copy(this.size).multiplyScalar(0.5);
  }
}
