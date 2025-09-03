
import React from 'react';

interface AlertProps {
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ message }) => {
  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
      <p className="font-bold">错误</p>
      <p>{message}</p>
    </div>
  );
};
