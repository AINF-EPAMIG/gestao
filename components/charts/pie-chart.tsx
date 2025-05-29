"use client"
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useTaskStore } from "@/lib/store"
import { useMemo, useState, useEffect, ReactNode } from "react"
import { Loader2 } from "lucide-react"

const COLORS = {
  "Em desenvolvimento": "#3b82f6",
  "Não iniciada": "#ef4444",
  Concluída: "#10b981",
  "Em testes": "#facc15",
}

const RADIAN = Math.PI / 180

interface CustomLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  value: number
  percent: number
}

interface ChartDataItem {
  name: string;
  value: number;
  percent: number;
  fill?: string;
}

interface PieChartTooltipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    payload: ChartDataItem;
    fill: string;
  }[];
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }: CustomLabelProps) => {
  if (percent < 0.05) return null;
  
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  const fontSize = value > 20 ? 'text-xs sm:text-sm' : 'text-[8px] sm:text-xs';

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className={`${fontSize} font-medium`}
    >
      {value}
    </text>
  )
}

const CustomTooltip = ({ active, payload }: PieChartTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0];
  
  return (
    <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg text-[10px] sm:text-xs">
      <p className="font-medium">{data.name}</p>
      <div className="flex items-center gap-2 mt-1">
        <div 
          className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
          style={{ backgroundColor: data.fill }}
        />
        <div>
          <span className="font-medium">{data.value}</span>
          <span className="text-gray-500 ml-1">({(data.payload.percent * 100).toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
};

export function PieChart() {
  const [isLoading, setIsLoading] = useState(true)
  const tasks = useTaskStore((state) => state.tasks)

  const data = useMemo(() => {
    const statusCount = tasks.reduce(
      (acc, task) => {
        const statusName = getStatusName(task.status_id)
        acc[statusName] = (acc[statusName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    
    const total = Object.values(statusCount).reduce((sum, count) => sum + count, 0);

    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      percent: total > 0 ? value / total : 0
    }))
  }, [tasks])

  useEffect(() => {
    if (tasks.length > 0) {
      setIsLoading(false)
    }
  }, [tasks])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="25%"
          outerRadius="70%"
          paddingAngle={2}
          dataKey="value"
          label={renderCustomizedLabel}
          labelLine={false}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={16}
          iconSize={8}
          iconType="circle"
          formatter={(value: string): ReactNode => (
            <span className="text-[8px] sm:text-[10px] md:text-xs">{value}</span>
          )}
          wrapperStyle={{
            paddingTop: "4px",
            fontSize: "10px",
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

function getStatusName(statusId: number): string {
  const statusMap: Record<number, string> = {
    1: "Não iniciada",
    2: "Em desenvolvimento",
    3: "Em testes",
    4: "Concluída",
  }
  return statusMap[statusId] || "Desconhecido"
}

