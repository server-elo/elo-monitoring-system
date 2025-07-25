"use client"

import { ReactElement } from "react"

export function Toaster(): ReactElement {
  return (
    <div id="toast-container" className="fixed top-4 right-4 z-50">
      {/* Toast notifications will be rendered here */}
    </div>
  )
}