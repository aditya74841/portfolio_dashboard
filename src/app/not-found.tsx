import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { FileQuestion, Home } from "lucide-react";

/**
 * Custom 404 page for the Next.js App Router.
 */
export default function NotFound() {
  return (
    <PageWrapper className="flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-6 text-center max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="size-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <FileQuestion className="size-10" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved to a new location.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="size-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="https://nextjs.org/docs" target="_blank">
              Check Docs
            </Link>
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
