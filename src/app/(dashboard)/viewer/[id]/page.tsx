'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Maximize, Settings2, SlidersHorizontal, Image as ImageIcon, Ruler, MousePointer2, Scissors, Bone, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CBCTViewer({ params }: { params: { id: string } }) {
  const [activeTool, setActiveTool] = useState('pan')
  const [activeLayout, setActiveLayout] = useState('4-up')
  
  // This is a premium UI mockup for a CBCT / DICOM viewer.
  // Integrating an actual DICOM parsing engine (like cornerstone.js or vtk.js)
  // requires a significant client-side rendering pipeline which can be plugged right into these panes.

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Link href={`/cases/${params.id}`}>
            <Button variant="ghost" size="icon" className="hover:bg-zinc-800 text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
            <h1 className="font-semibold tracking-tight text-white">CBCT Scan Review</h1>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-mono font-medium border border-blue-500/20">
              Case #{params.id.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
          <ToolbarButton icon={<MousePointer2 />} label="Pan/Select" active={activeTool === 'pan'} onClick={() => setActiveTool('pan')} />
          <ToolbarButton icon={<SlidersHorizontal />} label="Window/Level" active={activeTool === 'wl'} onClick={() => setActiveTool('wl')} />
          <ToolbarButton icon={<Maximize />} label="Zoom" active={activeTool === 'zoom'} onClick={() => setActiveTool('zoom')} />
          <div className="w-px h-6 bg-zinc-700 mx-1" />
          <ToolbarButton icon={<Ruler />} label="Measure" active={activeTool === 'measure'} onClick={() => setActiveTool('measure')} />
          <ToolbarButton icon={<Scissors />} label="Crop Volume" active={activeTool === 'crop'} onClick={() => setActiveTool('crop')} />
          <ToolbarButton icon={<Bone />} label="Density" active={activeTool === 'density'} onClick={() => setActiveTool('density')} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-xs">
            <Download className="w-4 h-4 mr-2" /> Download Original DICOM
          </Button>
          <Button variant="secondary" size="icon" className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800">
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Scan Info & Presets */}
        <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Volume Properties</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Modality</span>
                <span className="font-medium text-zinc-200">CT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Resolution</span>
                <span className="font-medium text-zinc-200">512 x 512 x 340</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Voxel Size</span>
                <span className="font-medium text-zinc-200">0.25mm³</span>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Render Presets</h3>
            <div className="grid gap-2">
              <PresetButton label="Default Bone" active />
              <PresetButton label="Soft Tissue" />
              <PresetButton label="Maximum Intensity (MIP)" />
              <PresetButton label="Airways" />
              <PresetButton label="Dental Enamel" />
            </div>
          </div>
          
          <div className="p-4 mt-auto border-t border-zinc-800">
             <div className="text-xs text-zinc-500 italic">
               Note: This is a placeholder for the advanced DICOM rendering engine. Integrating VTK.js or Cornerstone3D will populate these viewports.
             </div>
          </div>
        </div>

        {/* Main Viewport Grid */}
        <div className="flex-1 bg-black p-1 grid gap-1 grid-cols-2 grid-rows-2">
          {/* Axial View */}
          <div className="relative border border-zinc-800 rounded flex flex-col bg-zinc-950 overflow-hidden group">
            <div className="absolute top-2 left-2 z-10 text-[10px] text-green-400 font-mono">AXIAL</div>
            <div className="absolute bottom-2 right-2 z-10 text-[10px] text-zinc-500 font-mono">WL: 400 / WW: 1500</div>
            <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="w-[80%] h-[80%] rounded-full border-2 border-green-500/50" />
              </div>
              <ImageIcon className="w-12 h-12 text-zinc-800" />
            </div>
          </div>

          {/* Coronal View */}
          <div className="relative border border-zinc-800 rounded flex flex-col bg-zinc-950 overflow-hidden group">
            <div className="absolute top-2 left-2 z-10 text-[10px] text-blue-400 font-mono">CORONAL</div>
            <div className="absolute bottom-2 right-2 z-10 text-[10px] text-zinc-500 font-mono">WL: 400 / WW: 1500</div>
            <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute inset-x-10 inset-y-20 border-2 border-blue-500/10 rounded-[100%]" />
              <ImageIcon className="w-12 h-12 text-zinc-800" />
            </div>
          </div>

          {/* Sagittal View */}
          <div className="relative border border-zinc-800 rounded flex flex-col bg-zinc-950 overflow-hidden group">
            <div className="absolute top-2 left-2 z-10 text-[10px] text-red-400 font-mono">SAGITTAL</div>
            <div className="absolute bottom-2 right-2 z-10 text-[10px] text-zinc-500 font-mono">WL: 400 / WW: 1500</div>
            <div className="flex-1 flex items-center justify-center relative">
               <div className="absolute inset-y-10 inset-x-20 border-2 border-red-500/10 rounded-[40%]" />
              <ImageIcon className="w-12 h-12 text-zinc-800" />
            </div>
          </div>

          {/* 3D Volume Render */}
          <div className="relative border border-zinc-800 rounded flex flex-col bg-zinc-900 overflow-hidden group shadow-inner">
            <div className="absolute top-2 left-2 z-10 text-[10px] text-yellow-400 font-mono font-bold">3D VOLUME RENDER</div>
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-zinc-800/20 rounded-full blur-2xl" />
              <Bone className="w-24 h-24 text-zinc-700 drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded transition-colors flex items-center justify-center
        ${active 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
        }`}
    >
      <div className="w-4 h-4 *:w-full *:h-full">{icon}</div>
    </button>
  )
}

function PresetButton({ label, active }: { label: string, active?: boolean }) {
  return (
    <button
      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors border
        ${active
          ? 'bg-blue-900/20 border-blue-800/50 text-blue-200 font-medium'
          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
    >
      {label}
    </button>
  )
}
