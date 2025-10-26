import { motion } from "motion/react";
import { useState } from "react";

interface DropZoneProps {
  children: React.ReactNode;
  onClick: () => void;
  onDropped: (file: File) => void;
  stage: string;
  className?: string;
}

export default function DropZone({
  children,
  onClick,
  onDropped,
  stage,
  className,
  ...props
}: DropZoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  return (
    <motion.div
      className={`font-jetbrains-mono ${className} ${
        stage === "done" || stage === "attached"
          ? "cursor-text"
          : "cursor-pointer"
      } px-3 py-1 bg-white`}
      layout
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
      style={{
        display: "inline-flex",
        justifyContent: "center",
        backgroundColor: "white",
        color: "black",
        border: "none",
        borderRadius: "14px",
        cursor: stage === "done" ? "text" : "pointer",
        overflow: "visible",
        outline: isDraggingOver
          ? `1px dashed blue`
          : stage === "attached" || stage === "processing"
          ? "none"
          : `1px dashed lightgray`,
        maxHeight: "40rem",
      }}
      whileHover={{ scale: stage === "done" || "attached" ? 1 : 1.02 }}
      whileTap={{ scale: stage === "done" || "attached" ? 1 : 0.98 }}
      onClick={() => {
        onClick();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDraggingOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files[0];
        setIsDraggingOver(false);
        onDropped(droppedFile);
      }}
      {...props}
    >
      <div className="relative">{children}</div>
    </motion.div>
  );
}
