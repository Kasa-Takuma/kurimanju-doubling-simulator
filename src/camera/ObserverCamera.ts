import { Euler, PerspectiveCamera, Vector2, Vector3 } from 'three';
import { clamp } from '../utils/math';

interface PointerState {
  x: number;
  y: number;
  button: number;
  pointerType: string;
}

export class ObserverCamera {
  readonly camera = new PerspectiveCamera(55, 1, 0.05, 1200);
  readonly globalPosition = new Vector3(0, 4.5, 12);
  private readonly pointers = new Map<number, PointerState>();
  private readonly previousGestureCenter = new Vector2();
  private previousGestureDistance = 0;
  private yaw = 0;
  private pitch = -0.16;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.camera.position.copy(this.globalPosition);
    this.applyRotation();
  }

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  detach(): void {
    if (!this.canvas) {
      return;
    }
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas = null;
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  reset(): void {
    this.globalPosition.set(0, 4.5, 12);
    this.camera.position.copy(this.globalPosition);
    this.yaw = 0;
    this.pitch = -0.16;
    this.applyRotation();
  }

  update(): void {
    this.camera.position.y = Math.max(0.35, this.camera.position.y);
    this.globalPosition.copy(this.camera.position);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      pointerType: event.pointerType,
    });
    this.canvas?.setPointerCapture(event.pointerId);
    if (this.pointers.size === 2) {
      this.captureGesture();
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) {
      return;
    }
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;

    if (this.pointers.size >= 2) {
      this.applyTwoFingerGesture();
      return;
    }

    if (pointer.pointerType === 'touch' || pointer.button === 0) {
      this.yaw -= dx * 0.004;
      this.pitch = clamp(this.pitch - dy * 0.004, -1.45, 1.45);
      this.applyRotation();
    } else if (pointer.button === 2) {
      this.pan(dx, dy);
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size === 1) {
      this.captureGesture();
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.camera.translateZ(event.deltaY * 0.018);
    this.update();
  };

  private captureGesture(): void {
    const values = [...this.pointers.values()];
    if (values.length < 2) {
      return;
    }
    this.previousGestureCenter.set((values[0].x + values[1].x) / 2, (values[0].y + values[1].y) / 2);
    this.previousGestureDistance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
  }

  private applyTwoFingerGesture(): void {
    const values = [...this.pointers.values()];
    if (values.length < 2) {
      return;
    }
    const center = new Vector2((values[0].x + values[1].x) / 2, (values[0].y + values[1].y) / 2);
    const distance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
    this.pan(center.x - this.previousGestureCenter.x, center.y - this.previousGestureCenter.y);
    this.camera.translateZ((this.previousGestureDistance - distance) * 0.012);
    this.previousGestureCenter.copy(center);
    this.previousGestureDistance = distance;
    this.update();
  }

  private pan(dx: number, dy: number): void {
    this.camera.translateX(-dx * 0.018);
    this.camera.translateY(dy * 0.018);
    this.update();
  }

  private applyRotation(): void {
    this.camera.rotation.copy(new Euler(this.pitch, this.yaw, 0, 'YXZ'));
  }
}
