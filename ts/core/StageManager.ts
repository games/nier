import { Obstacle } from "../entities/Obstacle";
import {
  DefaultCombatPattern,
  SpreadCombatPattern,
} from "../patterns/CombatPattern";
import { LeftRightMovementPattern } from "../patterns/MovementPatterns";
import { World } from "./World";

type StageLoader = (world: World) => void;

const stages: StageLoader[] = [
  (world: World) => {
    // world.updateField(15, 1, 15);
    world.updateField(25, 1, 25);

    if (world.controls) {
      world.controls.setPosition(0, 0.5, 5);
      world.controls.resetRotation();
    }

    const guard = world.prefabs.guard();
    guard.position.set(0, 0.5, -4);
    guard.setCombatPattern(new DefaultCombatPattern(world));
    guard.setMovementPattern(new LeftRightMovementPattern(world));
    guard.enableProtection();
    world.addGuard(guard);

    // for (let i = 0; i < 5; i++) {
    //   const obstacle = new Obstacle();
    //   obstacle.position.set(6 - i * 3, 0.5, 2);
    //   world.addObstacle(obstacle);
    // }

    // obstacles

    // bottom row

    let obstacle = new Obstacle();
    obstacle.position.set(0, 0.5, 9);
    world.addObstacle(obstacle);

    obstacle = new Obstacle();
    obstacle.position.set(-1.25, 0.5, 9);
    world.addObstacle(obstacle);

    obstacle = new Obstacle();
    obstacle.position.set(1.25, 0.5, 9);
    world.addObstacle(obstacle);

    // left row

    obstacle = new Obstacle();
    obstacle.position.set(-8, 0.5, -1.25);
    world.addObstacle(obstacle);

    obstacle = new Obstacle();
    obstacle.position.set(-8, 0.5, 0);
    world.addObstacle(obstacle);

    obstacle = new Obstacle();
    obstacle.position.set(-8, 0.5, 1.25);
    world.addObstacle(obstacle);

    // right row

    obstacle = new Obstacle();
    obstacle.position.set(8, 0.5, -1.25);
    world.addObstacle(obstacle);

    obstacle = new Obstacle();
    obstacle.position.set(8, 0.5, 0);
    world.addObstacle(obstacle);

    obstacle = new Obstacle();
    obstacle.position.set(8, 0.5, 1.25);
    world.addObstacle(obstacle);

    for (let i = 0; i < 3; i++) {
      // const obstacle = new Obstacle();
      // obstacle.position.set(6 - i * 3, 0.5, 2);
      // world.addObstacle(obstacle);
      const tower = world.prefabs.tower();
      const towerCombatPattern = new SpreadCombatPattern(world);
      towerCombatPattern.projectilesPerShot = 4;
      towerCombatPattern.enableRotation = false;
      tower.setCombatPattern(towerCombatPattern);
      tower.position.set(-3 + i * 3, 0.5, 2);
      tower.updateBoundingVolumes();
      world.addTower(tower);
    }
  },
];

export class StageManager {
  constructor(private readonly world: World) {}

  load(id: number) {
    if (id >= 0 && id < stages.length) {
      stages[id](this.world);
    }
  }
}
