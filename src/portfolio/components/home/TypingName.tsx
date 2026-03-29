import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export const TypingName = () => {
  const [displayText, setDisplayText] = useState('')
  const suffix = 'arangali'
  
  useEffect(() => {
    let timeoutId: number
    let intervalId: number

    const startTyping = () => {
      setDisplayText('')
      
      // Delay before typing starts
      timeoutId = setTimeout(() => {
        let currentLength = 0
        intervalId = setInterval(() => {
          if (currentLength <= suffix.length) {
            setDisplayText(suffix.slice(0, currentLength))
            currentLength++
          } else {
            clearInterval(intervalId)
            // Wait 5 seconds after fully typed, then restart
            timeoutId = setTimeout(startTyping, 5000)
          }
        }, 120)
      }, 2000)
    }

    startTyping()
    
    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [])

  return (
    <span className="relative inline-block">
      My name is <span className="text-primary">Arun</span>{" "}
      <span className="relative inline-block pb-1">
        <span className="text-primary">N</span>
        <span className="text-accent">{displayText}</span>
        <div 
          className="absolute left-0 bottom-0 w-full h-[4px] opacity-40" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='4' viewBox='0 0 10 4'%3E%3Cpath d='M0 3c2.5 0 2.5-2.5 5-2.5s2.5 2.5 5 2.5' fill='none' stroke='%2334d399' stroke-width='1.2'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: '0 bottom',
          }}
        />
      </span>
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ 
          duration: 0.8, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[10%] bg-accent"
      />
    </span>
  )
}
