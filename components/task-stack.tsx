"use client"

import { useState } from "react"
import { Task, getPriorityName, getStatusName } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { TaskDetailsModal } from "@/components/task-details-modal"
import { getResponsavelName } from '@/lib/utils'

interface TaskStackProps {
  tasks: Task[]
  responsavelEmail: string
}

const statusColors = {
  "Não iniciada": "border-l-orange-500",
  "Em desenvolvimento": "border-l-blue-500",
  "Em testes": "border-l-amber-500",
  "Concluída": "border-l-emerald-500",
} as const;

export function TaskStack({ tasks, responsavelEmail }: TaskStackProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const handleCardClick = (task: Task) => {
    setSelectedTask(task)
    setShowDetails(true)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-8 w-8">
          <AvatarImage email={responsavelEmail} />
          <AvatarFallback>{responsavelEmail[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{getResponsavelName(responsavelEmail)}</span>
      </div>

      <div className="relative space-y-2">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ 
                position: 'relative',
                width: '100%',
              }}
            >
              <Card
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                  statusColors[getStatusName(task.status_id) as keyof typeof statusColors]
                }`}
                onClick={() => handleCardClick(task)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={
                        getPriorityName(task.prioridade_id) === "Alta"
                          ? "bg-red-500"
                          : getPriorityName(task.prioridade_id) === "Média"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }
                    >
                      {getPriorityName(task.prioridade_id)}
                    </Badge>
                    <Badge variant="outline">
                      {task.projeto_nome 
                        ? (task.projeto_nome.length > 15 ? `${task.projeto_nome.slice(0, 15)}...` : task.projeto_nome)
                        : (!task.projeto_id ? "Projeto Indefinido" : `Projeto ${task.projeto_id}`)}
                    </Badge>
                  </div>
                  <h4 className="font-medium truncate" title={task.titulo}>{task.titulo}</h4>
                  <div className="flex items-center gap-2">
                    {task.data_inicio && (
                      <span className="text-xs text-gray-500">
                        Início: {new Date(task.data_inicio).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask}
          open={showDetails}
          onOpenChange={setShowDetails}
        />
      )}
    </div>
  )
} 