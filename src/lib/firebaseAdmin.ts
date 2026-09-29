import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let adminAuthInstance: ReturnType<typeof getAuth> | undefined;

function getAdminAuth() {
  if (adminAuthInstance) {
    return adminAuthInstance;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin env variables are missing. Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel."
    );
  }

  const adminApp: App = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });

  adminAuthInstance = getAuth(adminApp);
  return adminAuthInstance;
}

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, property, receiver) {
    return Reflect.get(getAdminAuth(), property, receiver);
  },
});
