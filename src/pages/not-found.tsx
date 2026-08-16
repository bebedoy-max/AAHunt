import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500">
      <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2 font-mono">404_NOT_FOUND</h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md">
        The requested sector does not exist in the current grid. The path may have been relocated or purged.
      </p>
      <Button asChild size="lg" className="font-mono">
        <Link to="/">RETURN_TO_BASE</Link>
      </Button>
    </div>
  );
}
