import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useMenu } from '../contexts/MenuContext'

// Shortcut link configuration
interface InternalShortcut {
  label: string
  to: string
  search?: Record<string, unknown>
  external: false
}

interface ExternalShortcut {
  label: string
  href: string
  external: true
}

type Shortcut = InternalShortcut | ExternalShortcut

const shortcuts: Shortcut[] = [
  {
    label: 'Ranking',
    to: '/rankings',
    search: undefined,
    external: false,
  },
  {
    label: 'Teams',
    to: '/', // For now, navigate to home - can be changed to /teams later
    search: { date: undefined },
    external: false,
  },
  {
    label: 'Official Page',
    href: 'https://www.swissunihockey.ch',
    external: true,
  },
]

// Animation variants for staggered reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2, // Delay after search input appears
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1, // Reverse order for exit
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
}

interface ShortcutLinksProps {
  className?: string
}

export default function ShortcutLinks({ className = '' }: ShortcutLinksProps) {
  const { closeMenu } = useMenu()

  const handleLinkClick = () => {
    closeMenu()
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col gap-3 ${className}`}
    >
      <motion.h3
        variants={itemVariants}
        className="text-sm font-medium text-gray-700 mb-1"
      >
        Quick Navigation
      </motion.h3>

      <div className="flex flex-col gap-2">
        {shortcuts.map((shortcut) => {
          if (shortcut.external) {
            return (
              <motion.div key={shortcut.label} variants={itemVariants}>
                <motion.a
                  href={(shortcut as ExternalShortcut).href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="block bg-white/60 backdrop-blur-sm border border-gray-100 rounded-lg p-3 hover:bg-white/80 transition-colors duration-200 w-fit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-medium text-gray-900">{shortcut.label}</div>
                </motion.a>
              </motion.div>
            )
          }

          return (
            <motion.div key={shortcut.label} variants={itemVariants}>
              <Link
                to={(shortcut as InternalShortcut).to}
                search={(shortcut as InternalShortcut).search}
                onClick={handleLinkClick}
                className="block bg-white/60 backdrop-blur-sm border border-gray-100 rounded-lg p-3 hover:bg-white/80 transition-colors duration-200 w-fit"
              >
                <div className="font-medium text-gray-900">{shortcut.label}</div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}