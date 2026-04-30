import { motion } from 'framer-motion';
import { FiMessageCircle } from 'react-icons/fi';

export default function ChatFAB({ onClick }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
    >
      <motion.div 
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="bg-white text-saffron text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-saffron/20"
      >
        Ask VOTE-पथ AI 👋
      </motion.div>
      
      <div className="relative group">
        <div className="absolute inset-0 bg-saffron rounded-full animate-ping opacity-30 group-hover:opacity-0 transition-opacity duration-300"></div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClick}
          aria-label="Open AI Assistant"
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-saffron to-orange-500 shadow-xl flex items-center justify-center shadow-saffron/40 cursor-pointer border-2 border-white"
          id="chatbot-fab"
        >
          <FiMessageCircle className="w-6 h-6 text-white" aria-hidden="true" />
        </motion.button>
      </div>
    </motion.div>
  );
}
