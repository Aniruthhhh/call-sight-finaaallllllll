"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Upload, FileType, Check, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'

export function LeadUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const leads = results.data.map((row: any) => ({
            name: row.name || row.Name || 'Unknown',
            phone: row.phone || row.Phone || '',
            company: row.company || row.Company || '',
            status: 'pending'
          }))

          if (leads.length === 0) throw new Error('No leads found in CSV')

          const { error } = await supabase.from('leads').insert(leads)
          if (error) throw error

          toast.success(`Successfully uploaded ${leads.length} leads`)
          onUploadSuccess()
        } catch (error: any) {
          toast.error(error.message)
        } finally {
          setUploading(false)
        }
      }
    })
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-white border border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center border-dashed border-2 hover:border-blue-500 transition-all cursor-pointer">
        <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-600 mb-4 transition-colors" />
        <h3 className="font-semibold text-slate-800">Upload Leads</h3>
        <p className="text-sm text-slate-500 mb-4">CSV or Excel files (max 10MB)</p>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".csv"
            className="hidden"
            id="csv-upload"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button asChild variant="outline" className="border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100">
            <label htmlFor="csv-upload">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileType className="w-4 h-4 mr-2" />}
              Select File
            </label>
          </Button>
        </div>
      </div>
    </div>
  )
}
