// Client-side STL parsing utility for Automated Pre-Flight Scan Validation
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  dimensions?: {
    x: number;
    y: number;
    z: number;
  };
}

/**
 * Parses an STL file locally in the browser to validate geometric bounds.
 * Prevents massive, unscalable, or empty files from being uploaded.
 */
export async function validateSTLFile(file: File): Promise<ValidationResult> {
  return new Promise((resolve, reject) => {
    const warnings: string[] = [];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const contents = event.target?.result;
        if (!contents) {
          throw new Error('File is empty');
        }

        const loader = new STLLoader();
        // The loader parses the ArrayBuffer into a BufferGeometry
        const geometry = loader.parse(contents as ArrayBuffer);

        if (!geometry || !geometry.attributes.position || geometry.attributes.position.count === 0) {
          resolve({
            isValid: false,
            warnings: ['The STL file appears to be empty or corrupted (no geometry found).'],
          });
          return;
        }

        // Compute bounding box
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;

        if (!bbox) {
          resolve({ isValid: false, warnings: ['Could not compute bounding box.'] });
          return;
        }

        const sizeX = bbox.max.x - bbox.min.x;
        const sizeY = bbox.max.y - bbox.min.y;
        const sizeZ = bbox.max.z - bbox.min.z;

        const dimensions = { x: sizeX, y: sizeY, z: sizeZ };

        // Basic heuristic checks (Assuming units are typically millimeters)
        // Check for impossibly small models (e.g., less than 1mm in all directions)
        if (sizeX < 1 && sizeY < 1 && sizeZ < 1) {
          warnings.push('Model dimensions are critically small (<1mm). Did you export with incorrect units?');
        }

        // Check for impossibly large models (e.g., greater than 200mm/20cm across for a typical dental arch)
        if (sizeX > 200 || sizeY > 200 || sizeZ > 200) {
          warnings.push('Model dimensions are unusually large (>20cm). Please verify scale before submitting.');
        }

        // Specific heuristic: Thin margins/occlusal clearance check
        // (A true clearance check requires antagonist mesh, but we can flag very thin single objects)
        const minDimension = Math.min(sizeX, sizeY, sizeZ);
        if (minDimension < 1.0) {
          warnings.push('Warning: Very thin geometry detected (<1mm). This may result in a fragile restoration or milling failure.');
        }

        resolve({
          isValid: warnings.length === 0,
          warnings,
          dimensions,
        });

      } catch (err) {
        console.error('Error parsing STL:', err);
        resolve({
          isValid: false,
          warnings: ['Failed to parse the STL file. Ensure it is a valid binary or ASCII STL.'],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        isValid: false,
        warnings: ['Failed to read the file from the local filesystem.'],
      });
    };

    // Read as ArrayBuffer for the STLLoader
    reader.readAsArrayBuffer(file);
  });
}
