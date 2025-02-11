"use client"
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer } from "recharts"
import { useTaskStore } from "@/lib/store"
import { useMemo, useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const COLORS = {
  "Em desenvolvimento": "#10b981",
  "Não iniciada": "#3b82f6",
  Concluída: "#f97316",
  "Em testes": "#fbbf24",
}

const RADIAN = Math.PI / 180

// Em vez de usar any, vamos definir uma interface para os dados
interface ChartData {
  name: string;
  value: number;
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  index?: number;
}

const renderCustomizedLabel = (props: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  name: string;
  value: number;
}) => {
  const radius = props.innerRadius + (props.outerRadius - props.innerRadius) * 1.6;
  const x = props.cx + radius * Math.cos(-props.midAngle * RADIAN);
  const y = props.cy + radius * Math.sin(-props.midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="gray" 
      textAnchor={x > props.cx ? "start" : "end"} 
      dominantBaseline="central" 
      className="text-xs"
    >
      {`${props.name} ${props.value}`}
    </text>
  );
};

export function PieChart() {
  const [isLoading, setIsLoading] = useState(true)
  const getTaskDistribution = useTaskStore((state) => state.getTaskDistribution)
  const tasks = useTaskStore((state) => state.tasks)

  const data = useMemo(() => getTaskDistribution(), [getTaskDistribution])

  useEffect(() => {
    if (tasks.length > 0) {
      setIsLoading(false)
    }
  }, [tasks])

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <Skeleton className="h-[250px] w-[250px] rounded-full" />
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}

