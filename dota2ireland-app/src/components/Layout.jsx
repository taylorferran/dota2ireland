import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-10 md:px-20 lg:px-40 flex flex-1 justify-center py-2">
          <div className="layout-content-container flex flex-col w-full max-w-[1100px] flex-1">
            <Header />
            <Outlet />
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;

