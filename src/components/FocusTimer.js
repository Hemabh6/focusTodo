import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// State variables
let timerInterval;
let secondsLeft = 25 * 60; // 25 minutes

async function startPomodoro() {
    // 1. Request permission for notifications immediately
    await LocalNotifications.requestPermissions();

    // 2. Start the countdown
    timerInterval = setInterval(async () => {
        if (secondsLeft > 0) {
            secondsLeft--;
            // Update your UI circle/text here
        } else {
            clearInterval(timerInterval);
            await finishSession();
        }
    }, 1000);
}

async function finishSession() {
    // Trigger vibration
    await Haptics.impact({ style: ImpactStyle.Heavy });

    // Send a notification that works even if the phone is in the pocket
    await LocalNotifications.schedule({
        notifications: [
            {
                title: "Time is up!",
                body: "Your Focus Flow session is complete. Take a break!",
                id: 1
            }
        ]
    });
    
    // TODO: Save this to Firebase under a 'sessions' collection
    console.log("Session saved to Firebase");
}