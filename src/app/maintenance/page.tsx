import React from 'react'
import { Construction } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 md:p-10 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E5E7EB]">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#D1FAE5] text-[#10B981] flex items-center justify-center">
            <Construction className="w-[64px] h-[64px] text-[#10B981]" strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Sistem Sedang dalam Pemeliharaan
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Mohon tunggu beberapa saat. Sistem akan segera kembali normal.
          </p>
        </div>
      </div>
    </div>
  )
}
