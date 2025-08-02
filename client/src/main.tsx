import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Service worker disabled to prevent MIME type issues in development

createRoot(document.getElementById("root")!).render(<App />);
