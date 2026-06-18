import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Case } from '@/src/types';

const COLORS = {
  ACTIVE: '#3b82f6',    // blue-500
  COMPLETED: '#10b981', // emerald-500
  PENDING: '#f59e0b',   // yellow-500
};

export default function SummaryChart({ cases }: { cases: Case[] }) {
  const activeCases = cases.filter(c => c.status === 'IN_PROGRESS' || c.status === 'QUALITY_CHECK' || c.status === 'DISPATCHED').length;
  const completedCases = cases.filter(c => c.status === 'DELIVERED').length;
  const pendingCases = cases.filter(c => c.status === 'PENDING').length;

  const data = [
    { name: 'Active', value: activeCases, color: COLORS.ACTIVE },
    { name: 'Completed', value: completedCases, color: COLORS.COMPLETED },
    { name: 'Pending', value: pendingCases, color: COLORS.PENDING },
  ];

  if (data.every(item => item.value === 0)) {
    return null;
  }

  return (
    <Card className="shadow-sm border-border flex flex-col h-full justify-between">
      <CardHeader className="pb-0 shrink-0">
        <CardTitle className="text-sm font-medium">Cases Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center p-0 min-h-[180px]">
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
      </CardContent>
    </Card>
  );
}
