import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const roleForPrefix: Record<string, string> = {
  "/dashboard/owner": "ADMIN",
  "/dashboard/driver": "DRIVER",
  "/dashboard/employee": "EMPLOYEE",
  "/dashboard/customer": "CUSTOMER"
};

const homeForRole: Record<string, string> = {
  ADMIN: "/dashboard/owner",
  DRIVER: "/dashboard/driver",
  EMPLOYEE: "/dashboard/employee",
  CUSTOMER: "/dashboard/customer"
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as { role?: string } | null;
    const path = req.nextUrl.pathname;

    for (const [prefix, requiredRole] of Object.entries(roleForPrefix)) {
      if (path.startsWith(prefix) && token?.role !== requiredRole) {
        const fallback = homeForRole[token?.role ?? ""] ?? "/dashboard/customer";
        return NextResponse.redirect(new URL(fallback, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: "/login"
    }
  }
);

export const config = {
  matcher: ["/dashboard/:path*"]
};
