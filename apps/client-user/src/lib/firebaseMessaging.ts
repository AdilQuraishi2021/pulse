const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

type FirebaseAppModule = typeof import("firebase/app");
type FirebaseMessagingModule = typeof import("firebase/messaging");
type FirebaseApp = Awaited<ReturnType<FirebaseAppModule["initializeApp"]>>;
type Messaging = ReturnType<FirebaseMessagingModule["getMessaging"]>;

let firebaseApp: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

export function hasFirebaseMessagingConfig() {
	return Boolean(
		firebaseConfig.apiKey &&
			firebaseConfig.projectId &&
			firebaseConfig.messagingSenderId &&
			firebaseConfig.appId &&
			import.meta.env.VITE_FIREBASE_VAPID_KEY,
	);
}

export async function canUseFirebaseMessaging() {
	return (
		typeof window !== "undefined" &&
		"Notification" in window &&
		"serviceWorker" in navigator &&
		hasFirebaseMessagingConfig() &&
		(await getFirebaseMessagingModule().then((module) => module.isSupported()))
	);
}

export async function getPushNotificationToken() {
	if (!(await canUseFirebaseMessaging())) {
		return null;
	}

	const permission = await Notification.requestPermission();
	if (permission !== "granted") {
		return null;
	}

	const { getToken } = await getFirebaseMessagingModule();
	const messaging = await getFirebaseMessaging();
	const serviceWorkerRegistration = await registerFirebaseMessagingWorker();

	return getToken(messaging, {
		vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
		serviceWorkerRegistration,
	});
}

export async function removePushNotificationToken() {
	if (!(await canUseFirebaseMessaging())) {
		return false;
	}

	const { deleteToken } = await getFirebaseMessagingModule();
	return deleteToken(await getFirebaseMessaging());
}

async function getFirebaseMessaging() {
	if (!firebaseApp) {
		const { initializeApp } = await import("firebase/app");
		firebaseApp = initializeApp(firebaseConfig);
	}

	if (!messagingInstance) {
		const { getMessaging } = await getFirebaseMessagingModule();
		messagingInstance = getMessaging(firebaseApp);
	}

	return messagingInstance;
}

function getFirebaseMessagingModule() {
	return import("firebase/messaging");
}

function registerFirebaseMessagingWorker() {
	const searchParams = new URLSearchParams({
		apiKey: firebaseConfig.apiKey,
		authDomain: firebaseConfig.authDomain || "",
		projectId: firebaseConfig.projectId,
		storageBucket: firebaseConfig.storageBucket || "",
		messagingSenderId: firebaseConfig.messagingSenderId,
		appId: firebaseConfig.appId,
	});

	return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${searchParams.toString()}`);
}
