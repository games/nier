import * as THREE from "three";
import { Vector3 } from "yuka";
import { ParticleShader } from "../etc/Shaders";

export class Particle {
  constructor(
    public position = new Vector3(),
    public lifetime = 1,
    public opacity = 1,
    public size = 10,
    public angle = 10,
    public elapsedTime = 0,
  ) {}
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public maxParticles = 0;
  private needsUpdate = false;
  public points?: THREE.Points;

  add(particle: Particle) {
    this.particles.push(particle);
    this.needsUpdate = true;
    return this;
  }

  remove(particle: Particle) {
    const index = this.particles.indexOf(particle);
    this.particles.splice(index, 1);
    this.needsUpdate = true;
    return this;
  }

  clear() {
    this.particles.length = 0;
  }

  init(maxParticles: number) {
    this.maxParticles = maxParticles;

    const loader = new THREE.TextureLoader();
    const map = loader.load("./assets/texture/quad.png");

    const material = new THREE.ShaderMaterial(ParticleShader);
    material.uniforms.map.value = map;
    material.transparent = true;
    material.depthWrite = false;

    const geometry = new THREE.BufferGeometry();

    const positionAttribute = new THREE.BufferAttribute(
      new Float32Array(3 * maxParticles),
      3,
    );
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", positionAttribute);

    const opacityAttribute = new THREE.BufferAttribute(
      new Float32Array(maxParticles),
      1,
    );
    opacityAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("opacity", opacityAttribute);

    const sizeAttribute = new THREE.BufferAttribute(
      new Uint8Array(maxParticles),
      1,
    );
    sizeAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("size", sizeAttribute);

    const angleAttribute = new THREE.BufferAttribute(
      new Float32Array(maxParticles),
      1,
    );
    angleAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("angle", angleAttribute);

    const tAttribute = new THREE.BufferAttribute(
      new Float32Array(maxParticles),
      1,
    );
    tAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("t", tAttribute);

    this.points = new THREE.Points(geometry, material);

    return this;
  }

  update(delta: number) {
    if (!this.points) {
      return;
    }
    const particles = this.particles;
    const geometry = this.points.geometry;

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.elapsedTime += delta;
      if (particle.elapsedTime >= particle.lifetime) {
        this.remove(particle);
      }
    }

    // update buffer data for rendering
    // rebuild position and opacity buffer if necessary
    if (this.needsUpdate) {
      const positionAttribute = geometry.getAttribute("position");
      const opacityAttribute = geometry.getAttribute("opacity");
      const sizeAttribute = geometry.getAttribute("size");
      const angleAttribute = geometry.getAttribute("angle");

      for (let i = 0, l = particles.length; i < l; i++) {
        const particle = particles[i];

        const position = particle.position;
        const opacity = particle.opacity;
        const size = particle.size;
        const angle = particle.angle;

        positionAttribute.setXYZ(i, position.x, position.y, position.z);
        opacityAttribute.setX(i, opacity);
        sizeAttribute.setX(i, size);
        angleAttribute.setX(i, angle);
      }

      positionAttribute.needsUpdate = true;
      opacityAttribute.needsUpdate = true;
      sizeAttribute.needsUpdate = true;
      angleAttribute.needsUpdate = true;
    }

    // always rebuild "t" attribute which is used for animation
    const tAttribute = geometry.getAttribute("t");
    for (let i = 0, l = particles.length; i < l; i++) {
      const particle = particles[i];
      tAttribute.setX(i, particle.elapsedTime / particle.lifetime);
    }
    tAttribute.needsUpdate = true;

    // update draw range
    geometry.setDrawRange(0, particles.length);
    return this;
  }
}
