'use client';

import React, { useState, useEffect } from 'react';
import { Palette, X, Sparkles, Building2, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const THEME_PRESETS = [
  { name: 'DCOS Teal (Default)', primary: '#0d9488', hover: '#0f766e', ring: '#14b8a6', glow: 'rgba(13,148,136,0.25)' },
  { name: 'Royal Blue', primary: '#2563eb', hover: '#1d4ed8', ring: '#3b82f6', glow: 'rgba(37,99,235,0.25)' },
  { name: 'Emerald Prosthetics', primary: '#059669', hover: '#047857', ring: '#10b981', glow: 'rgba(5,150,105,0.25)' },
  { name: 'Deep Indigo / Violet', primary: '#7c3aed', hover: '#6d28d9', ring: '#8b5cf6', glow: 'rgba(124,58,237,0.25)' },
  { name: 'Precision Crimson', primary: '#e11d48', hover: '#be123c', ring: '#f43f5e', glow: 'rgba(225,29,72,0.25)' },
  { name: 'Luxury Gold CAD', primary: '#d97706', hover: '#b45309', ring: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
];

export function WhiteLabelSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(THEME_PRESETS[0].name);
  const [customLabName, setCustomLabName] = useState('');
  const [customHex, setCustomHex] = useState('#0d9488');

  // Apply theme dynamically to document root CSS variables
  const applyTheme = (primaryColor: string, hoverColor?: string, ringColor?: string) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-hover', hoverColor || primaryColor);
    root.style.setProperty('--ring', ringColor || primaryColor);

    // Also update any inline theme badges
    const brandElements = document.querySelectorAll('[data-brand-name]');
    if (customLabName.trim()) {
      brandElements.forEach((el) => {
        el.textContent = customLabName.trim();
      });
    }
  };

  const handleSelectPreset = (preset: typeof THEME_PRESETS[0]) => {
    setActiveTheme(preset.name);
    setCustomHex(preset.primary);
    applyTheme(preset.primary, preset.hover, preset.ring);
    toast.success(`Branding switched to ${preset.name}`, {
      description: 'Client portal primary palette and accents updated live.',
    });
  };

  const handleApplyCustom = () => {
    if (!customHex.startsWith('#')) return;
    setActiveTheme('Custom Palette');
    applyTheme(customHex, customHex, customHex);
    toast.success(`Custom Branding Applied: ${customHex}`, {
      description: customLabName ? `White-labeled for ${customLabName}` : 'Custom theme active.',
    });
  };

  const handleReset = () => {
    const defaultPreset = THEME_PRESETS[0];
    setActiveTheme(defaultPreset.name);
    setCustomLabName('');
    setCustomHex(defaultPreset.primary);
    applyTheme(defaultPreset.primary, defaultPreset.hover, defaultPreset.ring);
    toast.info('Branding reset to default DCOS system palette.');
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 print:hidden">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-3 py-2 rounded-full bg-card/90 hover:bg-card border border-border/80 shadow-xl backdrop-blur-md text-xs font-semibold text-foreground transition-all duration-300 hover:scale-105 active:scale-95"
          title="White-Label Live Presenter Switcher"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <Palette className="w-3.5 h-3.5 text-primary group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline">White-Label Demo</span>
        </button>
      ) : (
        <div className="w-80 rounded-2xl bg-card/95 border border-border/80 shadow-2xl backdrop-blur-xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                White-Label Live Presenter
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prospect Lab Branding */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Prospect Lab / Clinic Name
            </label>
            <Input
              value={customLabName}
              onChange={(e) => setCustomLabName(e.target.value)}
              placeholder="e.g. Naruka's Dental Lab"
              className="h-8 text-xs"
            />
          </div>

          {/* Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground block">
              Corporate Brand Colors
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = activeTheme === preset.name;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                        : 'border-border/60 hover:border-border hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-white/20"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span className="truncate">{preset.name.split(' ')[0]}</span>
                    {isSelected && <Check className="w-3 h-3 ml-auto text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Hex */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="color"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-border/80 p-0.5 bg-background shrink-0"
            />
            <Input
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="#2563eb"
              className="h-8 text-xs font-mono uppercase"
            />
            <Button size="sm" onClick={handleApplyCustom} className="h-8 px-2.5 text-xs">
              Apply
            </Button>
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
            <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground">
              Live Pitch Mode
            </Badge>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
