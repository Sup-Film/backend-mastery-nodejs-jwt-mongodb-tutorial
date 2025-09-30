/**
 * Generate a random username (e.g. user-abc123)
 */

export const genUsername = (): string => {
  const uernamePrefix = 'user-';
  const randomChart = Math.random().toString(36).slice(2); // แปลงเลขสุ่มเป็นฐาน 36 แล้วตัด "0."

  const username = uernamePrefix + randomChart;

  return username;
}