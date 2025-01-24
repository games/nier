import { GameEntity, MovingEntity, State, Vector3 } from "yuka";
import { World } from "../core/World";
import { EnemyProjectile } from "../entities/EnemyProjectile";
import { playAudio } from "../entities/utils";

const direction = new Vector3();
const target = new Vector3();
const TWO_PI = Math.PI * 2;

class CombatPattern<T extends GameEntity> extends State<T> {
  public shotsPerSecond = 0.5;
  public projectilesPerShot = 3;
  public destructibleProjectiles = 0; // amount of destructible projectiles per shot [0,1]
  public lastShotTime = 0;

  constructor(public readonly world: World) {
    super();
  }

  enter(owner: T): void {
    this.lastShotTime = this.world.time.getElapsed();
  }
}

export class DefaultCombatPattern<
  T extends MovingEntity,
> extends CombatPattern<T> {
  private angularStep = Math.PI * 0.167; // 30 degrees;

  execute(enemy: T): void {
    const elapsedTime = this.world.time.getElapsed();
    const halfAngle = (this.angularStep * (this.projectilesPerShot - 1)) / 2;

    if (elapsedTime - this.lastShotTime > 1 / this.shotsPerSecond) {
      this.lastShotTime = elapsedTime;
      for (let i = 0; i < this.projectilesPerShot; i++) {
        const s = halfAngle - i * this.angularStep;
        target.copy(enemy.position);
        target.x += Math.sin(s);
        target.z += Math.cos(s);

        direction.subVectors(target, enemy.position).normalize();
        direction.applyRotation(enemy.rotation);

        const projectile = new EnemyProjectile(this.world, enemy, direction);
        if (Math.random() <= this.destructibleProjectiles) {
          projectile.isDestructible = true;
        }
        this.world.addProjectile(projectile);
      }
      playAudio(enemy as any, "enemyShot");
    }
  }
}
