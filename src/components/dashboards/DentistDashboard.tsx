'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import SummaryChart from '@/components/SummaryChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Activity, CheckCircle2, UploadCloud, FileBox, Filter, FileText, Box, Building2, ChevronRight, ChevronLeft, Camera } from 'lucide-react';
import { Case, User, DoctorInventoryItem } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { validateSTLFile } from '@/lib/utils/stlValidator';

const VITA_SHADES: { code: string; hex: string; group: string }[] = [
  { code: 'A1', hex: '#f4ebe1', group: 'A' },
  { code: 'A2', hex: '#ebdccb', group: 'A' },
  { code: 'A3', hex: '#e3ceb5', group: 'A' },
  { code: 'A3.5', hex: '#d8bf9f', group: 'A' },
  { code: 'A4', hex: '#cca782', group: 'A' },
  { code: 'B1', hex: '#f4ecd8', group: 'B' },
  { code: 'B2', hex: '#eadbb9', group: 'B' },
  { code: 'B3', hex: '#e1ca9e', group: 'B' },
  { code: 'B4', hex: '#d4b882', group: 'B' },
  { code: 'C1', hex: '#ebdcd4', group: 'C' },
  { code: 'C2', hex: '#dfc7bd', group: 'C' },
  { code: 'C3', hex: '#d4b8aa', group: 'C' },
  { code: 'C4', hex: '#c09e8f', group: 'C' },
  { code: 'D2', hex: '#e2cfbd', group: 'D' },
  { code: 'D3', hex: '#d4b79f', group: 'D' },
  { code: 'D4', hex: '#cca487', group: 'D' },
];

const SHADE_HEX_MAP: Record<string, string> = VITA_SHADES.reduce((acc, s) => {
  acc[s.code] = s.hex;
  return acc;
}, {} as Record<string, string>);

const MATERIALS = [
  { value: 'Zirconia HT', label: 'Zirconia HT (High Translucency)' },
  { value: 'BruxZir Solid Zirconia', label: 'BruxZir Solid Zirconia' },
  { value: 'IPS e.max CAD', label: 'IPS e.max CAD (Lithium Disilicate)' },
  { value: 'PMMA Temporary', label: 'PMMA Temporary' },
  { value: 'Titanium Abutment', label: 'Titanium Custom Abutment' },
];

const TOOTH_STATUS_CYCLE: Record<string, 'single' | 'abutment' | 'pontic' | 'implant' | 'none'> = {
  'none': 'single',
  'single': 'abutment',
  'abutment': 'pontic',
  'pontic': 'implant',
  'implant': 'none'
};

const TOOTH_STATUS_LABELS: Record<string, string> = {
  'none': 'None',
  'single': 'Single Crown',
  'abutment': 'Bridge Abutment',
  'pontic': 'Bridge Pontic',
  'implant': 'Implant'
};

interface DentistDashboardProps {
  initialCases: Case[];
  currentUser: User;
  availableLabs: { id: string; name: string }[];
}

