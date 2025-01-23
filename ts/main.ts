import "./styles.css";
import { World } from "./core/World";

(async () => {
  const world = new World();
  await world.init();
  world.run();
})();
