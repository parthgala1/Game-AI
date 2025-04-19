export interface UserData {
  userId: string;
  userName: string;
  profileImageUrl: string | null;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
}

export interface LoginFormData {
  email: string;
  password: string;
}
