const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!issuerDomain) {
  throw new Error("Missing CLERK_JWT_ISSUER_DOMAIN for Convex auth configuration.");
}

try {
  new URL(issuerDomain);
} catch {
  throw new Error(`Invalid CLERK_JWT_ISSUER_DOMAIN: ${issuerDomain}`);
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
