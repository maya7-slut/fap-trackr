import React, { createContext, useContext, useState, ReactNode } from 'react';

type CursorVariant = 'default' | 'hot';

interface CursorContextType {
  variant: CursorVariant;
  setVariant: (v: CursorVariant) => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) throw new Error('useCursor must be used within a CursorProvider');
  return context;
};

export const CursorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [variant, setVariant] = useState<CursorVariant>('default');

  return (
    <CursorContext.Provider value={{ variant, setVariant }}>
      {children}
    </CursorContext.Provider>
  );
};