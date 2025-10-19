import { useToast as useToastContext } from "../contexts/ToastContext";

/**
 * Custom hook to access the toast notification system
 *
 * @example
 * const toast = useToast();
 * toast.success("Operation completed successfully!");
 * toast.error("An error occurred", "Error", 5000);
 */
export const useToast = () => {
  return useToastContext();
};

export default useToast;
