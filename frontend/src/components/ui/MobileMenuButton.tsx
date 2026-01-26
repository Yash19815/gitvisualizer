import { useRepositoryStore } from "../../store/repositoryStore";

interface MobileMenuButtonProps {
  side: "left" | "right";
  className?: string;
}

export function MobileMenuButton({
  side,
  className = "",
}: MobileMenuButtonProps) {
  const { toggleLeftPanel, toggleRightPanel, leftPanelOpen, rightPanelOpen } =
    useRepositoryStore();

  const isOpen = side === "left" ? leftPanelOpen : rightPanelOpen;
  const toggle = side === "left" ? toggleLeftPanel : toggleRightPanel;

  return (
    <button
      onClick={toggle}
      className={`lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      aria-label={`Toggle ${side} panel`}
    >
      {side === "left" ? (
        <svg
          className="w-6 h-6 text-gray-700 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      ) : (
        <svg
          className="w-6 h-6 text-gray-700 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
    </button>
  );
}
