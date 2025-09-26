/**
 * React Component Types
 *
 * Props interfaces and component-specific types for React components.
 * Following React and TypeScript best practices.
 */

import type {
  Game, Team, Player, GameEvent, TeamRanking, PlayerStatistics,
  PlayerGamePerformance, GameStatus, LeagueType
} from './domain';

// Common Component Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Game-related Component Props
export interface GameCardProps extends BaseComponentProps {
  game: Game;
  showLeague?: boolean;
  showVenue?: boolean;
  onGameClick?: (gameId: string) => void;
}

export interface GameListProps extends BaseComponentProps {
  games: Game[];
  title?: string;
  showDate?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  onGameClick?: (gameId: string) => void;
}

export interface GameOverviewProps extends BaseComponentProps {
  game: Game;
  gameId: string;
  showHeadToHead?: boolean;
}

export interface GameEventListProps extends BaseComponentProps {
  events: GameEvent[];
  loading?: boolean;
  emptyMessage?: string;
}

export interface LiveGameIndicatorProps extends BaseComponentProps {
  isLive: boolean;
  time?: string;
  period?: string;
}

// Team-related Component Props
export interface TeamLogoProps extends BaseComponentProps {
  team: Team;
  size?: 'small' | 'medium' | 'large';
  showFallback?: boolean;
  alt?: string;
}

export interface TeamCardProps extends BaseComponentProps {
  team: Team;
  onClick?: (teamId: string) => void;
  showStats?: boolean;
}

export interface TeamRankingTableProps extends BaseComponentProps {
  rankings: TeamRanking[];
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
}

// Player-related Component Props
export interface PlayerCardProps extends BaseComponentProps {
  player: Player;
  showStats?: boolean;
  showTeam?: boolean;
  onClick?: (playerId: string) => void;
}

export interface PlayerListProps extends BaseComponentProps {
  players: Player[];
  loading?: boolean;
  emptyMessage?: string;
  onPlayerClick?: (playerId: string) => void;
}

export interface PlayerStatisticsProps extends BaseComponentProps {
  statistics: PlayerStatistics[];
  loading?: boolean;
  groupBySeason?: boolean;
}

export interface PlayerGamePerformanceProps extends BaseComponentProps {
  performances: PlayerGamePerformance[];
  loading?: boolean;
  limit?: number;
}

// Image-related Component Props
export interface ResponsiveImageProps extends BaseComponentProps {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  formats?: string[];
  playerId?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export interface CascadingImageProps extends BaseComponentProps {
  primarySrc?: string;
  fallbackSrc?: string;
  placeholderSrc?: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
}

// Layout Component Props
export interface PageHeaderProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export interface ErrorMessageProps extends BaseComponentProps {
  message: string;
  retry?: () => void;
  showRetry?: boolean;
}

export interface SkeletonProps extends BaseComponentProps {
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
  animation?: 'pulse' | 'wave' | false;
}

// Form Component Props
export interface SearchBarProps extends BaseComponentProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface DatePickerProps extends BaseComponentProps {
  value: Date;
  onChange: (date: Date) => void;
  min?: Date;
  max?: Date;
  disabled?: boolean;
}

export interface LeagueSelectorProps extends BaseComponentProps {
  selectedLeagues: string[];
  availableLeagues: string[];
  onChange: (leagues: string[]) => void;
  multiSelect?: boolean;
}

// Navigation Component Props
export interface TabsProps extends BaseComponentProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    content?: React.ReactNode;
    disabled?: boolean;
  }>;
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: Array<{
    label: string;
    href?: string;
    active?: boolean;
  }>;
  separator?: React.ReactNode;
}

// Modal/Dialog Component Props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnOverlayClick?: boolean;
}

export interface ConfirmDialogProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'info';
}

// Hook Return Types
export interface UseGameDataReturn {
  games: Game[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
}

export interface UsePlayerDataReturn {
  player: Player | null;
  loading: boolean;
  error: string | null;
  statistics: PlayerStatistics[];
  performances: PlayerGamePerformance[];
}

export interface UseTeamDataReturn {
  team: Team | null;
  loading: boolean;
  error: string | null;
  rankings: TeamRanking[];
  upcomingGames: Game[];
}

// Context Types
export interface ThemeContextValue {
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  isDark: boolean;
}

export interface MenuContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

// State Types
export interface GameFilters {
  date?: Date;
  leagues?: string[];
  status?: GameStatus[];
  teams?: string[];
}

export interface PlayerFilters {
  league?: string;
  team?: string;
  position?: string;
  nationality?: string;
}

export interface SearchState {
  query: string;
  results: {
    players: Player[];
    teams: Team[];
    games: Game[];
  };
  loading: boolean;
  hasSearched: boolean;
}

// Animation/Transition Props
export interface AnimationProps {
  duration?: number;
  delay?: number;
  easing?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export interface TransitionProps extends BaseComponentProps {
  show: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
}

// Error Boundary Types
export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}