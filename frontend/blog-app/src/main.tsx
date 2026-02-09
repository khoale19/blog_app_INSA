import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"

// Initialize theme on load
const storedTheme = localStorage.getItem("theme") || "system"
let initialTheme: "light" | "dark" = "light"

if (storedTheme === "system") {
  initialTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
} else {
  initialTheme = storedTheme as "light" | "dark"
}

document.documentElement.setAttribute("data-theme", initialTheme)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
