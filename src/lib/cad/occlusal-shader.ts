/**
 * DCOS 2.0 / Next-Gen Reactive PMS — Phase 4 Occlusal Clearance Shader
 * Evaluates prep-to-antagonist distance and renders real-time clinical clearance heatmaps.
 */

export interface ClearanceColorStop {
  minDistanceMm: number;
  maxDistanceMm: number;
  colorHex: string; // e.g. '#22c55e' (Green), '#eab308' (Yellow), '#ef4444' (Red)
  label: string;
}

export const OCCLUSAL_CLEARANCE_PRESETS: ClearanceColorStop[] = [
  { minDistanceMm: 1.5, maxDistanceMm: 3.0, colorHex: '#22c55e', label: 'Adequate (>1.5mm)' },
  { minDistanceMm: 1.0, maxDistanceMm: 1.5, colorHex: '#eab308', label: 'Minimal (1.0 - 1.5mm)' },
  { minDistanceMm: 0.0, maxDistanceMm: 1.0, colorHex: '#ef4444', label: 'Insufficient (<1.0mm)' },
];

export class OcclusalClearanceCalculator {
  /**
   * Computes vertical clearance distance (in mm) between upper prep vertex and antagonist arch.
   */
  public static calculatePointDistance(
    prepZ: number,
    antagonistZ: number,
    scaleFactor = 1.0
  ): number {
    const raw = Math.max(0, (antagonistZ - prepZ) * scaleFactor);
    return Number(raw.toFixed(2));
  }

  /**
   * Evaluates color code for a specific clearance measurement.
   */
  public static getClearanceColor(distanceMm: number): { color: string; status: 'ADEQUATE' | 'MINIMAL' | 'INSUFFICIENT' } {
    if (distanceMm >= 1.5) {
      return { color: '#22c55e', status: 'ADEQUATE' };
    }
    if (distanceMm >= 1.0) {
      return { color: '#eab308', status: 'MINIMAL' };
    }
    return { color: '#ef4444', status: 'INSUFFICIENT' };
  }

  /**
   * Generates custom GLSL vertex and fragment shader code for Three.js ShaderMaterial.
   */
  public static getGLSLShader() {
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vPosition = position;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uMinClearance;
      uniform float uMaxClearance;
      uniform float uAntagonistHeight;
      varying vec3 vPosition;

      void main() {
        float dist = max(0.0, uAntagonistHeight - vPosition.z);
        vec3 color;

        if (dist >= 1.5) {
          color = vec3(0.13, 0.77, 0.36); // Green
        } else if (dist >= 1.0) {
          color = vec3(0.91, 0.70, 0.03); // Yellow
        } else {
          color = vec3(0.93, 0.27, 0.27); // Red (<1.0mm)
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    return { vertexShader, fragmentShader };
  }
}
