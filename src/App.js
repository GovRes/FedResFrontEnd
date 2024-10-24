import React, { Fragment } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Home from "./Home";
import GlobalStyle from "./styles/globalStyles";

import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

const AppLayout = () => {
  return (
    <>
      <main>
        <Header />
        <Outlet />
        <Footer />
      </main>
    </>
  );
};

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
        // errorElement: <Error404 />,
      },
      // {
      //   path: "/about",
      //   element: <About />,
      // },
    ],
  },
]);
function App() {
  return (
    <Fragment>
      <GlobalStyle />
      <div className="App">
        <RouterProvider router={router} />
      </div>
    </Fragment>
  );
}

export default App;
