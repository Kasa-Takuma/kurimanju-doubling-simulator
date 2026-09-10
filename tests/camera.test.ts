import { describe, expect, it } from 'vitest';
import {
  CAMERA_NEAR_CLIP,
  CAMERA_PAN_PER_PIXEL,
  CAMERA_PINCH_PER_PIXEL,
  CAMERA_ZOOM_PER_WHEEL_DELTA,
} from '../src/camera/ObserverCamera';
import { KURIMANJU_MODEL_LENGTH_M } from '../src/kurimanju/KurimanjuLOD';

describe('observer camera scale', () => {
  it('uses the measured Kurimanju size for close viewing and controls', () => {
    expect(CAMERA_NEAR_CLIP).toBeCloseTo(0.005);
    expect(CAMERA_ZOOM_PER_WHEEL_DELTA).toBeCloseTo(KURIMANJU_MODEL_LENGTH_M * 0.1);
    expect(CAMERA_PAN_PER_PIXEL).toBeCloseTo(KURIMANJU_MODEL_LENGTH_M * 0.02);
    expect(CAMERA_PINCH_PER_PIXEL).toBe(CAMERA_PAN_PER_PIXEL);
  });
});
