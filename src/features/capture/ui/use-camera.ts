// Live-Kamera über getUserMedia (#61, 01_FOTO_ERKENNUNG „Live-Kamera“). Ohne Kamera, ohne
// Erlaubnis oder ohne sicheren Kontext (http im LAN) bleibt `status` nicht `live`, und die Ansicht
// bietet die Dateiauswahl des Geräts an (`capture="environment"` öffnet dort die Kamera-App).
// Der Strom endet, sobald die Ansicht geht. Ein Bild entsteht aus dem aktuellen Videobild.
import { useEffect, useRef, useState } from 'react'

export type CameraStatus = 'starting' | 'live' | 'denied' | 'unavailable'

const JPEG_QUALITY = 0.9

function errorStatus(error: unknown): CameraStatus {
  return error instanceof DOMException && error.name === 'NotAllowedError'
    ? 'denied'
    : 'unavailable'
}

async function openStream(): Promise<MediaStream> {
  // Ohne mediaDevices (unsicherer Kontext, alter Browser) wirft das wie eine fehlende Kamera.
  if (!('mediaDevices' in navigator)) {
    throw new Error('Keine Kamera-Schnittstelle')
  }
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  })
}

function stopStream(stream: MediaStream) {
  for (const track of stream.getTracks()) track.stop()
}

function frameToBlob(video: HTMLVideoElement): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')?.drawImage(video, 0, 0)
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  })
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<CameraStatus>('starting')

  useEffect(() => {
    let stream: MediaStream | null = null
    let isActive = true
    openStream()
      .then(async (opened) => {
        stream = opened
        // Schon geschlossen, bevor die Kamera bereit war: den Strom gleich wieder beenden.
        if (!isActive) {
          stopStream(opened)
          return
        }
        const video = videoRef.current
        if (video === null) return
        video.srcObject = opened
        await video.play()
        setStatus('live')
      })
      .catch((error: unknown) => {
        // Auch wenn erst play() scheitert: Ohne Bild soll die Kamera nicht weiter an sein.
        if (stream !== null) stopStream(stream)
        if (isActive) setStatus(errorStatus(error))
      })
    return () => {
      isActive = false
      if (stream !== null) stopStream(stream)
    }
  }, [])

  async function capture(): Promise<Blob | null> {
    const video = videoRef.current
    if (status !== 'live' || video === null || video.videoWidth === 0) return null
    return frameToBlob(video)
  }

  return { videoRef, status, capture }
}
