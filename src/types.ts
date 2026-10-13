// Union type
export type Stage =
  | "wishlist"
  | "applied"
  | "interview"
  | "offer"
  | "closed";

// Interface
export interface Application {
  id: string;
  company: string;
  role: string;
  link?: string;
  dateSent: string;
  stage: Stage;
  notes?: string;
  createdAt: string;
}