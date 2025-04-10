/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
		FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
		FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
		FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
		FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
		FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
		FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
		FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
		GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
	},
};

export default withSentryConfig(nextConfig, {
	org: "csi-app",
	project: "app-csi-nextjs",
	// Only print logs for uploading source maps in CI
	// Set to `true` to suppress logs
	silent: !process.env.CI,
	// Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,
});
