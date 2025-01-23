import { Matrix4, Object3D } from "three";
import { GameEntity } from "yuka";

export function sync(entity: GameEntity, renderComponent: Object3D) {
  renderComponent.matrix.copy(entity.worldMatrix as any);
}
