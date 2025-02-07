import "./styles.css";
import { World } from "./core/World";

const start = document.querySelector("#start") as HTMLButtonElement;
start.addEventListener("click", async () => {
  start.remove();

  const world = new World();
  await world.init();
  world.run();

  document.querySelector("#startScreen")?.remove();
});
