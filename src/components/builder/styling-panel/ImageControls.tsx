import { Square, Circle, User } from 'lucide-react'
import StylingSection from './StylingSection'
import StylingRow from './StylingRow'
import ImageUpload from '../ImageUpload'

interface ImageControlsProps {
    element: any
    onUpdate: (updates: any) => void
}

export default function ImageControls({ element, onUpdate }: ImageControlsProps) {
    const styles = element.styles || {}
    const imageStyle = element.imageStyle || 'default'

    const updateImageStyle = (style: 'default' | 'rounded' | 'circle' | 'avatar') => {
        const updates: any = { imageStyle: style }
        const newStyles = { ...styles }

        if (style === 'circle' || style === 'avatar') {
            newStyles.borderRadius = '50%'
            newStyles.width = '100px'
            newStyles.height = '100px'
            newStyles.objectFit = 'cover'
        } else if (style === 'rounded') {
            newStyles.borderRadius = '8px'
            newStyles.width = styles.width === '100px' ? '100%' : styles.width
            newStyles.height = styles.height === '100px' ? 'auto' : styles.height
        } else {
            newStyles.borderRadius = '0'
            newStyles.width = styles.width === '100px' ? '100%' : styles.width
            newStyles.height = styles.height === '100px' ? 'auto' : styles.height
        }

        updates.styles = newStyles
        onUpdate(updates)
    }

    const updateStyle = (key: string, value: string) => {
        onUpdate({
            styles: {
                ...styles,
                [key]: value,
            },
        })
    }

    return (
        <StylingSection title="Image settings" defaultOpen>
            <div className="mb-4">
                <ImageUpload
                    onImageSelect={(url) => onUpdate({ content: url })}
                    currentUrl={element.content}
                />
            </div>

            <StylingRow label="Style">
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { value: 'default', label: 'Default', icon: Square },
                        { value: 'rounded', label: 'Round', icon: Square, className: 'rounded-md' },
                        { value: 'circle', label: 'Circle', icon: Circle },
                        { value: 'avatar', label: 'Avatar', icon: User },
                    ].map((style) => (
                        <button
                            key={style.value}
                            onClick={() => updateImageStyle(style.value as any)}
                            className={[
                                'flex flex-col items-center justify-center gap-1 py-2 rounded-md border transition-colors',
                                imageStyle === style.value
                                    ? 'border-accent bg-accent-soft/60 text-accent'
                                    : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink',
                            ].join(' ')}
                        >
                            <style.icon
                                className={`w-4 h-4 ${style.className || ''}`}
                                strokeWidth={1.75}
                            />
                            <span className="text-[10px] font-medium">{style.label}</span>
                        </button>
                    ))}
                </div>
            </StylingRow>

            <div className="grid grid-cols-2 gap-3 mt-3">
                <StylingRow label="Width">
                    <select
                        value={styles.width || '100%'}
                        onChange={(e) => updateStyle('width', e.target.value)}
                        className="w-full h-9 px-2 text-[12px] border border-line rounded-md focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong bg-surface text-ink transition-colors"
                    >
                        <option value="100%">Full (100%)</option>
                        <option value="75%">75%</option>
                        <option value="50%">50%</option>
                        <option value="25%">25%</option>
                        <option value="auto">Auto</option>
                        <option value="100px">Fixed (100px)</option>
                        <option value="200px">Fixed (200px)</option>
                    </select>
                </StylingRow>
                <StylingRow label="Height">
                    <select
                        value={styles.height || 'auto'}
                        onChange={(e) => updateStyle('height', e.target.value)}
                        className="w-full h-9 px-2 text-[12px] border border-line rounded-md focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong bg-surface text-ink transition-colors"
                    >
                        <option value="auto">Auto</option>
                        <option value="100px">Small (100px)</option>
                        <option value="200px">Medium (200px)</option>
                        <option value="300px">Large (300px)</option>
                        <option value="100%">Full height</option>
                    </select>
                </StylingRow>
            </div>
        </StylingSection>
    )
}
