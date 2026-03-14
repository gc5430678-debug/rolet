import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSelectedFrame, setSelectedFrame, type FrameId } from "../../utils/frameStorage";

type DecorationsContextType = {
  selectedFrame: FrameId;
  setSelectedFrame: (id: FrameId) => Promise<void>;
  refreshFrame: () => Promise<void>;
};

const DecorationsContext = createContext<DecorationsContextType | null>(null);

export function DecorationsProvider({ children }: { children: React.ReactNode }) {
  const [selectedFrame, setSelectedFrameState] = useState<FrameId>("none");

  const refreshFrame = useCallback(async () => {
    const f = await getSelectedFrame();
    setSelectedFrameState(f);
  }, []);

  useEffect(() => {
    refreshFrame();
  }, [refreshFrame]);

  const setFrame = useCallback(async (id: FrameId) => {
    await setSelectedFrame(id);
    setSelectedFrameState(id);
  }, []);

  return (
    <DecorationsContext.Provider value={{ selectedFrame, setSelectedFrame: setFrame, refreshFrame }}>
      {children}
    </DecorationsContext.Provider>
  );
}

export function useDecorations() {
  const ctx = useContext(DecorationsContext);
  return ctx ?? { selectedFrame: "none" as FrameId, setSelectedFrame: async () => {}, refreshFrame: async () => {} };
}

export default function _() { return null; }
