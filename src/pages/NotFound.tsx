import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDocumentHead } from "@/hooks/useDocumentHead";

const NotFound = () => {
  const location = useLocation();

  useDocumentHead({
    title: "Page Not Found (404) | Mayura Garden Services",
    description: "The page you requested could not be found. Return to the Mayura Garden Services homepage.",
    noindex: true,
  });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </main>
  );
};

export default NotFound;
