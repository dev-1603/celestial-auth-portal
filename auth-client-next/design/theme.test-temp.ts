/**
 * Temp test file for design/theme.ts (Step 2).
 * Delete after confirming.
 */
import { buildTheme, getCssVars } from "@/design/theme";

// Test 1: buildTheme() with no args — log output shape
const defaultTheme = buildTheme();
console.log("buildTheme() shape:", JSON.stringify(defaultTheme, null, 2));

// Test 2: buildTheme({ primaryColor: "#FF0000" }) — confirm --primary = #FF0000
const redTheme = buildTheme({ primaryColor: "#FF0000" });
const cssVars = getCssVars(redTheme);
console.log("getCssVars(theme) --primary:", cssVars["--primary"]);
console.log("Expected #FF0000, got:", cssVars["--primary"], cssVars["--primary"] === "#FF0000" ? "PASS" : "FAIL");
