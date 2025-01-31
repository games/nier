import "./styles.css";
import { World } from "./core/World";

const start = document.querySelector("#start") as HTMLButtonElement;
start.addEventListener("click", async () => {
  document.querySelector("#startScreen")?.remove();

  const world = new World();
  await world.init();
  world.run();
});
