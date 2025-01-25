import { Object3D, PositionalAudio } from "three";
import { BoundingSphere, GameEntity, OBB, Vector3 } from "yuka";

export function sync(entity: GameEntity, renderComponent: Object3D) {
  renderComponent.matrix.copy(entity.worldMatrix as any);
}

type SoundEmitter = {
  audios: Map<string, PositionalAudio>;
};

export function playAudio(entity: SoundEmitter, name: string) {
  const audio = entity.audios.get(name);
  if (!audio) {
    return;
  }
  if (audio.isPlaying) {
    audio.stop();
  }
  audio.play();
}

export function intersects(
  obb: {
    position: Vector3;
    boundingRadius: number;
    obb: OBB;
  },
  sphere: {
    position: Vector3;
    boundingRadius: number;
    boundingSphere: BoundingSphere;
  },
) {
  const squaredDistance = obb.position.squaredDistanceTo(sphere.position);
  const range = obb.boundingRadius + sphere.boundingRadius;
  if (squaredDistance <= range * range) {
    return obb.obb.intersectsBoundingSphere(sphere.boundingSphere);
  }
  return false;
}
