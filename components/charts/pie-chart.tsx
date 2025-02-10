"use client"
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer } from "recharts"
import { useTaskStore } from "@/lib/store"
import { useMemo } from "react"

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
  const getTaskDistribution = useTaskStore((state) => state.getTaskDistribution)

  const data = useMemo(() => {
    const distribution = getTaskDistribution()
    // Calcular o total para obter os valores absolutos
    const total = distribution.reduce((acc, item) => acc + item.value, 0)
    return distribution.map((item) => ({
      ...item,
      absoluteValue: Math.round((item.value * total) / 100),
    }))
  }, [getTaskDistribution])

  return (
    <div className="h-[400px] flex flex-col">
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={{
                stroke: "#666666",
                strokeWidth: 1,
              }}
              label={renderCustomizedLabel}
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs px-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: COLORS[item.name as keyof typeof COLORS],
              }}
            />
            <span className="text-gray-600 truncate">
              {item.name} {item.absoluteValue}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

