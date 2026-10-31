import { ScheduleBlock, Category } from '../types';
import { timeToMinutes } from './time';

let swRegistration: ServiceWorkerRegistration | null = null;
const notifiedBlockKeys = new Set<string>();

/**
 * Register the Service Worker in the browser
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Check current notification permission state
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

/**
 * Dispatch a notification via Service Worker (with desktop Notification fallback)
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    ...options,
  };

  try {
    if (swRegistration && 'showNotification' in swRegistration) {
      await swRegistration.showNotification(title, notificationOptions);
      return true;
    }

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options: notificationOptions,
      });
      return true;
    }

    // Direct browser fallback
    new Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('Failed to display notification:', err);
    return false;
  }
}

/**
 * Send a test notification
 */
export async function sendTestNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') return false;

  return showNotification('CodeWave Daily: Reminders Active! 🚀', {
    body: 'Test notification successful. Reminders will alert you before each scheduled block starts.',
    tag: 'test-notification',
  });
}

export const triggerTestNotification = sendTestNotification;

/**
 * Check today's blocks and trigger notifications N minutes before each block starts
 */
export function checkUpcomingBlockReminders(
  blocks: ScheduleBlock[],
  categories: Category[],
  currentDateStr: string
): void {
  if (getNotificationPermission() !== 'granted') return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  blocks.forEach((block) => {
    // Only check blocks on current date
    if (block.date !== currentDateStr) return;

    const category = categories.find((c) => c.id === block.categoryId);
    // Configurable reminder minutes per category (default to 10 if not set, or 0 if disabled)
    const reminderMinutes = category?.reminderMinutes !== undefined ? category.reminderMinutes : 10;
    if (reminderMinutes <= 0) return;

    const blockStartMinutes = timeToMinutes(block.startTime);
    const timeUntilStart = blockStartMinutes - currentMinutes;

    // Trigger when within 0 to reminderMinutes
    if (timeUntilStart > 0 && timeUntilStart <= reminderMinutes) {
      const notificationKey = `${block.id}-${currentDateStr}-${reminderMinutes}m`;
      if (!notifiedBlockKeys.has(notificationKey)) {
        notifiedBlockKeys.add(notificationKey);

        showNotification(`CodeWave Daily: ${block.title} in ${timeUntilStart}m`, {
          body: `${block.icon} ${block.title} starts at ${block.startTime}. Category: ${category?.name || 'General'}. Ride the wave!`,
          tag: `block-${block.id}`,
        });
      }
    }
  });
}
