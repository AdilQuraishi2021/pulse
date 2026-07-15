importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js");

const firebaseConfig = Object.fromEntries(new URL(self.location.href).searchParams.entries());

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
	const title = payload.notification?.title || "Pulse";
	const options = {
		body: payload.notification?.body || "You have a new notification",
		icon: "/logo192.png",
		badge: "/logo192.png",
		data: {
			url: payload.fcmOptions?.link || payload.data?.link || "/notifications",
		},
	};

	self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	const url = event.notification.data?.url || "/notifications";
	event.waitUntil(
		clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if ("focus" in client) {
					client.navigate(url);
					return client.focus();
				}
			}

			return clients.openWindow(url);
		}),
	);
});
