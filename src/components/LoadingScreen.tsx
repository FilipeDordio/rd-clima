import Lottie from 'lottie-react'
import loadingAnimation from '../assets/rd_clima_logo_loading.json'

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Lottie animationData={loadingAnimation} loop className="h-64 w-64" />
    </div>
  )
}
