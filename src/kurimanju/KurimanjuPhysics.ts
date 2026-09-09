import * as RAPIER from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';

export const PHYSICS_REGION_RADIUS = 12;
export const MAX_RAPIER_BODIES = 1500;
export const HARD_MAX_RAPIER_BODIES = 2500;
export const CCD_SPEED_THRESHOLD = 7;
export const KURIMANJU_HALF_EXTENTS = { x: 0.0325, y: 0.015, z: 0.0215 } as const;

export interface PhysicsBodyState {
  body: RAPIER.RigidBody;
  seed: number;
}

export interface PhysicsStats {
  rigidBodyCount: number;
  activeBodyCount: number;
  sleepingBodyCount: number;
}

export class KurimanjuPhysics {
  private world: RAPIER.World | null = null;
  private readonly bodies: PhysicsBodyState[] = [];

  async init(): Promise<void> {
    await RAPIER.init();
    this.createWorld();
  }

  createBody(position: Vector3, velocity: Vector3, angularVelocity: Vector3, seed: number): PhysicsBodyState | null {
    if (!this.world || this.bodies.length >= HARD_MAX_RAPIER_BODIES) {
      return null;
    }
    const descriptor = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinvel(velocity.x, velocity.y, velocity.z)
      .setAngvel({ x: angularVelocity.x, y: angularVelocity.y, z: angularVelocity.z })
      .setCanSleep(true);
    const body = this.world.createRigidBody(descriptor);
    const collider = RAPIER.ColliderDesc.cuboid(KURIMANJU_HALF_EXTENTS.x, KURIMANJU_HALF_EXTENTS.y, KURIMANJU_HALF_EXTENTS.z)
      .setFriction(0.82)
      .setRestitution(0.12)
      .setDensity(1.1);
    this.world.createCollider(collider, body);
    if (velocity.length() > CCD_SPEED_THRESHOLD) {
      body.enableCcd(true);
    }
    const state = { body, seed };
    this.bodies.push(state);
    return state;
  }

  step(): void {
    if (!this.world) {
      return;
    }
    this.world.step();
    for (const state of this.bodies) {
      const speed = state.body.linvel();
      state.body.enableCcd(Math.hypot(speed.x, speed.y, speed.z) > CCD_SPEED_THRESHOLD);
    }
  }

  clear(): void {
    this.createWorld();
  }

  getStates(): readonly PhysicsBodyState[] {
    return this.bodies;
  }

  getStats(): PhysicsStats {
    let sleepingBodyCount = 0;
    for (const state of this.bodies) {
      if (state.body.isSleeping()) {
        sleepingBodyCount += 1;
      }
    }
    return {
      rigidBodyCount: this.bodies.length,
      activeBodyCount: this.bodies.length - sleepingBodyCount,
      sleepingBodyCount,
    };
  }

  private createWorld(): void {
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.bodies.length = 0;
    const ground = RAPIER.ColliderDesc.cuboid(5000, 0.1, 5000).setTranslation(0, -0.1, 0);
    this.world.createCollider(ground);
  }
}
