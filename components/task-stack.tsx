"use client"

import { useState } from "react"
import { Task } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getUserIcon } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { getStatusName, getPriorityName, formatHours } from "@/lib/store"

interface TaskStackProps {
  tasks: Task[]
  responsavelEmail: string
}

export function TaskStack({ tasks, responsavelEmail }: TaskStackProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const formatName = (email: string) => {
    return email.split('@')[0].split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={getUserIcon(responsavelEmail)} />
          <AvatarFallback>{responsavelEmail[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{formatName(responsavelEmail)}</span>
        <Badge className="ml-2 bg-blue-500">{tasks.length} tarefas</Badge>
      </div>

      <div className="relative space-y-2">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              layout
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                y: expandedIndex === null ? -index * 4 : 0,
                zIndex: expandedIndex === index ? 10 : tasks.length - index
              }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ 
                position: expandedIndex === null ? 'absolute' : 'relative',
                width: '100%',
                top: 0
              }}
            >
              <Card
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow
                  ${expandedIndex === index ? 'ring-2 ring-emerald-500' : ''}
                  ${expandedIndex !== null && expandedIndex !== index ? 'opacity-50' : ''}
                `}
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{task.titulo}</span>
                    <Badge variant="outline" className={
                      getPriorityName(task.prioridade_id) === "Alta"
                        ? "border-red-500 text-red-500"
                        : getPriorityName(task.prioridade_id) === "Média"
                        ? "border-yellow-500 text-yellow-500"
                        : "border-green-500 text-green-500"
                    }>
                      {getPriorityName(task.prioridade_id)}
                    </Badge>
                  </div>

                  {expandedIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      <p className="text-sm text-gray-500">{task.descricao}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span>Sistema: {task.sistema_nome}</span>
                        <span>Estimativa: {formatHours(task.estimativa_horas)}</span>
                      </div>
                      {task.data_inicio && (
                        <div className="text-sm text-gray-500">
                          Início: {new Date(task.data_inicio).toLocaleDateString()}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
} 