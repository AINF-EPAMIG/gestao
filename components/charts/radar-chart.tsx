"use client"

import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts"
import { useTaskStore } from "@/lib/store"
import { useMemo, useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SYSTEM_CONFIG, getMinimumTasksThreshold, formatPercentage } from "@/lib/constants"

interface CustomAxisTickProps {
  x: number
  y: number
  payload: {
    value: string
    email: string
    angle: number
  }
}

const CustomAxisTick = ({ x, y, payload }: CustomAxisTickProps) => {
  const name = payload.value;
  const email = payload.email;

  let adjustX = 0;
  let adjustY = 0;
  let textAnchor = "middle";

  // Ajustes responsivos com base no tamanho da tela
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const padding = isMobile ? 20 : 25;

  if (payload.angle === 0) {
    adjustX = padding;
    textAnchor = "start";
  } else if (payload.angle === 90) {
    adjustY = padding;
  } else if (payload.angle === 180) {
    adjustX = -padding;
    textAnchor = "end";
  } else if (payload.angle === 270) {
    adjustY = -padding;
  }

  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Formatação do email para garantir que tenha o domínio
  const formattedEmail = useMemo(() => {
    if (!email) return undefined;
    return email.includes('@') ? email : `${email}@epamig.br`;
  }, [email]);

  return (
    <g transform={`translate(${x + adjustX},${y + adjustY})`}>
      <foreignObject x="-30" y="-12" width="60" height="24" style={{ overflow: "visible" }}>
        <div
          className={`flex items-center gap-1 bg-white rounded-full px-1 py-0.5 sm:px-1.5 sm:py-0.5 w-fit shadow-sm ${
            textAnchor === "end" ? "justify-end" : textAnchor === "start" ? "justify-start" : "justify-center"
          }`}
        >
          <Avatar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0">
            <AvatarImage 
              key={formattedEmail}
              email={formattedEmail}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
            <AvatarFallback>{!imageLoaded && (email ? email[0].toUpperCase() : '?')}</AvatarFallback>
          </Avatar>
          <span className="text-[7px] sm:text-[8px] md:text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[30px] sm:max-w-[40px] md:max-w-[50px]">
            {name}
          </span>
        </div>
      </foreignObject>
    </g>
  )
}

export function RadarChart() {
  const [isLoading, setIsLoading] = useState(true)
  const tasks = useTaskStore((state) => state.tasks)

  const data = useMemo(() => {
    const assigneeCounts = tasks.reduce(
      (acc, task) => {
        (task.responsaveis ?? []).forEach(responsavel => {
          if (responsavel.email === "andrezza.fernandes@epamig.br") {
            return;
          }
          
          let name = responsavel.nome || responsavel.email.split('@')[0].replace('.', ' ');
          name = name.split(' ')[0];
          name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
          const email = responsavel.email;
          acc[email] = {
            name,
            email,
            count: (acc[email]?.count || 0) + 1
          };
        });
        return acc;
      },
      {} as Record<string, { name: string; email: string; count: number }>,
    )

    // Calcular o total de tarefas
    const totalTasks = tasks.length;
    
    // Calcular o limite mínimo usando a função utilitária
    // Regra: Mostrar apenas usuários relevantes com pelo menos 5% das tarefas
    const minimumTasksThreshold = getMinimumTasksThreshold(totalTasks);

    // Filtrar apenas usuários relevantes (com pelo menos 10% das tarefas)
    const relevantUsers = Object.values(assigneeCounts).filter(
      ({ count }) => count >= minimumTasksThreshold
    );

    return relevantUsers.map(({ name, email, count }) => ({
      subject: name,
      email: email,
      A: count,
    }))
  }, [tasks])

  // Calcular informações para exibição
  const totalTasks = tasks.length;
  const minimumTasksThreshold = getMinimumTasksThreshold(totalTasks);
  const totalUsers = Object.keys(tasks.reduce((acc, task) => {
    (task.responsaveis ?? []).forEach(responsavel => {
      if (responsavel.email !== "andrezza.fernandes@epamig.br") {
        acc[responsavel.email] = true;
      }
    });
    return acc;
  }, {} as Record<string, boolean>)).length;

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

  // Calcular o tamanho ideal do gráfico baseado no número de usuários
  // Agora com um tamanho maior
  const outerRadius = Math.min(75, Math.max(65, 80 - data.length * 2)) + '%';

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius={outerRadius} data={data}>
            <PolarGrid strokeWidth={0.5} stroke="#e2e8f0" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={(props) => <CustomAxisTick {...props} payload={{ ...props.payload, email: data[props.index]?.email }} />}
              tickSize={20} 
              stroke="#64748b"
            />
            <Radar 
              name="Tarefas" 
              dataKey="A" 
              stroke="#10b981" 
              fill="#10b981" 
              fillOpacity={0.6} 
              strokeWidth={1.5}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[7px] sm:text-[8px] md:text-xs text-gray-500 text-center mt-1 px-2">
        Exibindo {data.length} de {totalUsers} usuários (≥{minimumTasksThreshold} tarefas - {formatPercentage(SYSTEM_CONFIG.RADAR_CHART_MIN_PERCENTAGE)} do total)
      </div>
    </div>
  )
}

