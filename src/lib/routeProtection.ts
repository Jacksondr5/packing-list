export const PUBLIC_ROUTE_PATTERNS = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
] as const;

const publicPathRegexes = [
  /^\/$/,
  /^\/sign-in(.*)$/,
  /^\/sign-up(.*)$/,
];

export function isPublicPathname(pathname: string) {
  return publicPathRegexes.some((regex) => regex.test(pathname));
}
