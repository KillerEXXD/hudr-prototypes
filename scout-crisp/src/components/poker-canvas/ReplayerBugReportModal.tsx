/**
 * Replayer Bug Report Modal
 *
 * A compact, mobile-friendly modal for submitting bug reports from the hand replayer.
 * Captures replayer debug data and submits to TournamentPro bug tracker.
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Bug,
  Send,
  Loader2,
  AlertCircle,
  Upload,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { captureReplayerError, addReplayerBreadcrumb } from '@/lib/sentry/replayerErrors'

// =====================
// Types
// =====================

interface PendingScreenshot {
  file: File
  preview: string
}

interface ScreenshotData {
  /** Base64-encoded image data (without data:image/... prefix) */
  data: string
  /** MIME type (e.g., "image/png") */
  mimeType: string
  /** Original file name */
  fileName: string
  /** File size in bytes */
  fileSize: number
}

/**
 * Convert a File to base64 ScreenshotData
 */
async function fileToBase64(file: File): Promise<ScreenshotData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data:image/...;base64, prefix
      const base64Data = result.split(',')[1]
      resolve({
        data: base64Data,
        mimeType: file.type,
        fileName: file.name,
        fileSize: file.size,
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface ReplayerBugReportModalProps {
  isOpen: boolean
  onClose: () => void
  debugData: string
  handId?: string
  handUrl?: string
  reporterEmail?: string
  reporterName?: string
  /** Auto-captured canvas screenshot from Camera button */
  capturedScreenshot?: { blob: Blob; preview: string } | null
  /** Called after the modal consumes the captured screenshot */
  onScreenshotConsumed?: () => void
}

type BugPriority = 'low' | 'medium' | 'high' | 'critical'

// =====================
// Constants
// =====================

// Shorter labels for mobile
const BUG_CATEGORIES = [
  { value: 'animation', label: 'Animation' },
  { value: 'cards', label: 'Cards' },
  { value: 'chips', label: 'Chips' },
  { value: 'pot', label: 'Pot' },
  { value: 'stack', label: 'Stacks' },
  { value: 'controls', label: 'Controls' },
  { value: 'sound', label: 'Sound' },
  { value: 'layout', label: 'Layout' },
  { value: 'data', label: 'Data' },
  { value: 'other', label: 'Other' },
] as const

const PRIORITIES: { value: BugPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

// =====================
// Component
// =====================

export function ReplayerBugReportModal({
  isOpen,
  onClose,
  debugData,
  handId,
  handUrl,
  reporterEmail,
  reporterName,
  capturedScreenshot,
  onScreenshotConsumed,
}: ReplayerBugReportModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('other')
  const [priority, setPriority] = useState<BugPriority>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pendingScreenshots, setPendingScreenshots] = useState<PendingScreenshot[]>([])
  const [copiedDebug, setCopiedDebug] = useState(false)
  const [showBugHelp, setShowBugHelp] = useState(false)
  const [showDebugData, setShowDebugData] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens + auto-populate captured screenshot
  useEffect(() => {
    logger.debug('[BugModal] isOpen changed to:', isOpen)
    if (isOpen) {
      logger.debug('[BugModal] Resetting form and showing modal')
      setTitle('')
      setDescription('')
      setCategory('other')
      setPriority('medium')
      setError(null)
      setSuccess(false)
      setCopiedDebug(false)
      setShowDebugData(false)
      pendingScreenshots.forEach((ps) => URL.revokeObjectURL(ps.preview))

      // Auto-attach captured screenshot if available
      if (capturedScreenshot?.blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const file = new File(
          [capturedScreenshot.blob],
          `replayer-screenshot-${timestamp}.png`,
          { type: 'image/png' }
        )
        const preview = URL.createObjectURL(file)
        setPendingScreenshots([{ file, preview }])
        logger.debug('[BugModal] Auto-attached captured screenshot:', {
          size: file.size,
          name: file.name,
        })
        // Signal parent to clear its captured state
        onScreenshotConsumed?.()
      } else {
        setPendingScreenshots([])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      pendingScreenshots.forEach((ps) => URL.revokeObjectURL(ps.preview))
    }
  }, [pendingScreenshots])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newScreenshots: PendingScreenshot[] = []
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only PNG, JPEG, GIF, and WebP are allowed.`)
        continue
      }
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`)
        continue
      }
      if (pendingScreenshots.length + newScreenshots.length >= 5) {
        setError('Maximum 5 screenshots allowed.')
        break
      }
      newScreenshots.push({
        file,
        preview: URL.createObjectURL(file),
      })
    }

    if (newScreenshots.length > 0) {
      setPendingScreenshots((prev) => [...prev, ...newScreenshots])
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeScreenshot = (index: number) => {
    setPendingScreenshots((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const copyDebugData = async () => {
    try {
      await navigator.clipboard.writeText(debugData)
      setCopiedDebug(true)
      setTimeout(() => setCopiedDebug(false), 2000)
    } catch {
      console.error('Failed to copy debug data')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Convert pending screenshots to base64
      const screenshots: ScreenshotData[] = []
      logger.debug(`[BugModal] Converting ${pendingScreenshots.length} screenshots to base64...`)
      for (const ps of pendingScreenshots) {
        try {
          const screenshotData = await fileToBase64(ps.file)
          logger.debug(`[BugModal] Converted ${ps.file.name}: ${screenshotData.mimeType}, ${screenshotData.fileSize} bytes, base64 length: ${screenshotData.data.length}`)
          screenshots.push(screenshotData)
        } catch (err) {
          console.error('[BugModal] Failed to convert screenshot:', ps.file.name, err)
          addReplayerBreadcrumb('screenshot_conversion_failed', {
            source: 'bug_report',
            handId,
            details: { fileName: ps.file.name, fileSize: ps.file.size, mimeType: ps.file.type },
          }, 'warning')
        }
      }
      logger.debug(`[BugModal] Successfully converted ${screenshots.length} screenshots`)

      const requestPayload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        debugData,
        handId,
        handUrl,
        reporterEmail,
        reporterName,
        screenshots: screenshots.length > 0 ? screenshots : undefined,
      }
      logger.debug(`[BugModal] Submitting bug report with ${screenshots.length} screenshots...`)

      const result = await apiClient.post('/replayer-bugs', requestPayload)
      logger.debug('[BugModal] API response:', result)

      if (result.success) {
        const responseData = result.data as Record<string, unknown> | undefined
        logger.debug(`[BugModal] Bug submitted successfully. Screenshots uploaded: ${responseData?.screenshotsUploaded || 0}`)
        setSuccess(true)
        // Auto-close after success
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError(result.error || 'Failed to submit bug report')
        captureReplayerError(new Error(result.error || 'Bug report submission failed'), {
          source: 'bug_report',
          handId,
          details: { apiError: result.error, title: title.trim(), category },
        }, 'warning')
      }
    } catch (err) {
      console.error('Failed to submit bug:', err)
      captureReplayerError(err, {
        source: 'bug_report',
        handId,
        details: { title: title.trim(), category, screenshotCount: pendingScreenshots.length },
      })
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  logger.debug('[BugModal] Rendering Dialog with open=', isOpen)

  // Use simple fixed modal instead of Radix Dialog to avoid portal issues in responsive view
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div
        className="relative w-[95vw] max-w-sm max-h-[85vh] overflow-y-auto bg-gray-900 text-white border border-gray-700 rounded-lg p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pb-2">
          <div className="flex items-center gap-2 text-white text-base font-semibold">
            <Bug className="w-4 h-4 text-red-500" />
            Report Bug
          </div>
        </div>

        {success ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-base font-semibold mb-1">Bug Reported!</h3>
            <p className="text-gray-400 text-xs">Thanks for the feedback.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Title */}
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the issue? *"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-9 text-sm"
                required
              />
            </div>

            {/* Category & Priority - Side by side */}
            <div className="grid grid-cols-2 gap-2">
              <select
                id="bug-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 px-2 rounded-md border border-gray-700 bg-gray-800 text-white text-sm focus:ring-2 focus:ring-primary/50"
                aria-label="Category"
              >
                {BUG_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <select
                id="bug-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as BugPriority)}
                className="h-9 px-2 rounded-md border border-gray-700 bg-gray-800 text-white text-sm focus:ring-2 focus:ring-primary/50"
                aria-label="Priority"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs font-medium text-gray-400">
                  Description <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowBugHelp(!showBugHelp)}
                  className="relative w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center hover:bg-blue-600 transition-colors shadow-md"
                  title="How to write a good bug report"
                >
                  ?
                  {!showBugHelp && (
                    <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
                  )}
                </button>
              </div>
              {showBugHelp && (
                <div className="absolute right-0 top-7 z-50 w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                      How to write a good bug report
                    </h4>
                    <button type="button" onClick={() => setShowBugHelp(false)} className="text-gray-500 hover:text-gray-300" title="Close help" aria-label="Close help">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="bg-green-900/30 border border-green-800/50 rounded p-2 mb-2">
                    <p className="font-medium text-green-400 text-[10px] mb-1">Good example:</p>
                    <div className="text-[10px] text-green-300 space-y-1">
                      <p><strong>What happened?</strong><br />Cards show face-down after flop is dealt. Should show community cards.</p>
                      <p><strong>What is expected?</strong><br />Flop cards should be visible face-up on the board.</p>
                      <p><strong>Steps:</strong><br />1. Open hand replay for Hand #45<br />2. Advance to flop street<br />3. Cards remain face-down</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    <p className="font-medium mb-0.5">Tips:</p>
                    <ul className="list-disc pl-3 space-y-0.5">
                      <li>Name the hand number and street</li>
                      <li>Describe what you see vs what you expect</li>
                      <li>Attach a screenshot if possible</li>
                    </ul>
                  </div>
                </div>
              )}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={"What happened?\n\nWhat is expected?\n\nSteps to reproduce:\n1. "}
                className="w-full h-24 px-3 py-2 rounded-md border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 text-sm focus:ring-2 focus:ring-primary/50 resize-none"
                required
              />
            </div>

            {/* Debug Data - Collapsible */}
            <div className="border border-gray-700 rounded-md overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50">
                <button
                  type="button"
                  onClick={() => setShowDebugData(!showDebugData)}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <span>
                    Debug data <span className="text-green-500">✓ captured</span>
                  </span>
                  {showDebugData ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={copyDebugData}
                  className="text-xs text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Copy debug data"
                >
                  {copiedDebug ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              {showDebugData && (
                <div className="px-3 py-2 bg-gray-800/30 text-gray-500 text-xs font-mono max-h-24 overflow-auto">
                  {debugData.slice(0, 300)}...
                </div>
              )}
            </div>

            {/* Screenshots - Compact */}
            <div>
              <label className="flex items-center justify-center gap-2 py-2 border border-dashed border-gray-700 rounded-md cursor-pointer hover:border-gray-600 hover:bg-gray-800/50 transition-colors">
                <Upload className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Add screenshot</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {pendingScreenshots.length > 0 && (
                <div className="flex gap-1 mt-2 overflow-x-auto">
                  {pendingScreenshots.map((ps, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <img
                        src={ps.preview}
                        alt={`Screenshot ${index + 1}`}
                        className="w-10 h-10 object-cover rounded border border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full"
                        aria-label={`Remove screenshot ${index + 1}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2 rounded-md flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span className="line-clamp-2">{error}</span>
              </div>
            )}

            {/* Action Buttons - Full width on mobile */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-9 border-gray-700 text-gray-300 hover:bg-gray-800 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting || !title.trim() || !description.trim()}
                className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ReplayerBugReportModal
