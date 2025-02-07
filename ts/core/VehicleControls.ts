import { EventDispatcher, Vector3, MathUtils } from "yuka";
import * as THREE from "three";
import { Player } from "../entities/Player";
import { isMobile } from "mobile-device-detect";

const direction = new Vector3();
const target = new Vector3();
const currentGamepadValues = {
  buttonPressed: false,
  leftStickX: 0,
  leftStickY: 0,
  rightStickX: 0,
  rightStickY: 0,
};

type Input = {
  forward: boolean;
  backward: boolean;
  right: boolean;
  left: boolean;
  mouseDown: boolean;
};

export class VehicleControls extends EventDispatcher {
  private cameraOffset: Vector3;
  private cameraMovementSpeed = 2.5;
  private rotationSpeed = 5;
  private brakingForce = 10;
  private movementX = 0;
  private movementY = -1;
  private gamepadActive = false;
  private input: Input;

  constructor(
    private readonly owner: Player,
    private readonly camera: THREE.Camera,
  ) {
    super();

    this.cameraOffset = new Vector3(0, 20, 10);
    this.input = {
      forward: false,
      backward: false,
      right: false,
      left: false,
      mouseDown: false,
    };

    this.onKeyUp = this.onKeyUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onPointerlockChange = this.onPointerlockChange.bind(this);
    this.onPointerlockError = this.onPointerlockError.bind(this);
  }

  connect() {
    document.addEventListener("keyup", this.onKeyUp, false);
    document.addEventListener("keydown", this.onKeyDown, false);
    document.addEventListener("mousemove", this.onMouseMove, false);
    document.addEventListener("mousedown", this.onMouseDown, false);
    document.addEventListener("mouseup", this.onMouseUp, false);
    document.addEventListener(
      "pointerlockchange",
      this.onPointerlockChange,
      false,
    );
    document.addEventListener(
      "pointerlockerror",
      this.onPointerlockError,
      false,
    );

    if (!isMobile) {
      document.body.requestPointerLock({ unadjustedMovement: true });
    }
  }

  disconnect() {
    document.removeEventListener("keyup", this.onKeyUp, false);
    document.removeEventListener("keydown", this.onKeyDown, false);
    document.removeEventListener("mousemove", this.onMouseMove, false);
    document.removeEventListener("mousedown", this.onMouseDown, false);
    document.removeEventListener("mouseup", this.onMouseUp, false);
    document.removeEventListener(
      "pointerlockchange",
      this.onPointerlockChange,
      false,
    );
    document.removeEventListener(
      "pointerlockerror",
      this.onPointerlockError,
      false,
    );
  }

  exit() {
    document.exitPointerLock();
  }

  update(delta: number) {
    if (this.gamepadActive) {
    } else {
      const input = this.input;
      direction.z = Number(input.backward) - Number(input.forward);
      direction.x = Number(input.right) - Number(input.left);
      direction.normalize();
      target.set(this.movementX, 0, this.movementY).normalize();
      target.add(this.owner.position);
      this.owner.lookAt(target);
    }

    // update player position
    if (direction.squaredLength() === 0) {
      this.owner.velocity.x -=
        this.owner.velocity.x * this.brakingForce * delta;
      this.owner.velocity.z -=
        this.owner.velocity.z * this.brakingForce * delta;
    } else {
      this.owner.velocity.add(direction);
    }

    if (this.input.mouseDown || currentGamepadValues.buttonPressed === true) {
      this.owner.shoot();
    }

    // update camera

    const offsetX =
      this.camera.position.x - this.cameraOffset.x - this.owner.position.x;
    const offsetZ =
      this.camera.position.z - this.cameraOffset.z - this.owner.position.z;

    if (offsetX !== 0)
      this.camera.position.x -= offsetX * delta * this.cameraMovementSpeed;
    if (offsetZ !== 0)
      this.camera.position.z -= offsetZ * delta * this.cameraMovementSpeed;
  }

  reset() {
    this.input.forward = false;
    this.input.backward = false;
    this.input.left = false;
    this.input.right = false;
    this.input.mouseDown = false;
  }

  resetRotation() {
    this.movementX = 0;
    this.movementY = -1;
    this.owner.rotation.fromEuler(0, Math.PI, 0);
  }

  setPosition(x: number, y: number, z: number) {
    this.owner.position.set(x, y, z);

    this.camera.position.set(x, y, z).add(this.cameraOffset);
    this.camera.lookAt(x, y, z);
  }

  private onKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      case "up": // up
      case "w": // w
        this.input.forward = false;
        break;

      case "ArrowLeft": // left
      case "a": // a
        this.input.left = false;
        break;

      case "ArrowDown": // down
      case "s": // s
        this.input.backward = false;
        break;

      case "ArrowRight": // right
      case "d": // d
        this.input.right = false;
        break;
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "up": // up
      case "w": // w
        this.input.forward = true;
        break;

      case "ArrowLeft": // left
      case "a": // a
        this.input.left = true;
        break;

      case "ArrowDown": // down
      case "s": // s
        this.input.backward = true;
        break;

      case "ArrowRight": // right
      case "d": // d
        this.input.right = true;
        break;
    }
  }

  private onMouseMove(event: MouseEvent) {
    const x = event.movementX / screen.width;
    const y = event.movementY / screen.height;

    this.movementX += x * this.rotationSpeed;
    this.movementY += y * this.rotationSpeed;

    this.movementX = MathUtils.clamp(this.movementX, -1, 1);
    this.movementY = MathUtils.clamp(this.movementY, -1, 1);
  }

  private onMouseDown(event: MouseEvent) {
    if (event.button === 0) {
      this.input.mouseDown = true;
    }
  }

  private onMouseUp(event: MouseEvent) {
    if (event.button === 0) {
      this.input.mouseDown = false;
    }
  }

  private onPointerlockChange() {
    if (document.pointerLockElement === document.body) {
      this.dispatchEvent({ type: "lock" });
    } else {
      this.disconnect();

      this.reset();

      this.dispatchEvent({ type: "unlock" });
    }
  }

  private onPointerlockError() {
    console.warn("YUKA.VehicleControls: Unable to use Pointer Lock API.");
  }
}
