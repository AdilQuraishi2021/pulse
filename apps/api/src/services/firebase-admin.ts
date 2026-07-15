import * as admin from "firebase-admin";

let firebaseApp: admin.app.App | null = null;

function getServiceAccount() {
	if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
		return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
	}

	const projectId = process.env.FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

	if (!projectId || !clientEmail || !privateKey) {
		return null;
	}

	return {
		projectId,
		clientEmail,
		privateKey,
	};
}

export function getFirebaseMessaging(): admin.messaging.Messaging | null {
	if (firebaseApp) {
		return admin.messaging(firebaseApp);
	}

	const serviceAccount = getServiceAccount();
	if (!serviceAccount) {
		return null;
	}

	firebaseApp = admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});

	return admin.messaging(firebaseApp);
}
