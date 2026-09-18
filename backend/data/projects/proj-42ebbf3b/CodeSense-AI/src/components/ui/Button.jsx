import { motion } from "framer-motion";

function Button({
  children,
  onClick,
  className = "",
  disabled = false,
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full
        rounded-xl
        px-4
        py-3
        font-medium
        bg-blue-600
        hover:bg-blue-700
        transition-all
        duration-200
        disabled:opacity-50
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}

export default Button;