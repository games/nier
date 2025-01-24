import { Object3D, PositionalAudio } from "three";
import { GameEntity } from "yuka";

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
