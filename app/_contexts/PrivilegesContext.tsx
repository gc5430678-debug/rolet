import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getHideWealthMagic, setHideWealthMagic } from "../../utils/privilegesStorage";

type PrivilegesContextType = {
  hideWealthMagic: boolean;
  setHideWealthMagic: (value: boolean) => Promise<void>;
};

const PrivilegesContext = createContext<PrivilegesContextType | null>(null);

export function PrivilegesProvider({ children }: { children: React.ReactNode }) {
  const [hideWealthMagic, setHideWealthMagicState] = useState(false);

  useEffect(() => {
    getHideWealthMagic().then(setHideWealthMagicState);
  }, []);

  const setHide = useCallback(async (value: boolean) => {
    await setHideWealthMagic(value);
    setHideWealthMagicState(value);
  }, []);

  return (
    <PrivilegesContext.Provider value={{ hideWealthMagic, setHideWealthMagic: setHide }}>
      {children}
    </PrivilegesContext.Provider>
  );
}

export function usePrivileges() {
  const ctx = useContext(PrivilegesContext);
  if (!ctx) return { hideWealthMagic: false, setHideWealthMagic: async () => {} };
  return ctx;
}

export default function _() { return null; }
