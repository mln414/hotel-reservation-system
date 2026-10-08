import { Outlet, useLocation } from "react-router";
import Navbar from "./components/Navbar/Navbar.jsx";
import Footer from "./components/Footer/Footer.jsx";
import "./App.css";

function App() {
  const { pathname } = useLocation();
  const mainClassName = pathname === "/"
    ? "main-content main-content--home"
    : "main-content";

  return (
    <div className="app-shell">
      <Navbar />
      <main className={mainClassName}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
