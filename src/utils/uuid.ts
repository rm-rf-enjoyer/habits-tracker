export const generateSafeId = (): string => {
  // Проверяем, доступен ли стандартный метод (на случай HTTPS)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Фолбек для обычного HTTP (Android WebView)
  // Генерируем строку вида: "8b2f1-4c5d-..."
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
