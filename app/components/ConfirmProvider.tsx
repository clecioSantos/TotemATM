"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import ConfirmModal from "./ConfirmModal";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmContextType {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string, confirmLabel?: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({} as ConfirmContextType);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "alert" | "confirm";
    confirmLabel: string;
    cancelLabel: string;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    title: "",
    message: "",
    variant: "alert",
    confirmLabel: "OK",
    cancelLabel: "Cancelar",
    resolve: null,
  });

  const showAlert = useCallback(async (message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      setState({
        open: true,
        title: title || "Aviso",
        message,
        variant: "alert",
        confirmLabel: "OK",
        cancelLabel: "Cancelar",
        resolve: () => { setState(s => ({ ...s, open: false })); resolve(); },
      });
    });
  }, []);

  const showConfirm = useCallback(async (message: string, title?: string, confirmLabel?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: title || "Confirmação",
        message,
        variant: "confirm",
        confirmLabel: confirmLabel || "Confirmar",
        cancelLabel: "Cancelar",
        resolve: (value: boolean) => { setState(s => ({ ...s, open: false })); resolve(value); },
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
  }, [state.resolve]);

  return (
    <ConfirmContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <ConfirmModal
        open={state.open}
        title={state.title}
        message={state.message}
        variant={state.variant}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        onConfirm={handleConfirm}
        onCancel={state.variant === "alert" ? undefined : handleCancel}
      />
    </ConfirmContext.Provider>
  );
}
