"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

function FloorLiveLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 -3.94273e-08 37.3152 40.0001" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path
          d="M7.61231 2.51117C11.0411 0.608938 14.9539-0.243472 18.8633 0.0599978C22.7725 0.36348 26.5065 1.80971 29.6006 4.2182C32.6947 6.62679 35.0123 9.89252 36.2656 13.6078C37.5189 17.3231 37.6532 21.3251 36.6504 25.1157L36.4492 25.8217C35.382 29.3294 33.3695 32.4818 30.626 34.9282L30.0684 35.4067C27.2441 37.7446 23.8271 39.2642 20.1895 39.7924L19.4609 39.8852C16.9985 40.1509 14.5167 39.9537 12.1396 39.3168L15.5547 35.9018C16.8984 36.0505 18.2624 36.0307 19.6143 35.8344C22.7186 35.3837 25.6225 34.0304 27.9639 31.9428C30.3051 29.8552 31.9809 27.1246 32.7832 24.0922C33.5352 21.2493 33.4883 18.2576 32.6533 15.4457L32.4756 14.8862C31.4729 11.914 29.6188 9.3013 27.1436 7.37445C24.8231 5.56821 22.0526 4.43916 19.1387 4.10492L18.5537 4.04828C15.4262 3.8055 12.2958 4.48744 9.55274 6.00922C7.72572 7.02288 6.12614 8.38137 4.83203 9.99652L0 9.99652C1.81043 6.86285 4.43818 4.27217 7.61231 2.51117Z"
          fill="#3754fa"
        />
        <path
          d="M10.7148 7.65111C13.0193 6.41944 15.6231 5.85814 18.2305 6.02904C20.8378 6.20001 23.3458 7.09692 25.4697 8.61888C27.5933 10.1408 29.2491 12.2267 30.249 14.6404C31.2489 17.0543 31.5525 19.7011 31.127 22.279C30.7012 24.8568 29.5625 27.2648 27.8398 29.2292C26.117 31.1936 23.8783 32.6368 21.3779 33.3952L20.9072 33.53C19.7779 33.8299 18.6198 33.983 17.46 33.9949L24.1904 27.2654C24.4152 27.0527 24.6318 26.8303 24.8369 26.5964C26.0682 25.1925 26.8822 23.4711 27.1865 21.6286C27.4907 19.7862 27.2732 17.8949 26.5586 16.1697C25.844 14.4444 24.6605 12.9537 23.1426 11.866L22.8555 11.6667C21.401 10.6995 19.7158 10.129 17.9688 10.0144L17.6201 9.99681C17.4642 9.99205 17.3079 9.99233 17.1523 9.99486L7.52148 9.99486C8.46529 9.07093 9.53888 8.2797 10.7148 7.65111Z"
          fill="#3754fa"
        />
        <path
          d="M8.51035 31.6533C8.07705 32.087 8.13696 32.8067 8.63603 33.1628C9.03055 33.4442 9.57071 33.399 9.91352 33.0565L20.1355 22.8345C21.7017 21.2683 21.7017 18.7287 20.1355 17.1625C19.3834 16.4105 18.363 15.9879 17.2995 15.9879L6.12516 15.9879C5.67868 15.9879 5.28509 16.2825 5.1591 16.7108C4.96986 17.3551 5.45293 18.0003 6.12447 18.0008L16.7236 18.0097C18.7273 18.0107 19.7303 20.4333 18.3132 21.8505L8.51035 31.6533ZM12.7419 35.8849C11.0169 37.6096 8.29801 37.8356 6.31238 36.4187C3.80079 34.6263 3.50035 31.0068 5.68192 28.8249L12.5003 22.0065L6.1224 22.001C2.78136 21.9989 0.379077 18.7871 1.32181 15.5818C1.94848 13.4512 3.90426 11.9883 6.12516 11.9883L17.2995 11.9883C19.4239 11.9883 21.4617 12.8319 22.9639 14.334C26.0922 17.4624 26.0922 22.5346 22.9639 25.6629L12.7419 35.8849Z"
          fill="#3754fa"
        />
      </g>
    </svg>
  )
}

export function MainHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const isDetailPage = pathname !== "/"

  const handleBack = () => {
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {isDetailPage && (
              <motion.button
                key="main-back-button"
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  duration: 0.3,
                }}
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </motion.button>
            )}
          </AnimatePresence>

          <Link href="/" className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} layoutId="app-logo">
              <FloorLiveLogo className="w-8 h-8" />
            </motion.div>
            <motion.span className="font-semibold text-gray-900" layoutId="app-title">
              FloorLive
            </motion.span>
          </Link>
        </div>

        <motion.div
          className="text-sm text-gray-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          Live
        </motion.div>
      </div>
    </header>
  )
}
