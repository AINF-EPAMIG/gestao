"use client"

import { SectorCheck } from "@/components/sector-check"
import type React from "react"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SectorCheck>
      {children}
    </SectorCheck>
  )
} 