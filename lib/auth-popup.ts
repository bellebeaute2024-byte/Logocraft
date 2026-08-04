"use client";

export function openGoogleLogin(onComplete?: () => void): Window | null {
  const width = 500;
  const height = 650;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top  = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  const popup = window.open(
    `/api/auth/login`,
    `lc_auth_${crypto.randomUUID()}`,
    `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  );
  if (!popup) return null;

  function receiveCompletion(event: MessageEvent): void {
    if (event.data?.type !== "lc:auth-complete") return;
    window.clearInterval(closedCheck);
    window.removeEventListener("message", receiveCompletion);
    onComplete?.();
  }
  window.addEventListener("message", receiveCompletion);
  const closedCheck = window.setInterval(() => {
    if (!popup.closed) return;
    window.clearInterval(closedCheck);
    window.removeEventListener("message", receiveCompletion);
    onComplete?.();
  }, 500);
  return popup;
}

// backward compat alias
export const openHappySeedsLogin = openGoogleLogin;
