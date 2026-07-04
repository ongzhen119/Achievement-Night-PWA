import { Link } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";

export default function AppHeader() {
  return (
    <header className="app-header">
      <Link className="brand-lockup" to="/">
        <span className="brand-mark" aria-label="Aexern logo placeholder">
          A
        </span>
        <span>
          <strong>Aexern</strong>
          <small>Underworlds Companion</small>
        </span>
      </Link>
      <LanguageToggle />
    </header>
  );
}
