/**
 * Fonts that are considered "pre-installed" — already available on the OS or as
 * ubiquitous web defaults. These are excluded from the Discover list so you only
 * see fonts worth curating. Edit this list to match your platform.
 */
export interface ExcludedFont {
  name: string;
  reason: string;
}

export const EXCLUDED_FONTS: ExcludedFont[] = [
  // Core system fonts (cross-platform)
  { name: "Arial", reason: "System font (Windows/macOS)" },
  { name: "Arial Black", reason: "System font (Windows/macOS)" },
  { name: "Helvetica", reason: "System font (macOS)" },
  { name: "Helvetica Neue", reason: "System font (macOS)" },
  { name: "Times New Roman", reason: "System font (Windows/macOS)" },
  { name: "Times", reason: "System font (Unix/macOS)" },
  { name: "Courier New", reason: "System font (Windows/macOS)" },
  { name: "Courier", reason: "System font (Unix/macOS)" },
  { name: "Georgia", reason: "System font (Windows/macOS)" },
  { name: "Verdana", reason: "System font (Windows/macOS)" },
  { name: "Tahoma", reason: "System font (Windows)" },
  { name: "Trebuchet MS", reason: "System font (Windows)" },
  { name: "Comic Sans MS", reason: "System font (Windows)" },
  { name: "Impact", reason: "System font (Windows/macOS)" },
  { name: "Geneva", reason: "System font (macOS)" },
  { name: "Menlo", reason: "System font (macOS)" },
  { name: "Monaco", reason: "System font (macOS)" },
  { name: "San Francisco", reason: "System font (macOS)" },
  { name: "Segoe UI", reason: "System font (Windows)" },
  { name: "Calibri", reason: "System font (Windows)" },
  { name: "Cambria", reason: "System font (Windows)" },
  { name: "Consolas", reason: "System font (Windows)" },
  { name: "DejaVu Sans", reason: "System font (Linux)" },
  { name: "DejaVu Serif", reason: "System font (Linux)" },
  { name: "Liberation Sans", reason: "System font (Linux)" },
  { name: "Liberation Serif", reason: "System font (Linux)" },
  { name: "Noto Sans", reason: "System font (Android/Linux)" },
  { name: "Noto Serif", reason: "System font (Android/Linux)" },
  { name: "Roboto", reason: "System font (Android)" },
  { name: "Roboto Mono", reason: "System font (Android)" },
  { name: "Roboto Condensed", reason: "System font (Android)" },
  { name: "Droid Sans", reason: "System font (Android)" },
  { name: "Ubuntu", reason: "System font (Ubuntu)" },
  { name: "Cantarell", reason: "System font (GNOME)" },
  // Ubiquitous web-defaults everyone already has
  { name: "Inter", reason: "Ubiquitous web default" },
  { name: "Open Sans", reason: "Ubiquitous web default" },
  { name: "Lato", reason: "Ubiquitous web default" },
  { name: "Source Sans Pro", reason: "Ubiquitous web default" },
  { name: "Source Serif Pro", reason: "Ubiquitous web default" },
  { name: "PT Sans", reason: "Ubiquitous web default" },
  { name: "Montserrat", reason: "Ubiquitous web default" },
  { name: "Raleway", reason: "Ubiquitous web default" },
  { name: "Oswald", reason: "Ubiquitous web default" },
  { name: "Slabo 27px", reason: "Ubiquitous web default" },
  { name: "Merriweather", reason: "Ubiquitous web default" },
  { name: "Nunito", reason: "Ubiquitous web default" },
  { name: "Work Sans", reason: "Ubiquitous web default" },
  { name: "Poppins", reason: "Ubiquitous web default" },
];

/** Case-insensitive lookup set for fast exclusion checks. */
export const EXCLUDED_FONT_NAMES = new Set(
  EXCLUDED_FONTS.map((f) => f.name.toLowerCase()),
);
