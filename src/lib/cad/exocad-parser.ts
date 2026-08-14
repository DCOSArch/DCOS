/**
 * DCOS 2.0 / Next-Gen Reactive PMS — Phase 4 Exocad / 3Shape Project Parser
 * Extracts CAD/CAM restoration parameters, margin lines, and material indices from .constructionInfo XML.
 */

export interface ExocadToothRestoration {
  toothFdi: number;
  restorationType: 'ANATOMIC_CROWN' | 'INLAY' | 'ONLAY' | 'VENEER' | 'PONTIC' | 'ABUTMENT' | 'COPING';
  material: string; // e.g. "Zirconia (High Translucency)", "IPS e.max CAD"
  shade?: string; // e.g. "A2"
  cementGapUm: number; // e.g. 50 microns
  marginGapUm: number; // e.g. 10 microns
  marginPointsCount: number;
}

export interface ExocadProjectMetadata {
  projectId: string;
  dentistName: string;
  patientName: string;
  technicianName: string;
  createdAt: string;
  restorations: ExocadToothRestoration[];
  isBridge: boolean;
  bridgeSpan?: number[];
  antagonistDistanceMm?: number;
}

export class ExocadProjectParser {
  /**
   * Parses raw .constructionInfo XML string into structured ExocadProjectMetadata.
   */
  public static parseConstructionInfo(xmlString: string): ExocadProjectMetadata {
    // Regex-based robust XML extractor (browser and server compatible)
    const projectIdMatch = xmlString.match(/<ProjectID>(.*?)<\/ProjectID>/i);
    const dentistMatch = xmlString.match(/<Dentist>(.*?)<\/Dentist>/i);
    const patientMatch = xmlString.match(/<Patient>(.*?)<\/Patient>/i);
    const technicianMatch = xmlString.match(/<Technician>(.*?)<\/Technician>/i);
    const dateMatch = xmlString.match(/<Date>(.*?)<\/Date>/i);

    const restorations: ExocadToothRestoration[] = [];
    const toothBlocks = xmlString.match(/<ToothElement[\s\S]*?<\/ToothElement>/gi) || [];

    for (const block of toothBlocks) {
      const numMatch = block.match(/<ToothNumber>(\d+)<\/ToothNumber>/i);
      const typeMatch = block.match(/<Type>(.*?)<\/Type>/i);
      const materialMatch = block.match(/<Material>(.*?)<\/Material>/i);
      const shadeMatch = block.match(/<Shade>(.*?)<\/Shade>/i);
      const cementMatch = block.match(/<CementGap>(\d+)<\/CementGap>/i);
      const marginMatch = block.match(/<MarginGap>(\d+)<\/MarginGap>/i);
      const marginPointsMatch = block.match(/<MarginPointsCount>(\d+)<\/MarginPointsCount>/i);

      if (numMatch) {
        const toothFdi = parseInt(numMatch[1], 10);
        const rawType = (typeMatch?.[1] || 'Crown').toUpperCase();
        let resType: ExocadToothRestoration['restorationType'] = 'ANATOMIC_CROWN';

        if (rawType.includes('PONTIC')) resType = 'PONTIC';
        else if (rawType.includes('INLAY')) resType = 'INLAY';
        else if (rawType.includes('ONLAY')) resType = 'ONLAY';
        else if (rawType.includes('VENEER')) resType = 'VENEER';
        else if (rawType.includes('ABUTMENT')) resType = 'ABUTMENT';

        restorations.push({
          toothFdi,
          restorationType: resType,
          material: materialMatch?.[1] || 'Zirconia HT',
          shade: shadeMatch?.[1] || 'VITA A2',
          cementGapUm: cementMatch ? parseInt(cementMatch[1], 10) : 50,
          marginGapUm: marginMatch ? parseInt(marginMatch[1], 10) : 10,
          marginPointsCount: marginPointsMatch ? parseInt(marginPointsMatch[1], 10) : 128,
        });
      }
    }

    const isBridge = restorations.length > 1;
    const bridgeSpan = isBridge ? restorations.map((r) => r.toothFdi).sort() : undefined;

    return {
      projectId: projectIdMatch?.[1] || `EXO-${Date.now()}`,
      dentistName: dentistMatch?.[1] || 'Primary Dentist',
      patientName: patientMatch?.[1] || 'Clinical Patient',
      technicianName: technicianMatch?.[1] || 'Advance Dental CAD Lab',
      createdAt: dateMatch?.[1] || new Date().toISOString(),
      restorations,
      isBridge,
      bridgeSpan,
      antagonistDistanceMm: 1.8,
    };
  }
}
