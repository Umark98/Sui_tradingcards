// components/Button.tsx
import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset"; // Add type prop for better TypeScript support
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className, type = "button" }) => {
  return (
    <button
      type={type} 
      onClick={onClick}
      className={`bg-gray-700 text-white rounded hover:bg-gray-600 transition ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;