import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message }: ConfirmDeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-white rounded-[2rem] p-6 lg:p-8 w-full max-w-[400px] relative z-10 shadow-2xl flex flex-col items-center text-center">
        
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" strokeWidth={2.5} />
        </div>

        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight mb-2">{title}</h2>
        <p className="text-[14px] font-semibold text-slate-500 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex w-full gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors shadow-md shadow-red-500/20"
          >
            Đồng ý Xóa
          </button>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}
