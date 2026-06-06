import { initializeApplication } from "./src/lib/startup";

export async function register(): Promise<void> {
  initializeApplication();
}
