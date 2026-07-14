import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { ScrollableTabsList } from "../scrollable-tabs"
import * as React from "react"

// Mock TabsList since we only care about the scrollable container logic
vi.mock("@/components/ui/tabs", () => ({
  TabsList: ({ children, className, ...props }: any) => (
    <div data-testid="tabs-list" className={className} {...props}>
      {children}
    </div>
  ),
}))

describe("ScrollableTabsList", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const setupMocks = (container: HTMLElement, { scrollLeft = 0, scrollWidth = 1000, clientWidth = 500 }) => {
    Object.defineProperty(container, 'scrollLeft', { value: scrollLeft, writable: true, configurable: true })
    Object.defineProperty(container, 'scrollWidth', { value: scrollWidth, writable: true, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: clientWidth, writable: true, configurable: true })
  }

  it("should render children correctly", () => {
    render(
      <ScrollableTabsList>
        <div data-testid="child">Child</div>
      </ScrollableTabsList>
    )
    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  it("should show right arrow when content overflows", async () => {
    const { container } = render(
      <ScrollableTabsList>
        <div>Tab 1</div>
      </ScrollableTabsList>
    )

    const scrollContainer = container.querySelector(".overflow-x-auto") as HTMLElement
    setupMocks(scrollContainer, { scrollLeft: 0, scrollWidth: 1000, clientWidth: 500 })

    await waitFor(() => {
      expect(container.querySelector(".bg-linear-to-l")).toHaveClass("opacity-100")
    })
    
    expect(container.querySelector(".bg-linear-to-r")).toHaveClass("opacity-0")
  })

  it("should show left arrow and hide right arrow when scrolled to end", async () => {
    const { container } = render(
        <ScrollableTabsList>
          <div>Tab 1</div>
        </ScrollableTabsList>
      )
  
      const scrollContainer = container.querySelector(".overflow-x-auto") as HTMLElement
      setupMocks(scrollContainer, { scrollLeft: 500, scrollWidth: 1000, clientWidth: 500 })
  
      fireEvent.scroll(scrollContainer)
  
      await waitFor(() => {
        expect(container.querySelector(".bg-linear-to-l")).toHaveClass("opacity-0")
        expect(container.querySelector(".bg-linear-to-r")).toHaveClass("opacity-100")
      })
  })

  it("should update on window resize", async () => {
    const { container } = render(
        <ScrollableTabsList>
          <div>Tab 1</div>
        </ScrollableTabsList>
      )
  
      const scrollContainer = container.querySelector(".overflow-x-auto") as HTMLElement
      setupMocks(scrollContainer, { scrollLeft: 0, scrollWidth: 400, clientWidth: 500 })
  
      await waitFor(() => {
        expect(container.querySelector(".bg-linear-to-l")).toHaveClass("opacity-0")
      })

      setupMocks(scrollContainer, { scrollLeft: 0, scrollWidth: 1000, clientWidth: 500 })
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(container.querySelector(".bg-linear-to-l")).toHaveClass("opacity-100")
      })
  })

  it("should update when children change", async () => {
    const { container, rerender } = render(
        <ScrollableTabsList>
          <div>Short</div>
        </ScrollableTabsList>
      )
  
      const scrollContainer = container.querySelector(".overflow-x-auto") as HTMLElement
      setupMocks(scrollContainer, { scrollLeft: 0, scrollWidth: 400, clientWidth: 500 })
  
      await waitFor(() => {
        expect(container.querySelector(".bg-linear-to-l")).toHaveClass("opacity-0")
      })

      setupMocks(scrollContainer, { scrollLeft: 0, scrollWidth: 1000, clientWidth: 500 })

      rerender(
        <ScrollableTabsList>
          <div>Very Long Content That Should Overflow</div>
        </ScrollableTabsList>
      )
      
      await waitFor(() => {
        expect(container.querySelector(".bg-linear-to-l")).toHaveClass("opacity-100")
      })
  })

  it("should cleanup event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount, container } = render(<ScrollableTabsList>Tab</ScrollableTabsList>)
    const scrollContainer = container.querySelector(".overflow-x-auto")
    const scrollRemoveSpy = vi.spyOn(scrollContainer!, 'removeEventListener')

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(scrollRemoveSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })

  it("should apply custom class and width", () => {
    render(
        <ScrollableTabsList className="custom-tabs" width="w-[500px]">
          <div>Tab</div>
        </ScrollableTabsList>
      )
    
    expect(screen.getByTestId("tabs-list")).toHaveClass("custom-tabs")
    const container = screen.getByTestId("tabs-list").parentElement
    expect(container).toHaveClass("w-[500px]")
  })

  it("should handle empty width", () => {
    const { container } = render(
        <ScrollableTabsList width="">
          <div>Tab</div>
        </ScrollableTabsList>
      )
    
    const scrollContainer = container.querySelector(".overflow-x-auto")
    expect(scrollContainer).not.toHaveClass("w-full")
  })

  it("should handle rounding issues in scroll calculation", async () => {
    const { container } = render(
      <ScrollableTabsList>
        <div>Tab 1</div>
      </ScrollableTabsList>
    )

    const scrollContainer = container.querySelector(".overflow-x-auto") as HTMLElement
    setupMocks(scrollContainer, { scrollLeft: 0.5, scrollWidth: 500, clientWidth: 499.5 })

    fireEvent.scroll(scrollContainer)

    await waitFor(() => {
      expect(container.querySelector(".bg-linear-to-l")).toHaveClass("opacity-0")
    })
  })
})