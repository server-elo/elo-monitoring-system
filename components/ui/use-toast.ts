import { useState } from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

let toastCount = 0

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_VALUE
  return toastCount.toString()
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (props: Omit<Toast, "id">) => {
    const id = genId()
    const newToast: Toast = {
      id,
      ...props,
    }

    setToasts((toasts) => [...toasts, newToast])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((toasts) => toasts.filter((t) => t.id !== id))
    }, 5000)

    return {
      id,
      dismiss: () => {
        setToasts((toasts) => toasts.filter((t) => t.id !== id))
      },
    }
  }

  return {
    toast,
    toasts,
    dismiss: (toastId: string) => {
      setToasts((toasts) => toasts.filter((t) => t.id !== toastId))
    },
  }
}

// Export the toast function directly
export { useToast as toast }