import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/components/backend/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface User {
  uid: string;
  email: string;
  name: string;
  role?: string;
  displayName?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const mockStudentUser: User = {
    uid: "dev-student-456",
    email: "student@dev.com",
    name: "Dev Student",
    displayName: "Dev Student",
    role: "student",
    avatar: ""
  };
  
  const mockTeacherUser: User = {
    uid: "dev-teacher-123",
    email: "teacher@dev.com",
    name: "Dev Teacher",
    displayName: "Dev Teacher",
    role: "teacher",
    avatar: ""
  };
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // DEVELOPMENT MODE: Check URL for role override every time location changes
    console.log("🔄 AuthProvider useEffect - checking URL...", window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const roleOverride = urlParams.get('role');
    
    console.log("📍 URL roleOverride:", roleOverride);
    
    // Use role from URL param if provided, otherwise default to student
    const mockUser = roleOverride === 'teacher' ? mockTeacherUser : mockStudentUser;
    
    const currentRole = roleOverride === 'teacher' ? 'Teacher' : 'Student';
    console.log(`🚀 DEVELOPMENT MODE: Auto-logged in as ${currentRole}`, {
      uid: mockUser.uid,
      role: mockUser.role,
      email: mockUser.email
    });
    
    setUser(mockUser);
    setLoading(false);
    
    // Also listen for popstate events (browser back/forward navigation)
    const handlePopState = () => {
      console.log("🔙 Popstate detected - re-checking role...");
      const newParams = new URLSearchParams(window.location.search);
      const newRoleOverride = newParams.get('role');
      const newMockUser = newRoleOverride === 'teacher' ? mockTeacherUser : mockStudentUser;
      setUser(newMockUser);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    
    // Original auth code (commented out for development)
    /*
    // If firebase wasn't initialized, skip auth listener to avoid runtime errors
    if (!auth || !db) {
      console.warn("Firebase not initialized — skipping auth listener in AuthProvider");
      setLoading(false);
      setUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "Users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: userData.firstName + " " + userData.lastName,
              displayName: userData.firstName + " " + userData.lastName,
              role: userData.role || "student",
              avatar: userData.photo || ""
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.email?.split("@")[0] || "User",
              displayName: firebaseUser.email?.split("@")[0] || "User",
              role: "student"
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    */
  }, [window.location.search]); // Re-run when URL search params change

  const login = async (email: string, password: string): Promise<boolean> => {
    // Login is handled by Firebase Auth in login.js component
    // This is just for the interface compatibility
    return true;
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
