'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Camera, ArrowLeft, Video, Upload, CheckCircle2, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function IntraOralCapture({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const supabase = createClient()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const startCamera = async () => {
    try {
      // Request video with specific constraints tailored for intra-oral cameras if possible
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' // Some intra-oral cameras might identify as environment cameras
        }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setIsCameraActive(true)
    } catch (err) {
      console.error("Error accessing camera:", err)
      toast.error("Could not access camera. Please check permissions or connect an intra-oral camera.")
    }
  }

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsCameraActive(false)
    }
  }, [stream])

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageUrl = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImages(prev => [imageUrl, ...prev])
        toast.success("Image captured!")
      }
    }
  }

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveToPatient = async () => {
    if (capturedImages.length === 0) return
    setIsUploading(true)

    try {
      for (let i = 0; i < capturedImages.length; i++) {
        const dataUrl = capturedImages[i]
        // Convert base64 to blob
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        
        const fileName = `intraoral_${id}_${Date.now()}_${i}.jpg`
        
        const { error } = await supabase.storage
          .from('scans')
          .upload(fileName, blob, {
            contentType: 'image/jpeg'
          })

        if (error) {
          throw error
        }
        
        // Optionally, save the reference in a `patient_files` or `timeline_events` table
        await supabase.from('timeline_events').insert({
          case_id: null, // Note: might need to adjust DB schema to allow null case_id for general patient notes
          dentist_id: (await supabase.auth.getUser()).data.user?.id,
          status_update: 'Intra-Oral Scan Captured',
          notes: `Image saved to patient records.`,
          visibility: 'INTERNAL'
        })
      }

      toast.success("Successfully uploaded intra-oral scans.")
      setCapturedImages([])
      stopCamera()
      router.push(`/patients/${id}`)
    } catch (err: any) {
      console.error("Upload error:", err)
      toast.error("Failed to upload images. " + (err.message || ""))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-6xl mx-auto w-full animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/patients/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Camera className="w-8 h-8 text-primary" />
            Intra-Oral Camera
          </h2>
          <p className="text-muted-foreground">Capture live intra-oral images directly into the patient's record.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card className="overflow-hidden border-border shadow-sm h-[500px] flex flex-col relative bg-black/95">
            {!isCameraActive ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground h-full relative z-10">
                <Video className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Camera is inactive</h3>
                <p className="text-sm max-w-md text-slate-500 mb-6">
                  Connect your Intra-Oral Camera (USB/Wireless) and start the feed to begin capturing images.
                </p>
                <Button onClick={startCamera} size="lg" className="bg-primary text-primary-foreground">
                  <Video className="w-4 h-4 mr-2" /> Start Live Feed
                </Button>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-contain bg-black z-0"
                />
                
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20">
                  <Button 
                    onClick={captureFrame} 
                    size="lg" 
                    className="rounded-full w-16 h-16 bg-white/20 hover:bg-white/40 border-2 border-white backdrop-blur-sm p-0 flex items-center justify-center shadow-2xl transition-all active:scale-95"
                    title="Capture Frame"
                  >
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                  </Button>
                </div>
                
                <div className="absolute top-4 right-4 z-20">
                  <Button 
                    onClick={stopCamera} 
                    variant="destructive" 
                    size="sm"
                    className="bg-red-500/80 hover:bg-red-600 backdrop-blur-sm"
                  >
                    Stop Feed
                  </Button>
                </div>
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </Card>
        </div>

        <div className="md:col-span-1 space-y-4">
          <Card className="h-full flex flex-col shadow-sm border-border">
            <CardHeader className="pb-3 border-b border-border bg-muted/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Captured Images ({capturedImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              {capturedImages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                  <Camera className="w-8 h-8 opacity-20 mb-3" />
                  <p className="text-sm">No images captured yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {capturedImages.map((src, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-black">
                      <img src={src} alt={`Capture ${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={() => removeImage(idx)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {capturedImages.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/10 mt-auto">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                  onClick={handleSaveToPatient}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Save to Patient Records'}
                  {!isUploading && <Upload className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
