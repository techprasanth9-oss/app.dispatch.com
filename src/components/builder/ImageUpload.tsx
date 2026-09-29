import React, { useRef, useState } from 'react'
import { Upload, ImageOff } from 'lucide-react'

interface ImageUploadProps {
    onImageSelect: (url: string) => void
    currentUrl?: string
}

/**
 * Small dual-mode image picker: file upload (converted to a data URL) or
 * remote URL. Used inside ImageControls; stays local — no separate service.
 */
export default function ImageUpload({ onImageSelect, currentUrl }: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(currentUrl || null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            setPreview(result)
            onImageSelect(result)
        }
        reader.readAsDataURL(file)
    }

    const handleUrlChange = (url: string) => {
        setPreview(url)
        onImageSelect(url)
    }

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-[11.5px] font-medium text-ink-muted mb-1.5">
                    Upload image
                </label>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 h-9 px-3 bg-surface border border-line hover:border-line-strong text-ink rounded-md text-[13px] font-medium transition-colors"
                >
                    <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Choose file
                </button>
            </div>

            <div>
                <label className="block text-[11.5px] font-medium text-ink-muted mb-1.5">
                    Or enter image URL
                </label>
                <input
                    type="text"
                    value={currentUrl || ''}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="w-full h-9 px-3 border border-line rounded-md bg-surface text-[13px] text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent hover:border-line-strong transition-colors"
                    placeholder="https://example.com/image.jpg"
                />
            </div>

            {preview && (
                <div>
                    <label className="block text-[11.5px] font-medium text-ink-muted mb-1.5">
                        Preview
                    </label>
                    <div className="relative w-full h-32 rounded-md overflow-hidden bg-surface-sunken border border-line">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={() => setPreview(null)}
                        />
                    </div>
                </div>
            )}

            {!preview && (
                <div className="w-full h-24 rounded-md border border-dashed border-line bg-surface-sunken/40 flex flex-col items-center justify-center gap-1 text-ink-subtle">
                    <ImageOff className="w-5 h-5" strokeWidth={1.5} />
                    <span className="text-[11.5px]">No image yet</span>
                </div>
            )}
        </div>
    )
}