export default function DentistDashboard({ initialCases, currentUser, availableLabs }: DentistDashboardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [cases, setCases] = useState<Case[]>(initialCases);

  // Sync initialCases with cases when router.refresh() happens
  useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [uploadState, setUploadState] = useState<'idle' | 'analyzing' | 'warning'>('idle');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [validationDimensions, setValidationDimensions] = useState<{ x: number; y: number; z: number } | null>(null);

  const [patientName, setPatientName] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [urgency, setUrgency] = useState<Case['urgency']>('NORMAL');
  const [selectedLabId, setSelectedLabId] = useState<string>(availableLabs.length > 0 ? availableLabs[0].id : '');
  const [dueDate, setDueDate] = useState<string>('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDicomFile, setSelectedDicomFile] = useState<File | null>(null);
  const dicomInputRef = useRef<HTMLInputElement>(null);
  const shadePhotoInputRef = useRef<HTMLInputElement>(null);

  const [inventory, setInventory] = useState<DoctorInventoryItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Patient Demographics & Implant states (Phase 1)
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [implantBrand, setImplantBrand] = useState('');
  const [scanBodyModel, setScanBodyModel] = useState('');
  const [analogLogistics, setAnalogLogistics] = useState('');

  // 5-Tab Pipeline State
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [isTeethNotSpecified, setIsTeethNotSpecified] = useState(false);
  const [material, setMaterial] = useState('Zirconia HT');
  const [shade, setShade] = useState('A2');
  const [isDesignNotSpecified, setIsDesignNotSpecified] = useState(false);
  const [instructions, setInstructions] = useState('');

  // Phase 2 states - Custom Shading
  const [customShadeEnabled, setCustomShadeEnabled] = useState(false);
  const [cervicalShade, setCervicalShade] = useState('A2');
  const [bodyShade, setBodyShade] = useState('A2');
  const [incisalShade, setIncisalShade] = useState('A2');
  const [characterizations, setCharacterizations] = useState<string[]>([]);
  const [shadePhotoFile, setShadePhotoFile] = useState<File | null>(null);
  const [activeZone, setActiveZone] = useState<'cervical' | 'body' | 'incisal' | null>(null);

  // Phase 2 states - Carousel
  const [carouselPanel, setCarouselPanel] = useState<'material' | 'shade'>('material');

  // Phase 3 states - Tooth Configurations
  const [toothConfigs, setToothConfigs] = useState<Record<number, 'single' | 'abutment' | 'pontic' | 'implant' | 'none'>>({});
  const [occlusalClearance, setOcclusalClearance] = useState('Medium');
  const [contactDesign, setContactDesign] = useState('Normal');
  const [connectorDesign, setConnectorDesign] = useState('Anatomical');
  const [ponticDesign, setPonticDesign] = useState('Ovate');

  const steps = [
    { label: 'Admin', desc: 'Patient Info' },
    { label: 'Scan', desc: '3D Files' },
    { label: 'Model', desc: 'Teeth Chart' },
    { label: 'CAD', desc: 'Materials' },
    { label: 'CAM', desc: 'Due Date' }
  ];

  const isStepComplete = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Administration
        const isBasicComplete =
          patientName.trim().length > 0 &&
          selectedLabId !== '' &&
          treatmentType.trim().length > 0 &&
          patientAge.trim().length > 0 &&
          !isNaN(Number(patientAge)) &&
          Number(patientAge) > 0 &&
          patientGender !== '';

        if (treatmentType === 'Implant Abutment') {
          return isBasicComplete && implantBrand !== '' && scanBodyModel !== '' && analogLogistics !== '';
        }
        return isBasicComplete;
      case 1: // Acquisition
        if (treatmentType === 'Surgical Guide') {
          return selectedFile !== null && selectedDicomFile !== null && uploadState !== 'analyzing';
        }
        return selectedFile !== null && uploadState !== 'analyzing';
      case 2: // Model Mapping
        return Object.values(toothConfigs).some(v => v !== 'none') || isTeethNotSpecified;
      case 3: // CAD Design
        return isDesignNotSpecified || (material !== '' && shade !== '');
      case 4: // CAM Manufacturing
        return dueDate !== '';
      default:
        return false;
    }
  };

  // Sync selectedTeeth from toothConfigs for payload compatibility
  useEffect(() => {
    setSelectedTeeth(Object.keys(toothConfigs).map(Number).sort((a, b) => a - b));
  }, [toothConfigs]);

  const cycleToothStatus = (toothNumber: number) => {
    const current = toothConfigs[toothNumber] || 'none';
    const nextStatus = TOOTH_STATUS_CYCLE[current] || 'single';
    setToothConfigs(prev => {
      const updated = { ...prev };
      if (nextStatus === 'none') {
        delete updated[toothNumber];
      } else {
        updated[toothNumber] = nextStatus;
      }
      return updated;
    });
  };

  const renderToothButton = (toothNumber: number) => {
    const status = toothConfigs[toothNumber] || 'none';
    const statusStyles: Record<string, string> = {
      'none': 'border-border text-foreground hover:bg-muted bg-background',
      'single': 'bg-red-500 border-red-600 text-white',
      'abutment': 'bg-blue-800 border-blue-900 text-white',
      'pontic': 'bg-blue-300 border-blue-400 text-slate-900',
      'implant': 'bg-zinc-600 border-zinc-700 text-white'
    };
    return (
      <button
        key={toothNumber}
        type="button"
        disabled={isTeethNotSpecified}
        onClick={() => cycleToothStatus(toothNumber)}
        className={`relative w-7 h-7 text-[10px] font-bold rounded flex items-center justify-center border transition-all ${statusStyles[status]
          } ${isTeethNotSpecified ? 'opacity-40 cursor-not-allowed' : ''}`}
        title={`Tooth ${toothNumber}: ${TOOTH_STATUS_LABELS[status]}`}
      >
        {toothNumber}
        {status === 'implant' && (
          <span className="absolute w-2 h-2 rounded-full bg-zinc-950 border border-zinc-700" />
        )}
      </button>
    );
  };

  const renderQuadrantRow = (teeth: number[]) => {
    return teeth.map((toothNumber, idx) => {
      const status = toothConfigs[toothNumber] || 'none';
      const isBridge = status === 'abutment' || status === 'pontic';
      const nextTooth = teeth[idx + 1];
      const nextStatus = nextTooth ? (toothConfigs[nextTooth] || 'none') : 'none';
      const nextIsBridge = nextStatus === 'abutment' || nextStatus === 'pontic';
      const showBridgeLine = isBridge && nextIsBridge;

      return (
        <React.Fragment key={toothNumber}>
          {renderToothButton(toothNumber)}
          {showBridgeLine && idx < teeth.length - 1 && (
            <div className="w-3 h-1 bg-blue-600 self-center shrink-0" />
          )}
        </React.Fragment>
      );
    });
  };

  const renderShadeGrid = (onSelect: (shade: string) => void, selectedShade?: string) => {
    const groups = ['A', 'B', 'C', 'D'];
    return (
      <div className="space-y-2">
        {groups.map(group => (
          <div key={group} className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground w-4">{group}</span>
            <div className="flex gap-1.5">
              {VITA_SHADES.filter(s => s.group === group).map(shadeItem => (
                <button
                  key={shadeItem.code}
                  type="button"
                  onClick={() => onSelect(shadeItem.code)}
                  className={`w-8 h-8 rounded text-[8px] font-bold flex items-center justify-center border transition-all ${selectedShade === shadeItem.code
                    ? 'border-2 border-blue-600 shadow-md scale-105'
                    : 'border border-border hover:scale-105'
                    }`}
                  style={{ backgroundColor: shadeItem.hex }}
                  title={shadeItem.code}
                >
                  <span className="text-zinc-700">{shadeItem.code}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Inventory
      const { data: invData } = await supabase
        .from('doctor_inventory')
        .select('*')
        .eq('dentist_id', currentUser.id);

      if (invData) {
        setInventory(invData.map((item: any) => ({
          id: item.id,
          dentistId: item.dentist_id,
          labId: item.lab_id,
          materialName: item.material_name,
          totalUnits: item.total_units,
          remainingUnits: item.remaining_units,
          lockedPrice: item.locked_price
        })));
      }
    };

    const fetchNotifications = async () => {
      const { data: timelineData, error } = await supabase
        .from('timeline_events')
        .select(`
          id,
          status_update,
          notes,
          timestamp,
          case_id,
          cases!inner(patient_name, dentist_id)
        `)
        .eq('cases.dentist_id', currentUser.id)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (timelineData) {
        setNotifications(timelineData.map((n: any) => ({
          id: n.id,
          statusUpdate: n.status_update,
          notes: n.notes,
          timestamp: n.timestamp,
          caseId: n.case_id,
          patientName: n.cases.patient_name
        })));
      }
    };

    fetchData();
    fetchNotifications();

    // Subscribe to cases
    const channel = supabase.channel('dentist_cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `dentist_id=eq.${currentUser.id}` }, payload => {
        const eventType = payload.eventType;
        const newCase = payload.new as any;

        if (eventType === 'UPDATE') {
          toast.info(`Case updated: ${newCase.patient_name}'s status is now ${newCase.status}`);
          setCases(prev => prev.map(c => c.id === newCase.id ? {
            ...c,
            status: newCase.status,
            urgency: newCase.urgency,
            requestedTreatment: newCase.requested_treatment,
            material: newCase.material,
            scanUrl: newCase.scan_url,
            deliveryTrackingId: newCase.delivery_tracking_id
          } : c));
          fetchData();
          fetchNotifications();
        }

        router.refresh();
      })
      .subscribe();

    // Subscribe to timeline events
    const timelineChannel = supabase.channel('dentist_timeline')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'timeline_events', filter: `dentist_id=eq.${currentUser.id}` }, payload => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(timelineChannel);
    };
  }, [currentUser.id, router, supabase]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Auto-fill patient name if not yet entered
      const baseName = file.name.replace(/\.(stl|ply)$/i, '');
      let nameGuess = baseName
        .replace(/(upper|lower|bite|arch|scan|prep|mesh)/gi, '') // remove common keywords
        .replace(/[^a-zA-Z\s]/g, ' ') // replace non-alphabetic chars with spaces
        .replace(/\s+/g, ' ') // collapse multiple spaces
        .trim();

      if (nameGuess) {
        nameGuess = nameGuess.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (!patientName) {
          setPatientName(nameGuess);
          toast.success(`Auto-filled Patient Name: "${nameGuess}"`);
        }
      }

      // Detect arch type
      let archGuess = '';
      if (/upper/i.test(baseName)) archGuess = 'Upper Arch';
      else if (/lower/i.test(baseName)) archGuess = 'Lower Arch';
      else if (/bite/i.test(baseName)) archGuess = 'Bite Registry';

      if (archGuess) {
        toast.info(`Detected scan: ${archGuess}`);
      }

      // Pre-flight validation
      setUploadState('analyzing');
      try {
        const result = await validateSTLFile(file);
        if (!result.isValid) {
          setUploadState('warning');
          setValidationWarnings(result.warnings);
        } else if (result.warnings.length > 0) {
          setUploadState('warning');
          setValidationWarnings(result.warnings);
        } else {
          setUploadState('idle');
          setValidationWarnings([]);
        }
        if (result.dimensions) {
          setValidationDimensions(result.dimensions);
        }
      } catch (err) {
        console.error('STL validation error:', err);
        setUploadState('idle');
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDicomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedDicomFile(e.target.files[0]);
      toast.success(`DICOM Scan attached: "${e.target.files[0].name}"`);
    }
  };

  const handleDicomUploadClick = () => {
    dicomInputRef.current?.click();
  };

  const handleShadePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setShadePhotoFile(e.target.files[0]);
      toast.success(`Shade reference photo attached: "${e.target.files[0].name}"`);
    }
  };

  const handleShadePhotoClick = () => {
    shadePhotoInputRef.current?.click();
  };

  const handleSubmitCase = async (isDraft: boolean = false) => {
    if (!patientName.trim() || !selectedFile || !selectedLabId) {
      alert('Please fill out patient name, select a lab, and select a scan file.');
      return;
    }

    if (treatmentType === 'Surgical Guide' && !selectedDicomFile) {
      alert('Please upload a DICOM / CBCT scan file for surgical guide fabrication.');
      return;
    }

    setUploadState('analyzing');

    try {
      // 1. Upload to Supabase Storage
      let scanUrl = null;
      if (selectedFile) {
        const fileName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const { data, error } = await supabase.storage
          .from('scans')
          .upload(fileName, selectedFile);

        if (error) {
          console.error('Storage upload error (ignoring and proceeding):', error);
          alert('Warning: File upload failed (e.g. storage bucket issue). The case will still be created without the file.');
        } else {
          scanUrl = data.path;
        }
      }

      // 1b. Upload DICOM file
      let dicomUrl = null;
      if (selectedDicomFile) {
        const dicomFileName = `dicom/${Date.now()}_${selectedDicomFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const { data, error } = await supabase.storage
          .from('scans')
          .upload(dicomFileName, selectedDicomFile);

        if (error) {
          console.error('DICOM Storage upload error:', error);
          alert('Warning: DICOM file upload failed.');
        } else {
          dicomUrl = data.path;
        }
      }

      // 1c. Upload shade reference photo
      let shadePhotoUrl = null;
      if (shadePhotoFile) {
        const shadePhotoFileName = `shade_photos/${Date.now()}_${shadePhotoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data: shadeData, error: shadeError } = await supabase.storage
          .from('scans')
          .upload(shadePhotoFileName, shadePhotoFile);
        if (shadeError) {
          console.error('Shade photo upload error:', shadeError);
        } else {
          shadePhotoUrl = shadeData.path;
        }
      }

      // Serialize Phase 2 & 3 design parameters into instructions
      const designParams: Record<string, any> = {
        occlusalClearance,
        contactDesign,
        connectorDesign,
        ponticDesign,
      };
      if (Object.keys(toothConfigs).length > 0) {
        designParams.toothConfigs = Object.fromEntries(
          Object.entries(toothConfigs).map(([k, v]) => [k, v])
        );
      }
      if (customShadeEnabled) {
        designParams.customShade = {
          enabled: true,
          cervical: cervicalShade,
          body: bodyShade,
          incisal: incisalShade,
        };
      }
      if (characterizations.length > 0) {
        designParams.characterizations = characterizations;
      }
      if (shadePhotoUrl) {
        designParams.shadePhotoUrl = shadePhotoUrl;
      }
      const designParamsJson = JSON.stringify(designParams, null, 2);
      const enhancedInstructions = instructions
        ? `${instructions}\n\n[Design Parameters]: ${designParamsJson}`
        : `[Design Parameters]: ${designParamsJson}`;

      // 2. Insert the case into the Supabase 'cases' table
      const dbCase = {
        patient_name: patientName,
        dentist_id: currentUser.id,
        lab_id: selectedLabId,
        status: isDraft ? 'DRAFT' : 'PENDING',
        urgency,
        requested_treatment: treatmentType || 'Not Specified',
        material: isDesignNotSpecified ? 'Not Specified' : material,
        scan_url: scanUrl, // Store the file path
        dicom_url: dicomUrl, // Store the DICOM path
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        shade: isDesignNotSpecified ? 'Not Specified' : shade,
        selected_teeth: isTeethNotSpecified ? null : selectedTeeth,
        instructions: enhancedInstructions || null,
        patient_age: patientAge ? parseInt(patientAge, 10) : null,
        patient_gender: patientGender || null,
        implant_brand: treatmentType === 'Implant Abutment' ? implantBrand : null,
        scan_body_model: treatmentType === 'Implant Abutment' ? scanBodyModel : null,
        analog_logistics: treatmentType === 'Implant Abutment' ? analogLogistics : null
      };

      const { data: insertedCase, error: insertError } = await supabase
        .from('cases')
        .insert([dbCase])
        .select()
        .single();

      if (insertError) {
        console.error('DB Insert Error:', insertError);
        alert('Error inserting case: ' + insertError.message);
      } else if (insertedCase) {
        // Create initial timeline event
        await supabase.from('timeline_events').insert({
          case_id: insertedCase.id,
          status_update: isDraft ? 'Draft Saved' : 'Case Created',
          notes: isDraft ? 'Dentist saved case as draft.' : 'Dentist submitted new case.',
          visibility: 'BOTH'
        });

        // Refetch inventory to reflect deduction (only if not a draft)
        if (!isDraft) {
          const { data: invData } = await supabase
            .from('doctor_inventory')
            .select('*')
            .eq('dentist_id', currentUser.id);

          if (invData) {
            setInventory(invData.map((item: any) => ({
              id: item.id,
              dentistId: item.dentist_id,
              labId: item.lab_id,
              materialName: item.material_name,
              totalUnits: item.total_units,
              remainingUnits: item.remaining_units,
              lockedPrice: item.locked_price
            })));
          }
        }
      }

      const newCase: Case = {
        id: insertedCase ? insertedCase.id : `case-${Date.now().toString().slice(-4)}`,
        patientName,
        dentistId: currentUser.id,
        labId: selectedLabId,
        status: isDraft ? 'DRAFT' : 'PENDING',
        urgency,
        requestedTreatment: dbCase.requested_treatment,
        material: dbCase.material,
        createdAt: new Date().toISOString(),
        dueDate: dbCase.due_date,
        shade: dbCase.shade,
        selectedTeeth: isTeethNotSpecified ? undefined : selectedTeeth,
        instructions: enhancedInstructions || undefined,
        dicomUrl: dicomUrl || undefined,
        patientAge: dbCase.patient_age || undefined,
        patientGender: (dbCase.patient_gender as any) || undefined,
        implantBrand: dbCase.implant_brand || undefined,
        scanBodyModel: dbCase.scan_body_model || undefined,
        analogLogistics: dbCase.analog_logistics || undefined
      };

      // Optimistic UI - Immediately show the new case
      setCases(prev => [newCase, ...prev]);

      router.refresh();
      setIsCreateModalOpen(false);

      // Reset form
      setPatientName('');
      setTreatmentType('');
      setUrgency('NORMAL');
      setDueDate('');
      setSelectedFile(null);
      setSelectedDicomFile(null);
      setUploadState('idle');
      setValidationWarnings([]);
      setValidationDimensions(null);
      setSelectedTeeth([]);
      setIsTeethNotSpecified(false);
      setMaterial('Zirconia HT');
      setShade('A2');
      setIsDesignNotSpecified(false);
      setInstructions('');
      setCurrentStep(0);
      // Reset Phase 2 states
      setCustomShadeEnabled(false);
      setCervicalShade('A2');
      setBodyShade('A2');
      setIncisalShade('A2');
      setCharacterizations([]);
      setShadePhotoFile(null);
      setActiveZone(null);
      setCarouselPanel('material');
      // Reset Phase 3 states
      setToothConfigs({});
      setOcclusalClearance('Medium');
      setContactDesign('Normal');
      setConnectorDesign('Anatomical');
      setPonticDesign('Ovate');

      toast.success(isDraft ? 'Case saved as draft!' : 'Case successfully submitted!');

    } catch (err) {
      console.error('Submission error:', err);
      setUploadState('idle');
    }
  };

  const activeCasesCount = cases.filter(c => c.status !== 'DELIVERED').length;
  const completedCasesCount = cases.filter(c => c.status === 'DELIVERED').length;

  const filteredCases = cases.filter(c => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dentist Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your patients' lab cases and track progress.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-stretch mb-6">
        <SummaryChart cases={cases} />
        <Card className="flex flex-col justify-center h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCasesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in production</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-center h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedCasesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Delivered this month</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950/40 dark:to-indigo-950/40 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 dark:text-blue-300">You have no cases requiring immediate attention. Great job!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Virtual Inventory (Takes 2 columns) */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2"><Box className="w-5 h-5 text-primary" /> Virtual Inventory (Bulk Orders)</CardTitle>
              <CardDescription>Track your pre-purchased materials with partner labs.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/inventory')}>
              Purchase More
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.length === 0 ? (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  <p>No active bulk inventory found.</p>
                  <p className="text-sm mt-1">Purchase materials from a lab partner to lock in pricing.</p>
                </div>
              ) : inventory.map(item => {
                const lab = availableLabs.find(l => l.id === item.labId);
                const percentage = (item.remainingUnits / item.totalUnits) * 100;
                return (
                  <div key={item.id} className="border border-border rounded-lg p-4 bg-muted/20 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-foreground">{item.materialName}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" /> {lab?.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs font-mono">{item.lockedPrice.replace('$', '₹')}/unit</Badge>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{item.remainingUnits} units left</span>
                        <span className="text-muted-foreground">of {item.totalUnits}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${percentage < 20 ? 'bg-red-500' : percentage < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Notification Center (Takes 1 column) */}
        <Card className="shadow-sm border-border flex flex-col h-full min-h-[220px]">
          <CardHeader className="pb-3 border-b border-border bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Production Tracking
            </CardTitle>
            <CardDescription className="text-xs">Real-time laboratory updates.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground py-8">
                <Activity className="h-8 w-8 text-muted-foreground/40 mb-2 animate-pulse" />
                <p>No recent status updates.</p>
                <p className="text-[10px] mt-0.5">Updates appear here when the lab advances your cases.</p>
              </div>
            ) : (
              <div className="space-y-4 pl-4 border-l border-border relative">
                {notifications.map((n) => (
                  <div key={n.id} className="relative group text-xs text-left">
                    <div className="absolute -left-[21px] top-1 bg-background rounded-full p-0.5 border border-background">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-foreground text-xs truncate max-w-[120px]">{n.patientName}</span>
                        <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal">{n.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Recent Case Submissions</CardTitle>
            <CardDescription>View and track your patients' restorations.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || 'ALL')}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="QUALITY_CHECK">QC Hold</SelectItem>
                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Case ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">{caseItem.id.slice(-8).toUpperCase()}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {caseItem.patientName}
                        {caseItem.patientGender === 'MALE' && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-[9px] px-1 py-0 h-4">M</Badge>
                        )}
                        {caseItem.patientGender === 'FEMALE' && (
                          <Badge className="bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-100 text-[9px] px-1 py-0 h-4">F</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{caseItem.requestedTreatment}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(caseItem.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <StatusBadge status={caseItem.status} />
                        {caseItem.urgency === 'URGENT' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/cases/${caseItem.id}`)}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      >
                        <FileBox className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) {
          setTimeout(() => {
            setUploadState('idle');
            setSelectedFile(null);
            setPatientName('');
            setTreatmentType('');
            setUrgency('NORMAL');
            setDueDate('');
            setValidationWarnings([]);
            setValidationDimensions(null);
            setSelectedTeeth([]);
            setIsTeethNotSpecified(false);
            setMaterial('Zirconia HT');
            setShade('A2');
            setIsDesignNotSpecified(false);
            setInstructions('');
            setPatientAge('');
            setPatientGender('');
            setImplantBrand('');
            setScanBodyModel('');
            setAnalogLogistics('');
            setCurrentStep(0);
            // Reset Phase 2 states
            setCustomShadeEnabled(false);
            setCervicalShade('A2');
            setBodyShade('A2');
            setIncisalShade('A2');
            setCharacterizations([]);
            setShadePhotoFile(null);
            setActiveZone(null);
            setCarouselPanel('material');
            // Reset Phase 3 states
            setToothConfigs({});
            setOcclusalClearance('Medium');
            setContactDesign('Normal');
            setConnectorDesign('Anatomical');
            setPonticDesign('Ovate');
          }, 300);
        }
      }}>
        <DialogTrigger render={<Button className="fixed bottom-6 right-6 md:bottom-10 md:right-10 h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 p-0 z-50 focus:outline-none" />}>
          <Plus className="h-6 w-6 text-white" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Lab Case</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Submit a new prescription to the dental laboratory using Sirona-style 5-Tab Pipeline.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Dot Indicators */}
          <div className="flex justify-between items-center my-4 border-b border-border pb-4">
            {steps.map((step, idx) => {
              const isCurrent = idx === currentStep;
              const isDone = idx < currentStep || isStepComplete(idx);
              const isSelectable = idx <= currentStep || (idx > 0 && isStepComplete(idx - 1));
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isSelectable}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex flex-col items-center gap-1 focus:outline-none transition-colors ${isCurrent ? 'text-primary' : isDone ? 'text-emerald-500' : 'text-muted-foreground'
                    } ${!isSelectable ? 'opacity-40 cursor-not-allowed' : 'hover:text-foreground'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-semibold ${isCurrent ? 'border-blue-600 bg-blue-600/10 text-blue-600' : isDone ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-muted-foreground/30'
                    }`}>
                    {idx + 1}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 py-2 min-h-[260px]">
            {/* Step 0: Administration */}
            {currentStep === 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid gap-2">
                  <Label htmlFor="patientName" className="text-foreground">Patient Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="patientName"
                    placeholder="e.g. John Doe"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="border-border text-foreground bg-background"
                  />
                  <p className="text-xs text-muted-foreground">Or upload a scan file in the next step to auto-extract the name.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="patientAge" className="text-foreground">Patient Age <span className="text-red-500">*</span></Label>
                    <Input
                      id="patientAge"
                      type="number"
                      placeholder="Age"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="border-border text-foreground bg-background"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="patientGender" className="text-foreground">Patient Gender <span className="text-red-500">*</span></Label>
                    <Select value={patientGender} onValueChange={(val) => setPatientGender((val as any) || '')}>
                      <SelectTrigger className="border-border text-foreground bg-background">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="treatmentType" className="text-foreground">Treatment Type <span className="text-red-500">*</span></Label>
                  <Select value={treatmentType} onValueChange={(val) => {
                    setTreatmentType(val || '');
                    if (val !== 'Implant Abutment') {
                      setImplantBrand('');
                      setScanBodyModel('');
                      setAnalogLogistics('');
                    }
                  }}>
                    <SelectTrigger className="border-border text-foreground bg-background">
                      <SelectValue placeholder="Select treatment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Crown">Single Crown</SelectItem>
                      <SelectItem value="Bridge">Bridge</SelectItem>
                      <SelectItem value="Implant Abutment">Implant Abutment</SelectItem>
                      <SelectItem value="Veneer">Veneer</SelectItem>
                      <SelectItem value="Surgical Guide">Surgical Guide (for guide fabrication)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {treatmentType === 'Implant Abutment' && (
                  <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/20 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Implant Workflow Configurations</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="implantBrand" className="text-xs">Implant Brand <span className="text-red-500">*</span></Label>
                        <Select value={implantBrand} onValueChange={(val) => setImplantBrand(val || '')}>
                          <SelectTrigger className="border-border text-foreground h-8 text-xs bg-background">
                            <SelectValue placeholder="Brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Osstem">Osstem</SelectItem>
                            <SelectItem value="Dentium">Dentium</SelectItem>
                            <SelectItem value="Nobel Biocare">Nobel Biocare</SelectItem>
                            <SelectItem value="Straumann">Straumann</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="scanBodyModel" className="text-xs">Scan Body Type <span className="text-red-500">*</span></Label>
                        <Select value={scanBodyModel} onValueChange={(val) => setScanBodyModel(val || '')}>
                          <SelectTrigger className="border-border text-foreground h-8 text-xs bg-background">
                            <SelectValue placeholder="Scan Body" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Short">Short</SelectItem>
                            <SelectItem value="Long">Long</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="analogLogistics" className="text-xs">Prosthetic Components Logistics <span className="text-red-500">*</span></Label>
                      <Select value={analogLogistics} onValueChange={(val) => setAnalogLogistics(val || '')}>
                        <SelectTrigger className="border-border text-foreground h-8 text-xs bg-background">
                          <SelectValue placeholder="Select who provides analogs/parts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Doctor Provided">Doctor Provided (Component sent to lab)</SelectItem>
                          <SelectItem value="Lab Provided">Lab Provided (Lab supplies component)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="lab" className="text-foreground">Assign to Laboratory <span className="text-red-500">*</span></Label>
                  <Select value={selectedLabId} onValueChange={(val) => setSelectedLabId(val || '')} disabled>
                    <SelectTrigger className="border-border text-foreground">
                      <SelectValue placeholder="Select a laboratory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLabs.map(lab => (
                        <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="urgency" className="text-foreground">Urgency <span className="text-red-500">*</span></Label>
                  <Select value={urgency} onValueChange={(val) => setUrgency((val as Case['urgency']) || 'NORMAL')}>
                    <SelectTrigger className="border-border text-foreground">
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 1: Acquisition (Scan upload & STL Validator) */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <Label className="text-foreground mb-2 block">Upload 3D Scan (STL/PLY) <span className="text-red-500">*</span></Label>
                  <input
                    type="file"
                    accept=".stl,.ply"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />

                  {uploadState === 'idle' && !selectedFile && (
                    <div
                      onClick={handleUploadClick}
                      className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-foreground">Drag & Drop STL/PLY Files Here</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse from your computer</p>
                    </div>
                  )}

                  {selectedFile && (
                    <div className="space-y-4">
                      <div
                        onClick={handleUploadClick}
                        className="border-2 border-blue-600/40 rounded-lg p-4 flex items-center gap-4 bg-blue-600/5 cursor-pointer hover:bg-blue-600/10 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                          </p>
                        </div>
                      </div>

                      {uploadState === 'analyzing' && (
                        <div className="border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/20">
                          <Activity className="h-8 w-8 text-blue-600 mb-2 animate-pulse" />
                          <p className="text-sm font-medium text-foreground">Analyzing STL geometry bounds...</p>
                          <div className="w-full max-w-xs bg-muted rounded-full h-1 mt-3 overflow-hidden">
                            <div className="bg-blue-600 h-1 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      )}

                      {uploadState === 'warning' && (
                        <div className="border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                            Pre-Flight Analysis Alerts
                          </h4>
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            {validationWarnings.map((warn, i) => (
                              <li key={i} className="text-xs text-amber-700 dark:text-amber-400">{warn}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationDimensions && (
                        <div className="border border-border rounded-lg p-3 bg-muted/20 text-xs flex justify-around text-foreground">
                          <div><span className="font-semibold">Width (X):</span> {validationDimensions.x.toFixed(1)} mm</div>
                          <div><span className="font-semibold">Length (Y):</span> {validationDimensions.y.toFixed(1)} mm</div>
                          <div><span className="font-semibold">Height (Z):</span> {validationDimensions.z.toFixed(1)} mm</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* DICOM Upload Section for Surgical Guides */}
                {treatmentType === 'Surgical Guide' && (
                  <div className="border-t border-border pt-4 mt-4">
                    <Label className="text-foreground mb-2 block">Upload DICOM / CBCT Scan (DCM/ZIP) <span className="text-red-500">*</span></Label>
                    <input
                      type="file"
                      accept=".dcm,.zip,.rar"
                      className="hidden"
                      ref={dicomInputRef}
                      onChange={handleDicomFileChange}
                    />

                    {!selectedDicomFile ? (
                      <div
                        onClick={handleDicomUploadClick}
                        className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-foreground">Drag & Drop DICOM Files Here</p>
                        <p className="text-xs text-muted-foreground mt-0.5">or click to browse (.dcm, .zip)</p>
                      </div>
                    ) : (
                      <div
                        onClick={handleDicomUploadClick}
                        className="border border-emerald-500/30 rounded-lg p-4 flex items-center gap-4 bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{selectedDicomFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(selectedDicomFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Model Mapping (FDI Quadrant Chart) */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-foreground">Tooth Charting (FDI Notation)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="teethNotSpecified"
                      checked={isTeethNotSpecified}
                      onChange={(e) => {
                        setIsTeethNotSpecified(e.target.checked);
                        if (e.target.checked) {
                          setSelectedTeeth([]);
                          setToothConfigs({});
                        }
                      }}
                      className="rounded border-border text-blue-600 focus:ring-blue-600 h-4 w-4 bg-background"
                    />
                    <Label htmlFor="teethNotSpecified" className="text-xs text-muted-foreground cursor-pointer">Not Specified</Label>
                  </div>
                </div>

                {!isTeethNotSpecified ? (
                  <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/10">
                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 text-[9px] text-muted-foreground justify-center">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 border border-red-600"></span>Crown</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-800 border border-blue-900"></span>Abutment</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300 border border-blue-400"></span>Pontic</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-zinc-600 border border-zinc-700"></span>Implant</span>
                      <span className="text-muted-foreground/60">Click tooth to cycle status</span>
                    </div>

                    <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Upper Jaw</div>
                    {/* Q1: UR 18-11 | Q2: UL 21-28 */}
                    <div className="flex flex-wrap gap-1.5 justify-center items-center">
                      {renderQuadrantRow([18, 17, 16, 15, 14, 13, 12, 11])}
                      <div className="w-[1px] h-7 bg-border mx-1"></div>
                      {renderQuadrantRow([21, 22, 23, 24, 25, 26, 27, 28])}
                    </div>

                    <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-3">Lower Jaw</div>
                    {/* Q4: LR 48-41 | Q3: LL 31-38 */}
                    <div className="flex flex-wrap gap-1.5 justify-center items-center">
                      {renderQuadrantRow([48, 47, 46, 45, 44, 43, 42, 41])}
                      <div className="w-[1px] h-7 bg-border mx-1"></div>
                      {renderQuadrantRow([31, 32, 33, 34, 35, 36, 37, 38])}
                    </div>

                    {selectedTeeth.length > 0 && (
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        Configured: <span className="font-semibold text-blue-600">{selectedTeeth.join(', ')}</span>
                      </div>
                    )}

                    {/* Phase 3.3: Predefined Dropdown Parameters */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-border">
                      <div className="grid gap-1">
                        <Label htmlFor="occlusalClearance" className="text-[11px] text-foreground">Occlusal Clearance</Label>
                        <Select value={occlusalClearance} onValueChange={(val) => setOcclusalClearance(val || 'Medium')}>
                          <SelectTrigger className="h-8 text-xs border-border text-foreground bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Light">Light</SelectItem>
                            <SelectItem value="Out of Occlusion">Out of Occlusion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="contactDesign" className="text-[11px] text-foreground">Contact Design</Label>
                        <Select value={contactDesign} onValueChange={(val) => setContactDesign(val || 'Normal')}>
                          <SelectTrigger className="h-8 text-xs border-border text-foreground bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tight">Tight</SelectItem>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Light">Light</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="connectorDesign" className="text-[11px] text-foreground">Connector Design</Label>
                        <Select value={connectorDesign} onValueChange={(val) => setConnectorDesign(val || 'Anatomical')}>
                          <SelectTrigger className="h-8 text-xs border-border text-foreground bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Anatomical">Anatomical</SelectItem>
                            <SelectItem value="Reduced">Reduced</SelectItem>
                            <SelectItem value="Knife Edge">Knife Edge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="ponticDesign" className="text-[11px] text-foreground">Pontic Design</Label>
                        <Select value={ponticDesign} onValueChange={(val) => setPonticDesign(val || 'Ovate')}>
                          <SelectTrigger className="h-8 text-xs border-border text-foreground bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sanitary">Sanitary</SelectItem>
                            <SelectItem value="Saddle">Saddle</SelectItem>
                            <SelectItem value="Ovate">Ovate</SelectItem>
                            <SelectItem value="Modified Ridge Lap">Modified Ridge Lap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
                    Teeth not specified. The lab will design according to the scan models provided.
                  </div>
                )}
              </div>
            )}

            {/* Step 3: CAD Design (Material → Shade Carousel) */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-foreground">Restoration Materials & Shade</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="designNotSpecified"
                      checked={isDesignNotSpecified}
                      onChange={(e) => {
                        setIsDesignNotSpecified(e.target.checked);
                      }}
                      className="rounded border-border text-blue-600 focus:ring-blue-600 h-4 w-4 bg-background"
                    />
                    <Label htmlFor="designNotSpecified" className="text-xs text-muted-foreground cursor-pointer">Not Specified</Label>
                  </div>
                </div>

                {!isDesignNotSpecified ? (
                  <div className="space-y-3">
                    {/* Carousel indicator */}
                    <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                      <span className={carouselPanel === 'material' ? 'font-bold text-blue-600' : ''}>1. Material</span>
                      <ChevronRight className="w-3 h-3" />
                      <span className={carouselPanel === 'shade' ? 'font-bold text-blue-600' : ''}>2. Shade</span>
                    </div>

                    {/* Carousel Container */}
                    <div className="overflow-hidden">
                      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${carouselPanel === 'shade' ? 100 : 0}%)` }}>
                        {/* Panel 1: Material Selection */}
                        <div className="w-full shrink-0 pr-1">
                          <div className="grid gap-2">
                            {MATERIALS.map(mat => (
                              <button
                                key={mat.value}
                                type="button"
                                onClick={() => {
                                  setMaterial(mat.value);
                                  setCarouselPanel('shade');
                                }}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${material === mat.value
                                  ? 'border-blue-600 bg-blue-600/10 shadow-sm'
                                  : 'border-border bg-background hover:bg-muted/50'
                                  }`}
                              >
                                <span className="text-sm font-medium text-foreground">{mat.label}</span>
                                {material === mat.value && (
                                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Panel 2: Shade Selection */}
                        <div className="w-full shrink-0 pl-1 space-y-4">
                          {/* Back to material button */}
                          <button
                            type="button"
                            onClick={() => setCarouselPanel('material')}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronLeft className="w-3 h-3" />
                            Back to Material
                          </button>

                          {/* Selected material display */}
                          <div className="text-xs text-muted-foreground">
                            Material: <span className="font-semibold text-foreground">{MATERIALS.find(m => m.value === material)?.label}</span>
                          </div>

                          {/* Vita 16-Shade Grid */}
                          <div>
                            <Label className="text-foreground mb-2 block text-sm">Vita Shade Code <span className="text-red-500">*</span></Label>
                            {renderShadeGrid((s) => setShade(s), shade)}
                          </div>

                          {/* Custom Shading Toggle */}
                          <div className="border-t border-border pt-3">
                            <div className="flex items-center gap-2 mb-3">
                              <input
                                type="checkbox"
                                id="customShadeEnabled"
                                checked={customShadeEnabled}
                                onChange={(e) => {
                                  setCustomShadeEnabled(e.target.checked);
                                  if (!e.target.checked) setActiveZone(null);
                                }}
                                className="rounded border-border text-blue-600 focus:ring-blue-600 h-4 w-4 bg-background"
                              />
                              <Label htmlFor="customShadeEnabled" className="text-sm text-foreground cursor-pointer">Enable Custom Shading (3-Zone)</Label>
                            </div>

                            {customShadeEnabled && (
                              <div className="space-y-3">
                                {/* SVG Incisor with 3 zones */}
                                <div className="flex gap-3 items-start">
                                  {/* Zone labels */}
                                  <div className="flex flex-col justify-between text-[8px] text-muted-foreground py-1" style={{ height: '120px' }}>
                                    <span>Cervical</span>
                                    <span>Body</span>
                                    <span>Incisal</span>
                                  </div>
                                  {/* SVG Tooth */}
                                  <svg viewBox="0 0 80 120" className="w-20 shrink-0" style={{ height: '120px' }}>
                                    <defs>
                                      <clipPath id="toothClip">
                                        <path d="M 15 8 Q 40 3 65 8 L 63 45 L 60 80 L 55 105 Q 40 115 25 105 L 20 80 L 17 45 Z" />
                                      </clipPath>
                                    </defs>
                                    {/* Cervical zone */}
                                    <rect x="0" y="0" width="80" height="40"
                                      fill={SHADE_HEX_MAP[cervicalShade] || '#ebdccb'}
                                      clipPath="url(#toothClip)"
                                      onClick={() => setActiveZone(activeZone === 'cervical' ? null : 'cervical')}
                                      className="cursor-pointer transition-opacity hover:opacity-80" />
                                    {/* Body zone */}
                                    <rect x="0" y="40" width="80" height="40"
                                      fill={SHADE_HEX_MAP[bodyShade] || '#ebdccb'}
                                      clipPath="url(#toothClip)"
                                      onClick={() => setActiveZone(activeZone === 'body' ? null : 'body')}
                                      className="cursor-pointer transition-opacity hover:opacity-80" />
                                    {/* Incisal zone */}
                                    <rect x="0" y="80" width="80" height="40"
                                      fill={SHADE_HEX_MAP[incisalShade] || '#ebdccb'}
                                      clipPath="url(#toothClip)"
                                      onClick={() => setActiveZone(activeZone === 'incisal' ? null : 'incisal')}
                                      className="cursor-pointer transition-opacity hover:opacity-80" />
                                    {/* Outline */}
                                    <path d="M 15 8 Q 40 3 65 8 L 63 45 L 60 80 L 55 105 Q 40 115 25 105 L 20 80 L 17 45 Z"
                                      fill="none" stroke="#999" strokeWidth="1.5" />
                                    {/* Zone dividers */}
                                    <line x1="15" y1="40" x2="65" y2="40" stroke="#aaa" strokeWidth="0.5" strokeDasharray="2,2" />
                                    <line x1="18" y1="80" x2="62" y2="80" stroke="#aaa" strokeWidth="0.5" strokeDasharray="2,2" />
                                    {/* Active zone highlight */}
                                    {activeZone === 'cervical' && <rect x="0" y="0" width="80" height="40" fill="none" stroke="#3b82f6" strokeWidth="2" clipPath="url(#toothClip)" />}
                                    {activeZone === 'body' && <rect x="0" y="40" width="80" height="40" fill="none" stroke="#3b82f6" strokeWidth="2" clipPath="url(#toothClip)" />}
                                    {activeZone === 'incisal' && <rect x="0" y="80" width="80" height="40" fill="none" stroke="#3b82f6" strokeWidth="2" clipPath="url(#toothClip)" />}
                                  </svg>

                                  {/* Floating shade picker for active zone */}
                                  <div className="flex-1 min-w-0">
                                    {activeZone ? (
                                      <div className="border border-blue-600/30 rounded-lg p-3 bg-blue-600/5">
                                        <p className="text-xs font-semibold text-foreground mb-2">
                                          Select shade for {activeZone === 'cervical' ? 'Cervical' : activeZone === 'body' ? 'Body' : 'Incisal'} zone:
                                        </p>
                                        {renderShadeGrid(
                                          (s) => {
                                            if (activeZone === 'cervical') setCervicalShade(s);
                                            else if (activeZone === 'body') setBodyShade(s);
                                            else setIncisalShade(s);
                                          },
                                          activeZone === 'cervical' ? cervicalShade : activeZone === 'body' ? bodyShade : incisalShade
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                                        Click a zone on the tooth to select its shade.
                                        <div className="mt-2 space-y-1 text-left inline-block">
                                          <div>Cervical: <span className="font-semibold">{cervicalShade}</span></div>
                                          <div>Body: <span className="font-semibold">{bodyShade}</span></div>
                                          <div>Incisal: <span className="font-semibold">{incisalShade}</span></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Characterizations */}
                                <div>
                                  <Label className="text-foreground mb-2 block text-xs">Characterizations</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {['White Spots', 'Crack Lines', 'Incisal Translucency', 'Hypoplasia Marks'].map(char => (
                                      <label key={char} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={characterizations.includes(char)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setCharacterizations(prev => [...prev, char]);
                                            } else {
                                              setCharacterizations(prev => prev.filter(c => c !== char));
                                            }
                                          }}
                                          className="rounded border-border text-blue-600 focus:ring-blue-600 h-3.5 w-3.5 bg-background"
                                        />
                                        <span className="text-foreground">{char}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* Shade Reference Photo Upload */}
                                <div>
                                  <Label className="text-foreground mb-2 block text-xs">Shade Reference Photograph</Label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={shadePhotoInputRef}
                                    onChange={handleShadePhotoChange}
                                  />
                                  {!shadePhotoFile ? (
                                    <div
                                      onClick={handleShadePhotoClick}
                                      className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                                    >
                                      <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                                      <p className="text-xs text-muted-foreground">Upload shade reference photo</p>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={handleShadePhotoClick}
                                      className="border border-emerald-500/30 rounded-lg p-3 flex items-center gap-3 bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                        <Camera className="h-4 w-4 text-emerald-500" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">{shadePhotoFile.name}</p>
                                        <p className="text-[10px] text-muted-foreground">Click to replace</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
                    Material and Shade parameters left unspecified. The lab technician will select appropriate aesthetic choices.
                  </div>
                )}
              </div>
            )}

            {/* Step 4: CAM Manufacturing */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid gap-2">
                  <Label htmlFor="dueDate" className="text-foreground">Requested Due Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Min 1 day ahead
                    className="border-border text-foreground bg-background"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instructions" className="text-foreground">Custom Lab Instructions</Label>
                  <textarea
                    id="instructions"
                    placeholder="Provide specific notes regarding occlusal clearances, contacts, prep margins, or custom glazing instructions..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full min-h-[100px] p-2 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center gap-2 sm:gap-0 mt-4 border-t border-border pt-4">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="border-border text-foreground hover:bg-muted bg-background">
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {/* Show Save as Draft if file is uploaded */}
              {selectedFile && (
                <Button
                  variant="secondary"
                  type="button"
                  disabled={uploadState === 'analyzing'}
                  onClick={() => handleSubmitCase(true)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700"
                >
                  Save as Draft
                </Button>
              )}
              {currentStep < 4 ? (
                <Button
                  type="button"
                  disabled={!isStepComplete(currentStep)}
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={uploadState === 'analyzing' || !isStepComplete(4)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleSubmitCase(false)}
                >
                  Submit Case
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
