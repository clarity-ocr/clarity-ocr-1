// src/types/auth.ts
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: string;
    lastLoginAt?: string;
  }
  
  export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterCredentials {
    name: string;
    email: string;
    password: string;
  }
  
  export interface DocumentHistory {
    id: string;
    userId: string;
    fileName: string;
    uploadedAt: string;
    analysisResult: any;
    fileSize: number;
    fileType: string;
  }