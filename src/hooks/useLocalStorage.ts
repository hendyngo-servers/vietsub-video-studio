import { useState, useEffect, useCallback } from "react";

/**
 * Hook useLocalStorage:
 * - Tự động đồng bộ state với window.localStorage
 * - Xử lý an toàn khi localStorage bị đầy, bị chặn trong iFrame hoặc SSR
 * - Hỗ trợ cập nhật hàm (updater function)
 * - Tự động đồng bộ giữa các tab (storage event)
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Lấy giá trị khởi tạo từ localStorage nếu có
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      const parsed = JSON.parse(item);
      // Nếu initialValue là object, merge với giá trị mặc định để tránh mất key mới khi cập nhật version
      if (
        initialValue !== null &&
        typeof initialValue === "object" &&
        !Array.isArray(initialValue) &&
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return { ...initialValue, ...parsed };
      }
      return parsed as T;
    } catch (error) {
      console.warn(`[useLocalStorage] Lỗi khi đọc key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Hàm cập nhật state và lưu vào localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((current) => {
          const valueToStore =
            typeof value === "function"
              ? (value as (val: T) => T)(current)
              : value;

          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            // Phát custom event để đồng bộ nội bộ trong cùng cửa sổ
            window.dispatchEvent(
              new CustomEvent("local-storage-sync", {
                detail: { key, value: valueToStore },
              })
            );
          }

          return valueToStore;
        });
      } catch (error) {
        console.warn(`[useLocalStorage] Lỗi khi ghi key "${key}":`, error);
      }
    },
    [key]
  );

  // Lắng nghe thay đổi từ các tab khác hoặc từ event đồng bộ
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent | CustomEvent) => {
      if ("key" in event && event.key !== key) return;
      if ("detail" in event && event.detail?.key !== key) return;

      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          setStoredValue((prev) => {
            if (
              initialValue !== null &&
              typeof initialValue === "object" &&
              !Array.isArray(initialValue) &&
              parsed !== null &&
              typeof parsed === "object" &&
              !Array.isArray(parsed)
            ) {
              return { ...initialValue, ...parsed };
            }
            return parsed;
          });
        }
      } catch {
        // bỏ qua lỗi parse
      }
    };

    window.addEventListener("storage", handleStorageChange as EventListener);
    window.addEventListener("local-storage-sync", handleStorageChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange as EventListener);
      window.removeEventListener("local-storage-sync", handleStorageChange as EventListener);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
