/**
 * DCOS 2.0 / Next-Gen Reactive PMS — Phase 4 Margin Geometry Utilities
 * 3D Spline Curve Interpolation for Subgingival Preparation Finish Lines
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export class MarginGeometry {
  /**
   * Evaluates a Catmull-Rom closed spline through an array of 3D control points.
   */
  public static interpolateClosedSpline(controlPoints: Point3D[], segmentsPerSpan = 8): Point3D[] {
    if (controlPoints.length < 3) return controlPoints;

    const interpolated: Point3D[] = [];
    const n = controlPoints.length;

    for (let i = 0; i < n; i++) {
      const p0 = controlPoints[(i - 1 + n) % n];
      const p1 = controlPoints[i];
      const p2 = controlPoints[(i + 1) % n];
      const p3 = controlPoints[(i + 2) % n];

      for (let s = 0; s < segmentsPerSpan; s++) {
        const t = s / segmentsPerSpan;
        const pt = this.catmullRomPoint(p0, p1, p2, p3, t);
        interpolated.push(pt);
      }
    }

    return interpolated;
  }

  /**
   * Catmull-Rom point formula: 0.5 * ((2*P1) + (-P0 + P2)*t + (2*P0 - 5*P1 + 4*P2 - P3)*t^2 + (-P0 + 3*P1 - 3*P2 + P3)*t^3)
   */
  private static catmullRomPoint(p0: Point3D, p1: Point3D, p2: Point3D, p3: Point3D, t: number): Point3D {
    const t2 = t * t;
    const t3 = t2 * t;

    const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
    const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
    const z = 0.5 * (2 * p1.z + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3);

    return { x, y, z };
  }

  /**
   * Calculates total 3D perimeter length of a preparation finish line in millimeters.
   */
  public static calculatePerimeterMm(points: Point3D[]): number {
    let length = 0;
    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length];
      const dx = next.x - points[i].x;
      const dy = next.y - points[i].y;
      const dz = next.z - points[i].z;
      length += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return Number(length.toFixed(2));
  }
}
