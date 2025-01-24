import { GameEntity, State } from "yuka";
import { World } from "../core/World";

class MovementPattern<T extends GameEntity> extends State<T> {
  public speed = 1.5;
  public spread = 4;
}

export class LeftRightMovementPattern<
  T extends GameEntity,
> extends MovementPattern<T> {
  constructor(private readonly world: World) {
    super();
  }

  execute(enemy: T) {
    const elapsedTime = this.world.time.getElapsed();
    enemy.position.x = Math.cos(elapsedTime * this.speed) * this.spread;
  }
}
