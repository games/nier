import * as THREE from "three";
import { World } from "../core/World";
import { HitShader, ProtectionShader } from "./Shaders";
import { Guard } from "../entities/Guard";
import { GameEntity } from "yuka";
import { Tower } from "../entities/Tower";
import { Player } from "../entities/Player";

function sync(entity: GameEntity, renderComponent: THREE.Object3D) {
  renderComponent.matrix.copy(entity.worldMatrix as any);
}

function createGuardMesh() {
  const guardGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const guardMaterial = new THREE.MeshLambertMaterial({ color: 0x333132 });
  const guardMesh = new THREE.Mesh(guardGeometry, guardMaterial);
  guardMesh.matrixAutoUpdate = false;
  guardMesh.castShadow = true;

  const protectionGeometry = new THREE.SphereGeometry(0.75, 16, 16);
  const protectionMaterial = new THREE.ShaderMaterial(ProtectionShader);
  protectionMaterial.transparent = true;
  const protectionMesh = new THREE.Mesh(protectionGeometry, protectionMaterial);
  protectionMesh.matrixAutoUpdate = false;
  protectionMesh.visible = false;

  const hitGeometry = new THREE.PlaneGeometry(2.5, 2.5);
  const hitMaterial = new THREE.ShaderMaterial(HitShader);
  hitMaterial.transparent = true;
  const hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);
  hitMesh.matrixAutoUpdate = false;
  hitMesh.visible = false;

  return { guardMesh, protectionMesh, hitMesh };
}

export function guard(world: World) {
  const { guardMesh, protectionMesh, hitMesh } = createGuardMesh();
  return () => {
    const gm = guardMesh.clone();
    const pm = protectionMesh.clone();
    pm.material = protectionMesh.material.clone();
    const hm = hitMesh.clone();
    hm.material = hitMesh.material.clone();
    gm.add(pm);
    gm.add(hm);

    const guard = new Guard(world, gm);
    guard.setRenderComponent(gm, sync);
    guard.protectionMesh = pm;
    guard.hitMesh = hm;

    const assets = world.assetManager;
    const enemyShot = assets.cloneAudio("enemyShot");
    const enemyHit = assets.cloneAudio("enemyHit");
    const coreExplode = assets.cloneAudio("coreExplode");
    const coreShieldHit = assets.cloneAudio("coreShieldHit");
    const coreShieldDestroyed = assets.cloneAudio("coreShieldDestroyed");

    guardMesh.add(enemyShot);
    guardMesh.add(enemyHit);
    guardMesh.add(coreExplode);
    guardMesh.add(coreShieldHit);
    guardMesh.add(coreShieldDestroyed);

    guard.audios.set("enemyShot", enemyShot);
    guard.audios.set("enemyHit", enemyHit);
    guard.audios.set("coreExplode", coreExplode);
    guard.audios.set("coreShieldHit", coreShieldHit);
    guard.audios.set("coreShieldDestroyed", coreShieldDestroyed);

    return guard;
  };
}

export function playerProjectile() {
  return (maxInstances: number) => {
    const geometry = new THREE.PlaneGeometry(0.2, 1);
    geometry.rotateX(Math.PI * -0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0xfff9c2 });

    const instance = new THREE.InstancedMesh(geometry, material, maxInstances);
    instance.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instance.frustumCulled = false;
    return instance;
  };
}

export function enemyProjectile() {
  return (maxInstances: number) => {
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    geometry.rotateX(Math.PI * -0.5);
    const material = new THREE.MeshLambertMaterial({ color: 0x43254d });

    const instance = new THREE.InstancedMesh(geometry, material, maxInstances);
    instance.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instance.frustumCulled = false;
    return instance;
  };
}

export function enemyDestructibleProjectile() {
  return (maxInstances: number) => {
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    geometry.rotateX(Math.PI * -0.5);
    const material = new THREE.MeshLambertMaterial({ color: 0xf34d08 });

    const instance = new THREE.InstancedMesh(geometry, material, maxInstances);
    instance.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instance.frustumCulled = false;
    return instance;
  };
}

export function obstacle(_world: World) {
  return (maxInstances: number) => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xdedad3 });

    // const obstacle = world.assetManager.getModel("obstacle");
    // obstacle.matrixAutoUpdate = false;
    // obstacle.castShadow = true;
    // const geometry = obstacle.geometry.clone();
    // const material = obstacle.material;

    const instance = new THREE.InstancedMesh(geometry, material, maxInstances);
    instance.frustumCulled = false;
    instance.castShadow = true;
    return instance;
  };
}

export function tower(world: World) {
  return () => {
    const assets = world.assetManager;

    const mesh = world.assetManager.getModel("obstacle").clone();
    mesh.matrixAutoUpdate = false;
    mesh.castShadow = true;

    const tower = new Tower(world, mesh);
    tower.setRenderComponent(mesh, sync);

    const enemyShot = assets.cloneAudio("enemyShot");
    const enemyExplode = assets.cloneAudio("enemyExplode");
    const enemyHit = assets.cloneAudio("enemyHit");

    tower.audios.set("enemyShot", enemyShot);
    tower.audios.set("enemyExplode", enemyExplode);
    tower.audios.set("enemyHit", enemyHit);

    mesh.add(enemyShot);
    mesh.add(enemyExplode);
    mesh.add(enemyHit);

    return tower;
  };
}

export function player(world: World) {
  return () => {
    const assetManager = world.assetManager;
    const playerShot = assetManager.getAudio("playerShot");
    const playerHit = assetManager.getAudio("playerHit");
    const playerExplode = assetManager.getAudio("playerExplode");

    const jet = world.assetManager.getModel("jet").clone();
    jet.matrixAutoUpdate = false;
    jet.castShadow = true;
    jet.add(playerShot, playerHit, playerExplode);

    const player = new Player(world, jet);
    player.audios.set("playerShot", playerShot);
    player.audios.set("playerHit", playerHit);
    player.audios.set("playerExplode", playerExplode);

    player.setRenderComponent(jet, sync);

    return player;
  };
}
