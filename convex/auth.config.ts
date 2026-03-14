const issuerDomain = process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL;

if (!issuerDomain) {
  throw new Error(
    "Missing NEXT_PUBLIC_CLERK_FRONTEND_API_URL for Convex auth configuration.",
  );
}

try {
  new URL(issuerDomain);
} catch {
  throw new Error(`Invalid NEXT_PUBLIC_CLERK_FRONTEND_API_URL: ${issuerDomain}`);
}

const authConfig = {
  providers: [
    {
      domain: issuerDomain,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
