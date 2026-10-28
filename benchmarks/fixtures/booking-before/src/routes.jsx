import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Services from "./pages/Services.jsx";
import ServiceDetail from "./pages/ServiceDetail.jsx";
import Book from "./pages/Book.jsx";
import Confirmation from "./pages/Confirmation.jsx";
import Contact from "./pages/Contact.jsx";
import About from "./pages/About.jsx";
import NotFound from "./pages/NotFound.jsx";

export const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "services", element: <Services /> },
      { path: "services/:id", element: <ServiceDetail /> },
      { path: "book", element: <Book /> },
      { path: "confirmation", element: <Confirmation /> },
      { path: "contact", element: <Contact /> },
      { path: "about", element: <About /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];
