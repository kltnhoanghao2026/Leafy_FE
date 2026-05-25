import { useAuthContext } from "../context/auth-context";

export const useAuth = () => {
  const auth = useAuthContext();

  return {
    ...auth,
    isUser: auth.userAccount?.role === "USER",
  };
};
