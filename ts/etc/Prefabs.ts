import * as THREE from "three";
import { World } from "../core/World";
import { HitShader, ProtectionShader } from "./Shaders";
import { Guard } from "../entities/Guard";
import { GameEntity } from "yuka";

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
