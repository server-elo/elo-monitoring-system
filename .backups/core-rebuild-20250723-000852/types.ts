export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
}
