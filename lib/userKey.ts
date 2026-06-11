export function getJobForgeUserKey() {
  if (typeof window === "undefined") return "anonymous";

  let key = window.localStorage.getItem("jobforge-user-key");

  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem("jobforge-user-key", key);
  }

  return key;
}
