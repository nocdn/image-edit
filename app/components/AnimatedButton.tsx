import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

export function AnimatedCircularButton({
  children,
  secondaryChildren,
  className,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode
  secondaryChildren?: React.ReactNode
  className?: string
  onClick?: () => void
  ariaLabel: string
}) {
  const [isShowingSecondary, setIsShowingSecondary] = useState(false)

  return (
    <motion.button
      tabIndex={0}
      aria-label={ariaLabel}
      className={cn(
        "group flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-200 dark:hover:bg-gray-300",
        className
      )}
      onClick={() => {
        setIsShowingSecondary(!isShowingSecondary)
        onClick?.()
        setTimeout(() => {
          setIsShowingSecondary(false)
        }, 1000)
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {isShowingSecondary ? (
          <motion.div
            key="secondary"
            initial={{ opacity: 0, scale: 0.2, filter: "blur(2px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.2, filter: "blur(2px)" }}
          >
            {secondaryChildren}
          </motion.div>
        ) : (
          <motion.div
            key="primary"
            initial={{ opacity: 0, scale: 0.2, filter: "blur(2px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.2, filter: "blur(2px)" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
