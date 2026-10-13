import { Outlet } from "react-router";
import { Header } from "./components/header";

export const MainLayout = () => {
  return (
    <div>
      <Header />
{/* <h1>Welcome to your Application Tracker dashboard</h1>÷ */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};