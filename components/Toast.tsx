'use client'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

interface ToastProps {
  message: string
  duration?: number
  show: boolean
  onHide: () => void
}

export default function Toast({ message, duration = 2000, show, onHide }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onHide])

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <Check className="w-4 h-4 text-green-400" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  )
}
