"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProgressGraphProps {
  data: { date: string; hours: number }[];
}

export function ProgressGraph({ data }: ProgressGraphProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--foreground)/0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value}h`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--foreground)/0.1)', background: 'hsl(var(--background))' }}
            cursor={{ stroke: 'hsl(var(--foreground)/0.1)' }}
          />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
            activeDot={{ r: 6, fill: 'hsl(var(--foreground))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
