import { act, renderHook } from "@testing-library/react-native";

import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

describe("useDebouncedValue", () => {
  type HookProps = { value: string; delayMs: number };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("updates only after configured delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delayMs }: HookProps) => useDebouncedValue(value, delayMs),
      { initialProps: { value: "A", delayMs: 300 } as HookProps },
    );

    expect(result.current).toBe("A");

    rerender({ value: "B", delayMs: 300 });
    expect(result.current).toBe("A");

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe("A");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("B");
  });
});
