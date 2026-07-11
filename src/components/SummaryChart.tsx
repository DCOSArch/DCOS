import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Case } from '@/types';



type TimeFilter = 'day' | 'week' | 'month' | 'year' | 'lifetime';

export default function SummaryChart({ cases }: { cases: Case[] }) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('day');

  const data = useMemo(() => {
    // 1. Filter cases by time
    const now = new Date();
    let cutoff: Date | null = null;
    
    if (timeFilter === 'day') {
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeFilter === 'week') {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === 'month') {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === 'year') {
      cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const filteredCases = cutoff 
      ? cases.filter(c => new Date(c.createdAt) >= cutoff!)
      : cases;

    // 2. Tally restoration types
    const typeCounts: Record<string, number> = {};

    filteredCases.forEach(c => {
      if (!c.instructions) return;
      
      const match = c.instructions.match(/\[Design Parameters\]:\s*(\{[\s\S]*\})/);
      if (match && match[1]) {
        try {
          const params = JSON.parse(match[1]);
          if (params.toothConfigs) {
            Object.values(params.toothConfigs).forEach((indication: any) => {
              if (typeof indication === 'string' && indication !== 'none') {
                const type = indication.charAt(0).toUpperCase() + indication.slice(1);
                typeCounts[type] = (typeCounts[type] || 0) + 1;
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse design parameters in chart", e);
        }
      }
    });

    // 3. Format for recharts
    const INDICATION_COLORS: Record<string, string> = {
      'Coping': '#0d9488',
      'Crown': '#3b82f6',
      'Implant': '#475569',
      'Abutment': '#eab308',
      'Fpd': '#059669',
      'Pontic': '#b91c1c',
      'Veneer': '#94a3b8'
    };

    const FALLBACK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

    return Object.entries(typeCounts)
      .map(([name, value], index) => ({
        name: name === 'Fpd' ? 'FPD' : name, // Better casing for FPD
        value,
        color: INDICATION_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // sort largest first
  }, [cases, timeFilter]);

  return (
    <Card className="shadow-sm border-border flex flex-col h-full justify-between">
      <CardHeader className="pb-0 shrink-0 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">Restorations Breakdown</CardTitle>
        <select 
          className="text-xs border border-border bg-background text-foreground rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
        >
          <option value="day">Past day</option>
          <option value="week">Past week</option>
          <option value="month">Past month</option>
          <option value="year">Past year</option>
          <option value="lifetime">Lifetime</option>
        </select>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center p-0 min-h-[180px] relative">
        {data.length === 0 ? (
          <div className="text-xs text-muted-foreground italic absolute inset-0 flex items-center justify-center">
            No restorations for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart margin={{ top: 10, left: 0, right: 0, bottom: 0 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
