export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/:path*",
    "/my-jobs/:path*",
    "/resume/:path*",
    "/analytics/:path*",
    "/alerts/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/contact/:path*",
    "/admin/:path*",
  ],
};
