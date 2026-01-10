import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <p className="max-w-[500px] text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
