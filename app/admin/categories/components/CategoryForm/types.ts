import { Category } from "../../types";

export interface CategoryFormProps {
  initialData?: Category | null;
  onSubmit: (data: Partial<Category>) => Promise<void>;
}
