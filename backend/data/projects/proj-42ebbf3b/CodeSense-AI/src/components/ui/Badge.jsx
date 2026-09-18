function Badge({ children, color = "blue" }) {
  const colors = {
    blue: "bg-blue-500/20 text-blue-300",
    green: "bg-green-500/20 text-green-300",
    yellow: "bg-yellow-500/20 text-yellow-300",
    red: "bg-red-500/20 text-red-300",
    purple: "bg-purple-500/20 text-purple-300",
  };

  return (
    <span
      className={`
        px-3
        py-1
        rounded-full
        text-xs
        font-semibold
        ${colors[color]}
      `}
    >
      {children}
    </span>
  );
}

export default Badge;