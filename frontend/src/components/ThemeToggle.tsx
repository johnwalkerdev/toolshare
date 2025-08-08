import { useDarkMode } from '@/hooks/useDarkMode';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <motion.button
      onClick={toggle}
      className={`
        relative w-16 h-8 rounded-full p-1 transition-all duration-500
        ${isDark 
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/25' 
          : 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg shadow-yellow-500/25'
        }
        hover:scale-105 active:scale-95 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        glass glow-hover
      `}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        className={`
          w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center
          transition-all duration-500 transform
          ${isDark ? 'translate-x-8' : 'translate-x-0'}
        `}
        layout
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 30
        }}
      >
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : 180,
          }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          {/* Moon Icon */}
          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? 180 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          {/* Sun Icon */}
          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
              clipRule="evenodd" 
            />
          </svg>
        </motion.div>
      </motion.div>
      
      {/* Ambient light effects */}
      {isDark && (
        <div className="absolute inset-0 rounded-full opacity-30">
          <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1 left-3 w-1 h-1 bg-white rounded-full animate-pulse delay-500"></div>
        </div>
      )}
    </motion.button>
  );
}